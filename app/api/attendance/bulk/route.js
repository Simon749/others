import { db } from "../../../../utils";
import { attendance, students, GRADES, STREAMS } from "@/utils/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

import { validateAttendanceEntry, formatValidationResponse } from "../../middleware/validate";
import { logAttendanceChange } from "../../middleware/audit";
import { checkPermission, USER_ROLES } from "../../middleware/permissions";

const resolveGradeAndStreamIds = async ({ studentId, grade, stream, gradeId, streamId }) => {
    if (gradeId && streamId) return { gradeId, streamId };

    if (gradeId && !streamId && stream) {
        const streamRecord = await db.select().from(STREAMS).where(and(eq(STREAMS.gradeId, gradeId), eq(STREAMS.streamName, stream))).limit(1);
        return { gradeId, streamId: streamRecord?.[0]?.id || null };
    }

    if (studentId) {
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

export async function POST(request) {
    const body = await request.json();
    const entries = Array.isArray(body) ? body : body.attendances || body.entries;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return NextResponse.json(
            { success: false, error: "Bulk attendance payload must be an array of attendance entries." },
            { status: 400 }
        );
    }

    for (const entry of entries) {
        const validation = await validateAttendanceEntry(entry);
        if (!validation.valid) {
            return NextResponse.json(
                {
                    success: false,
                    ...formatValidationResponse(validation),
                    error: "One or more attendance entries are invalid.",
                },
                { status: 400 }
            );
        }
    }

    const userId = body.userId || entries[0].userId || 1;
    const userRole = body.userRole || entries[0].userRole || USER_ROLES.CLASS_TEACHER;

    if (!checkPermission(userRole, "attendance:create")) {
        return NextResponse.json(
            { error: "Permission denied - only teachers can mark attendance." },
            { status: 403 }
        );
    }

    const processed = [];
    const errors = [];

    for (const entry of entries) {
        try {
            const payload = await buildAttendancePayload({ ...entry, userId });
            const existing = await db.select().from(attendance)
                .where(and(
                    eq(attendance.studentId, payload.studentId),
                    eq(attendance.date, payload.date),
                    eq(attendance.day, payload.day)
                ))
                .limit(1);

            let result;
            let action;
            let previousPresent = null;

            if (existing.length > 0) {
                previousPresent = existing[0].present;
                result = await db.update(attendance)
                    .set({
                        present: payload.present,
                        reason: payload.reason,
                        lastModifiedBy: payload.lastModifiedBy,
                        lastModifiedAt: new Date(),
                    })
                    .where(eq(attendance.id, existing[0].id))
                    .returning();
                action = "updated";
                await logAttendanceChange(existing[0].id, userId, previousPresent, payload.present, payload.reason, request);
            } else {
                result = await db.insert(attendance).values(payload).returning();
                action = "created";
                await logAttendanceChange(result[0].id, userId, null, payload.present, payload.reason, request);
            }

            processed.push({
                studentId: payload.studentId,
                date: payload.date,
                day: payload.day,
                action,
                attendanceId: result[0]?.id || null,
            });
        } catch (error) {
            console.error("Bulk attendance error for entry:", entry, error);
            errors.push({ entry, message: error.message });
        }
    }

    return NextResponse.json({
        success: errors.length === 0,
        processedCount: processed.length,
        processed,
        errors,
    });
}
