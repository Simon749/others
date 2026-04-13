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
    const data = await request.json();

    // 1. Get the authenticated user from your session (the real teacher)
    const { getUser } = getKindeServerSession();
    const authUser = await getUser();


    // 2. Look up the ID from your database table
    const [dbUser] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.kindeId, authUser.id)) // Use your Kinde ID here
        .limit(1);

    if (!dbUser) {
        return NextResponse.json({ error: "User not found in system" }, { status: 401 });
    }


    const userId = dbUser.id;

    try {
        // Get current user (TODO: from session/JWT after auth setup)
        const userId = data.userId || 1; // Temporary - will use session later
        const userRole = data.userRole || USER_ROLES.CLASS_TEACHER;

        // PHASE 1: CHECK PERMISSIONS
        if (!checkPermission(userRole, "attendance:create")) {
            return NextResponse.json(
                { error: "Permission denied - only teachers can mark attendance" },
                { status: 403 }
            );
        }

        const payload = await buildAttendancePayload({ ...data, userId });

        // Check if attendance already exists
        const existing = await db.select().from(attendance)
            .where(and(
                eq(attendance.studentId, data.studentId),
                eq(attendance.date, data.date),
                eq(attendance.day, payload.day)
            ))
            .limit(1);

        let result;

        if (existing.length > 0) {
            // UPDATE EXISTING
            const previousValue = existing[0].present;

            result = await db.update(attendance)
                .set({
                    present: payload.present,
                    reason: payload.reason,
                    lastModifiedBy: payload.lastModifiedBy,
                    lastModifiedAt: new Date(),
                })
                .where(eq(attendance.id, existing[0].id))
                .returning();

            // PHASE 1: LOG THE CHANGE
            await logAttendanceChange(
                existing[0].id,
                userId,
                previousValue,
                payload.present,
                payload.reason,
                request
            );

            return NextResponse.json({
                success: true,
                message: "Attendance updated successfully",
                data: result[0],
                action: "updated",
            });
        } else {
            // INSERT NEW
            result = await db.insert(attendance)
                .values(payload)
                .returning();

            // PHASE 1: LOG THE NEW ENTRY
            await logAttendanceChange(
                result[0].id,
                userId,
                null,
                payload.present,
                payload.reason,
                request
            );

            return NextResponse.json({
                success: true,
                message: "Attendance marked successfully",
                data: result[0],
                action: "created",
            });
        }
    } catch (error) {
        console.error("Error marking attendance:", error);
        return NextResponse.json(
            {
                error: "Failed to mark attendance",
                details: error.message,
            },
            { status: 500 }
        );
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
    
    // ... lookup user logic ...
    const userId = dbUser.id; // retrieved from db

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