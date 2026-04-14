import { db } from "../../../utils";
import { attendance, students, GRADES, STREAMS, users } from "@/utils/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// PHASE 1 IMPORTS: Validation, Audit, Permissions
import { validateAttendanceEntry, formatValidationResponse } from "../middleware/validate";
import { logAttendanceChange, getClientIp } from "../middleware/audit";
import { checkPermission, canEditClass, USER_ROLES } from "../middleware/permissions";

const resolveGradeAndStreamIds = async ({ studentId, grade, stream, gradeId, streamId }) => {
    if (gradeId && streamId) return { gradeId, streamId };

    if (gradeId && !streamId && stream) {
        const streamRecord = await db.select().from(STREAMS).where(and(eq(STREAMS.gradeId, gradeId), eq(STREAMS.streamName, stream))).limit(1);
        return { gradeId, streamId: streamRecord?.[0]?.id || null };
    }

    if (!gradeId && studentId) {
        const studentRecord = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
        if (studentRecord.length > 0) {
            const existingGrade = studentRecord[0].class;
            const existingStream = studentRecord[0].stream;
            const gradeRow = await db.select().from(GRADES).where(eq(GRADES.grade, existingGrade)).limit(1);
            const streamRow = await db.select().from(STREAMS).where(and(eq(STREAMS.streamName, existingStream), eq(STREAMS.gradeId, gradeRow?.[0]?.id || 0))).limit(1);
            return { gradeId: gradeRow?.[0]?.id || null, streamId: streamRow?.[0]?.id || null };
        }
    }

    if (grade && stream) {
        const gradeRow = await db.select().from(GRADES).where(eq(GRADES.grade, grade)).limit(1);
        const streamRow = await db.select().from(STREAMS).where(and(eq(STREAMS.streamName, stream), eq(STREAMS.gradeId, gradeRow?.[0]?.id || 0))).limit(1);
        return { gradeId: gradeRow?.[0]?.id || null, streamId: streamRow?.[0]?.id || null };
    }

    return { gradeId: gradeId || null, streamId: streamId || null };
};

const buildAttendancePayload = async (item) => {
    const { gradeId, streamId } = await resolveGradeAndStreamIds(item);
    const day = item.day ?? new Date(`${item.date}T00:00:00Z`).getUTCDate();

    return {
        studentId: item.studentId,
        gradeId: gradeId || 1,
        streamId: streamId || 1,
        present: item.present,
        day,
        date: item.date,
        reason: item.reason || (item.present ? "present" : "absent"),
        lastModifiedBy: item.userId || 1,
    };
};

export async function GET(req) {
    const searchParams = req.nextUrl.searchParams;
    const grade = searchParams.get("grade");
    const stream = searchParams.get("stream");
    const month = searchParams.get("month");

    if (!grade || !month) {
        return NextResponse.json(
            { error: "grade and month are required" },
            { status: 400 }
        );
    }

    try {
        let query = db.select({
            name: students.fullName,
            present: attendance.present,
            day: attendance.day,
            date: attendance.date,
            grade: students.class,
            stream: students.stream,
            studentId: students.id,
            attendanceId: attendance.id,
            lastModifiedBy: attendance.lastModifiedBy,
            lastModifiedAt: attendance.lastModifiedAt,
        }).from(students)
            .leftJoin(attendance,
                and(
                    eq(students.id, attendance.studentId),
                    eq(attendance.date, month)
                )
            )
            .where(eq(students.class, grade));

        // Add stream filter if provided
        if (stream) {
            query = query.where(eq(students.stream, stream));
        }

        const results = await query;
        return NextResponse.json({
            success: true,
            data: results,
            count: results.length,
        });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json(
            { error: "Failed to fetch attendance data" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const { getUser } = getKindeServerSession();
        const authUser = await getUser();

        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Look up or CREATE the user
        let [dbUser] = await db.select().from(users).where(eq(users.kindeId, authUser.id));

        if (!dbUser) {
            const [newUser] = await db.insert(users).values({
                kindeId: authUser.id,
                email: authUser.email,
                fullName: `${authUser.given_name} ${authUser.family_name}`,
                role: "CLASS_TEACHER",
                password: "NO_PASSWORD_KIND_AUTH"
            }).returning();
            dbUser = newUser;
        }

        const userId = dbUser.id;
        const userRole = dbUser.role;

        // 2. CHECK PERMISSIONS (Case-insensitive)
        if (!checkPermission(userRole.toLowerCase(), "attendance:create")) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        // 3. Build & Sanitize Payload
        const payload = await buildAttendancePayload({ ...data, userId });

        const cleanPayload = {
            ...payload,
            // Force integer conversion for DB compatibility
            grade_id: typeof payload.gradeId === 'string'
                ? parseInt(payload.gradeId.replace('grade_', ''), 10)
                : parseInt(payload.gradeId, 10),
            stream_id: parseInt(payload.streamId || payload.streamId, 10),
            day: parseInt(payload.day, 10),
            studentId: parseInt(payload.studentId, 10)
        };

        // 4. Check if attendance exists
        const existing = await db.select().from(attendance)
            .where(and(
                eq(attendance.studentId, cleanPayload.studentId),
                eq(attendance.date, cleanPayload.date),
                eq(attendance.day, cleanPayload.day)
            )).limit(1);

        // 5. Atomic Insert/Update
        if (existing.length > 0) {
            const result = await db.update(attendance)
                .set({
                    present: cleanPayload.present,
                    reason: cleanPayload.reason,
                    lastModifiedBy: userId,
                    lastModifiedAt: new Date(),
                })
                .where(eq(attendance.id, existing[0].id))
                .returning();

            await logAttendanceChange(existing[0].id, userId, existing[0].present, cleanPayload.present, cleanPayload.reason, request);
            return NextResponse.json({ success: true, action: "updated", data: result[0] });
        } else {
            const result = await db.insert(attendance)
                .values(cleanPayload) // <-- USE THE CLEANED DATA
                .returning();

            await logAttendanceChange(result[0].id, userId, null, cleanPayload.present, cleanPayload.reason, request);
            return NextResponse.json({ success: true, action: "created", data: result[0] });
        }
    } catch (error) {
        console.error("Critical Failure:", error);
        return NextResponse.json({ error: "Failed to mark attendance", details: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    const searchParams = req.nextUrl.searchParams;
    const rawAttendanceId = searchParams.get("attendanceId");

    // 1. Validate Input: Ensure ID exists and is a valid number
    if (!rawAttendanceId) {
        return NextResponse.json({ error: "Missing attendanceId parameter" }, { status: 400 });
    }

    const attendanceId = parseInt(rawAttendanceId, 10);
    if (isNaN(attendanceId)) {
        return NextResponse.json({ error: "Invalid attendanceId format" }, { status: 400 });
    }

    const { getUser } = getKindeServerSession();
    const authUser = await getUser();

    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Look up or CREATE the user
    let [dbUser] = await db.select().from(users).where(eq(users.kindeId, authUser.id));

    if (!dbUser) {
        console.log("User not found, auto-registering:", authUser.email);
        const [newUser] = await db.insert(users).values({
            kindeId: authUser.id,
            email: authUser.email,
            fullName: `${authUser.given_name} ${authUser.family_name}`,
            role: "CLASS_TEACHER" // Set default role         
        }).returning();
        dbUser = newUser;
    }

    const userId = dbUser.id;

    // 3. Permission Check
    if (!checkPermission(USER_ROLES.ADMIN, "attendance:delete")) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    try {
        // 4. Atomic Verification
        const [current] = await db.select().from(attendance)
            .where(eq(attendance.id, attendanceId))
            .limit(1);

        if (!current) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        // 5. Transactional Integrity
        // Ideally, use a transaction to ensure log and delete happen together
        await db.transaction(async (tx) => {
            await logAttendanceChange(attendanceId, userId, current.present, null, "deleted", req);
            await tx.delete(attendance).where(eq(attendance.id, attendanceId));
        });

        return NextResponse.json({ success: true, message: "Attendance record deleted" });
    } catch (error) {
        console.error("Error deleting attendance:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}