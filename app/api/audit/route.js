// app/api/audit/route.js
// PHASE 1: AUDIT TRAIL ENDPOINT - VIEW CHANGE HISTORY

import { db } from "../../../utils";
import { auditLogs, attendance, students, users } from "@/utils/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuditSummary, formatAuditResponse } from "../middleware/audit";
import { checkPermission, USER_ROLES } from "../middleware/permissions";

/**
 * GET /api/audit
 * Get audit trail - all changes or filtered by attendance ID
 */
export async function GET(req) {
    const searchParams = req.nextUrl.searchParams;
    const attendanceId = searchParams.get("attendanceId");
    const limit = parseInt(searchParams.get("limit")) || 100;
    const offset = parseInt(searchParams.get("offset")) || 0;

    try {
        let query = db.select({
            id: auditLogs.id,
            attendanceId: auditLogs.attendanceId,
            previousValue: auditLogs.previousValue,
            newValue: auditLogs.newValue,
            reason: auditLogs.reason,
            ipAddress: auditLogs.ipAddress,
            userAgent: auditLogs.userAgent,
            changedAt: auditLogs.changedAt,
            changedBy: auditLogs.changedBy,
        }).from(auditLogs);

        // Filter by attendance ID if provided
        if (attendanceId) {
            query = query.where(eq(auditLogs.attendanceId, parseInt(attendanceId)));
        }

        // Get total count
        const countResult = await db.select().from(auditLogs);
        const total = countResult.length;

        // Get paginated results
        const logs = await query
            .orderBy(desc(auditLogs.changedAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            success: true,
            data: logs.map(formatAuditResponse),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/audit/student/[id]
 * Get all attendance changes for a specific student
 */
export async function getStudentAuditTrail(studentId) {
    try {
        // Get all attendance records for this student
        const studentAttendance = await db.select({
            id: attendance.id,
        }).from(attendance)
            .where(eq(attendance.studentId, parseInt(studentId)));

        // Get all audit logs for these attendance records
        const allLogs = [];
        for (const record of studentAttendance) {
            const logs = await db.select().from(auditLogs)
                .where(eq(auditLogs.attendanceId, record.id))
                .orderBy(desc(auditLogs.changedAt));
            allLogs.push(...logs);
        }

        return allLogs.map(formatAuditResponse);
    } catch (error) {
        console.error("Error fetching student audit trail:", error);
        return [];
    }
}

/**
 * GET /api/audit/user/[userId]
 * Get all changes made by a specific user (for admin/compliance)
 */
export async function getUserActions(userId) {
    try {
        return await db.select()
            .from(auditLogs)
            .where(eq(auditLogs.changedBy, parseInt(userId)))
            .orderBy(desc(auditLogs.changedAt));
    } catch (error) {
        console.error("Error fetching user actions:", error);
        return [];
    }
}

/**
 * POST /api/audit/export
 * Export audit logs as CSV (compliance/admin feature)
 */
export async function exportAuditLogs(filters = {}) {
    try {
        let query = db.select().from(auditLogs);

        if (filters.startDate) {
            query = query.where(
                and(
                    (logs) => logs.changedAt >= new Date(filters.startDate)
                )
            );
        }

        const logs = await query.orderBy(desc(auditLogs.changedAt));

        // Format as CSV
        const csv = convertToCSV(logs);
        return csv;
    } catch (error) {
        console.error("Error exporting audit logs:", error);
        return "";
    }
}

function convertToCSV(data) {
    if (data.length === 0) return "No records found";

    const headers = ["ID", "Attendance ID", "Before", "After", "Reason", "Changed By", "Changed At", "IP Address"];
    const rows = data.map(log => [
        log.id,
        log.attendanceId,
        log.previousValue ? "Present" : "Absent",
        log.newValue ? "Present" : "Absent",
        log.reason,
        log.changedBy,
        new Date(log.changedAt).toLocaleString(),
        log.ipAddress,
    ]);

    const csv = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    return csv;
}
