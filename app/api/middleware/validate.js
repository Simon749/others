// app/api/middleware/validate.js
// PHASE 1: VALIDATION RULES FOR ATTENDANCE

import { db } from "../../../utils";
import { schoolHolidays } from "@/utils/schema";
import { and, lte, gte } from "drizzle-orm";

/**
 * Core validation rules for attendance entries
 * Returns { valid: boolean, errors: string[], warnings: string[] }
 */
export const validateAttendanceEntry = async (data) => {
  const errors = [];
  const warnings = [];

  // 1. CHECK REQUIRED FIELDS
  if (!data.studentId) errors.push("❌ Student ID is required");
  if (!data.date) errors.push("❌ Date is required");
  if (data.present === undefined) errors.push("❌ Attendance status (present/absent) is required");

  if (errors.length > 0) return { valid: false, errors, warnings };

  // 2. VALIDATE DATE FORMAT (YYYY-MM-DD)
  if (!isValidDateFormat(data.date)) {
    errors.push("❌ Invalid date format. Use YYYY-MM-DD");
  }

  const entryDate = new Date(data.date + "T00:00:00Z");

  // 3. CANNOT MARK FUTURE DATES
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  if (entryDate > today) {
    errors.push("❌ Cannot mark attendance for future dates");
  }

  // 4. WARNING: CANNOT MARK VERY OLD DATES (>30 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (entryDate < thirtyDaysAgo && entryDate <= today) {
    warnings.push("⚠️ This is an old entry (>30 days ago). Double-check date.");
  }

  // 5. CANNOT MARK WEEKENDS
  const dayOfWeek = entryDate.getUTCDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    errors.push("❌ Cannot mark attendance on weekends (Saturday/Sunday)");
  }

  // 6. CANNOT MARK SCHOOL HOLIDAYS
  const isHoliday = await checkIfHoliday(data.date);
  if (isHoliday) {
    errors.push("❌ This date is a school holiday - cannot mark attendance");
  }

  // 7. VALIDATE REASON IF PROVIDED
  const validReasons = ["manual_entry", "correction", "excused", "medical", "family", "school_event", "unknown"];
  if (data.reason && !validReasons.includes(data.reason)) {
    errors.push(`❌ Invalid reason. Must be one of: ${validReasons.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Check if a date is a school holiday
 */
export const checkIfHoliday = async (dateString) => {
  try {
    const date = new Date(dateString + "T00:00:00Z");
    
    const holiday = await db.select()
      .from(schoolHolidays)
      .where(and(
        lte(schoolHolidays.startDate, date),
        gte(schoolHolidays.endDate, date)
      ))
      .limit(1);

    return holiday.length > 0;
  } catch (error) {
    console.error("Error checking holiday:", error);
    return false; // If we can't check, allow it
  }
};

/**
 * Validate date is in YYYY-MM-DD format
 */
function isValidDateFormat(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString + "T00:00:00Z");
  return date instanceof Date && !isNaN(date);
}

/**
 * Format validation errors for response
 */
export const formatValidationResponse = (validation) => {
  const response = {
    isValid: validation.valid,
    timestamp: new Date().toISOString(),
  };

  if (validation.errors.length > 0) {
    response.errors = validation.errors;
  }

  if (validation.warnings.length > 0) {
    response.warnings = validation.warnings;
  }

  return response;
};
