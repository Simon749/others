import { db } from "../../../utils";
import { attendance, students } from "@/utils/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

// PHASE 1 IMPORTS: Validation, Audit, Permissions
import { validateAttendanceEntry, formatValidationResponse } from "../middleware/validate";
import { logAttendanceChange, getClientIp } from "../middleware/audit";
import { checkPermission, canEditClass, USER_ROLES } from "../middleware/permissions";

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

    // PHASE 1: VALIDATE INPUT
    const validation = await validateAttendanceEntry(data);
    if (!validation.valid) {
        return NextResponse.json(
            {
                success: false,
                ...formatValidationResponse(validation),
            },
            { status: 400 }
        );
    }

    try {
        // Get current user (TODO: from session/JWT after auth setup)
        const userId = data.userId || 1; // Temporary - will use session later
        
        // PHASE 1: CHECK PERMISSIONS
        if (!checkPermission(USER_ROLES.CLASS_TEACHER, "attendance:create")) {
            return NextResponse.json(
                { error: "Permission denied - only teachers can mark attendance" },
                { status: 403 }
            );
        }

        // Check if attendance already exists
        const existing = await db.select().from(attendance)
            .where(and(
                eq(attendance.studentId, data.studentId),
                eq(attendance.date, data.date)
            ))
            .limit(1);

        let result;
        
        if (existing.length > 0) {
            // UPDATE EXISTING
            const previousValue = existing[0].present;
            
            result = await db.update(attendance)
                .set({
                    present: data.present,
                    lastModifiedBy: userId,
                    lastModifiedAt: new Date(),
                })
                .where(eq(attendance.id, existing[0].id))
                .returning();

            // PHASE 1: LOG THE CHANGE
            await logAttendanceChange(
                existing[0].id,
                userId,
                previousValue,
                data.present,
                data.reason,
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
                .values({
                    studentId: data.studentId,
                    gradeId: data.gradeId || 1, // Get from form data
                    streamId: data.streamId || 1, // Get from form data
                    present: data.present,
                    day: data.day || new Date(data.date).getDate(),
                    date: data.date,
                    lastModifiedBy: userId,
                })
                .returning();

            // PHASE 1: LOG THE NEW ENTRY
            await logAttendanceChange(
                result[0].id,
                userId,
                null,
                data.present,
                data.reason || "initial_entry",
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
    const attendanceId = searchParams.get("attendanceId");
    const userId = searchParams.get("userId") || 1; // Temporary

    // PHASE 1: CHECK PERMISSIONS
    if (!checkPermission(USER_ROLES.ADMIN, "attendance:delete")) {
        return NextResponse.json(
            { error: "Permission denied - only admins can delete attendance" },
            { status: 403 }
        );
    }

    try {
        // Get current record before deleting (for audit)
        const current = await db.select().from(attendance)
            .where(eq(attendance.id, parseInt(attendanceId)))
            .limit(1);

        if (current.length === 0) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        // PHASE 1: LOG THE DELETION
        await logAttendanceChange(
            parseInt(attendanceId),
            userId,
            current[0].present,
            null, // Deleted
            "deleted",
            req
        );

        const result = await db.delete(attendance)
            .where(eq(attendance.id, parseInt(attendanceId)));

        return NextResponse.json({
            success: true,
            message: "Attendance record deleted",
            data: result,
        });
    } catch (error) {
        console.error("Error deleting attendance:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}