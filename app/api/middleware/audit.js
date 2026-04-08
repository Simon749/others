// app/api/middleware/audit.js
// PHASE 1: AUDIT LOGGING - TRACK ALL CHANGES

import { db } from "../../../utils";
import { auditLogs } from "@/utils/schema";

/**
 * Log an attendance change to audit trail
 * Called after every attendance modification
 */
export const logAttendanceChange = async (
  attendanceId,
  changedBy,
  previousValue,
  newValue,
  reason,
  request
) => {
  try {
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "Unknown";

    await db.insert(auditLogs).values({
      attendanceId,
      changedBy,
      previousValue,
      newValue,
      reason: reason || "manual_entry",
      ipAddress,
      userAgent,
      changedAt: new Date(),
    });

    console.log(`✓ Audit logged: Attendance ${attendanceId} changed by user ${changedBy}`);
    return true;
  } catch (error) {
    console.error("❌ Audit logging failed:", error);
    // Don't break the main operation if audit fails
    // But log it for monitoring
    return false;
  }
};

/**
 * Get change history for an attendance record
 */
export const getAttendanceHistory = async (attendanceId) => {
  try {
    const history = await db.query.auditLogs.findMany({
      where: (logs, { eq }) => eq(logs.attendanceId, parseInt(attendanceId)),
      with: {
        // Join with users table if relations are set up
      },
      orderBy: (logs, { desc }) => [desc(logs.changedAt)],
    });

    return history;
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};

/**
 * Extract client IP from request
 * Handles proxies (x-forwarded-for) and direct connections
 */
export const getClientIp = (request) => {
  try {
    // Check for forwarded IP (behind proxy)
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    // Direct connection
    return request.ip || request.socket?.remoteAddress || "Unknown";
  } catch {
    return "Unknown";
  }
};

/**
 * Format audit trail for API response
 */
export const formatAuditResponse = (auditRecord) => {
  return {
    id: auditRecord.id,
    attendanceId: auditRecord.attendanceId,
    before: auditRecord.previousValue ? "Present ✓" : "Absent ✗",
    after: auditRecord.newValue ? "Present ✓" : "Absent ✗",
    changedBy: auditRecord.changedBy, // Will show user ID, can join with users table for name
    reason: auditRecord.reason,
    changedAt: new Date(auditRecord.changedAt).toLocaleString(),
    timestamp: new Date(auditRecord.changedAt).toISOString(),
  };
};

/**
 * Get full audit trail summary for admin
 */
export const getAuditSummary = async (filters = {}) => {
  try {
    // Basic query - can be extended with more filters
    const logs = await db.select().from(auditLogs)
      .orderBy((logs) => [desc(logs.changedAt)])
      .limit(filters.limit || 100);

    return logs.map(formatAuditResponse);
  } catch (error) {
    console.error("Error getting audit summary:", error);
    return [];
  }
};
