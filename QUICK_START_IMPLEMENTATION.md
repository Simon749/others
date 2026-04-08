# 🔥 QUICK-START: Critical Fixes (First 2 Weeks)

## Week 1: Audit Trail + Permissions

### Step 1: Add Audit Log Table (Day 1)

```sql
-- Add this to your schema
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    attendance_id INTEGER NOT NULL,
    changed_by INTEGER NOT NULL,
    previous_value BOOLEAN,
    new_value BOOLEAN,
    reason VARCHAR(255),
    ip_address VARCHAR(45),
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Add to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS last_modified_by INTEGER;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMP DEFAULT NOW();
```

### Step 2: Update Schema (Drizzle)

```javascript
// utils/schema.js - ADD THIS

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  attendanceId: integer('attendance_id').references(() => attendance.id).notNull(),
  changedBy: integer('changed_by').references(() => users.id).notNull(),
  previousValue: boolean('previous_value'),
  newValue: boolean('new_value'),
  reason: varchar('reason', { length: 255 }), // "Manual entry", "Correction", "Excused"
  ipAddress: varchar('ip_address', { length: 45 }),
  changedAt: timestamp('changed_at').defaultNow(),
})

// Update attendance table
export const attendance = pgTable('attendance', {
  // ... existing fields ...
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at').defaultNow(),
})
```

### Step 3: Create Audit Logging Middleware

```javascript
// app/api/middleware/auditLog.js

export const logAttendanceChange = async (attendanceId, changedBy, previousValue, newValue, reason, ipAddress) => {
  try {
    await db.insert(auditLogs).values({
      attendanceId,
      changedBy,
      previousValue,
      newValue,
      reason,
      ipAddress,
      changedAt: new Date(),
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't break the main operation if audit fails
  }
};

// Middleware to inject user info & IP
export const getClientIp = (req) => {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0];
};
```

### Step 4: Update Attendance API with Audit

```javascript
// app/api/attendance/route.js - UPDATE POST

import { logAttendanceChange, getClientIp } from '../middleware/auditLog';

export async function POST(request) {
  const data = await request.json();
  const userId = data.userId; // Pass from frontend
  const clientIp = getClientIp(request);

  try {
    // Check if record exists
    const existing = await db.select().from(attendance)
      .where(and(
        eq(attendance.studentId, data.studentId),
        eq(attendance.date, data.date)
      )).limit(1);

    let previousValue = null;
    if (existing.length > 0) {
      previousValue = existing[0].present;
      
      // Log the change
      await logAttendanceChange(
        existing[0].id,
        userId,
        previousValue,
        data.present,
        data.reason || 'Manual entry',
        clientIp
      );

      // Update existing
      await db.update(attendance)
        .set({
          present: data.present,
          lastModifiedBy: userId,
          lastModifiedAt: new Date(),
        })
        .where(eq(attendance.id, existing[0].id));
    } else {
      // Insert new
      const result = await db.insert(attendance).values({
        studentId: data.studentId,
        date: data.date,
        day: new Date(data.date).getDate(),
        present: data.present,
        lastModifiedBy: userId,
      }).returning();

      await logAttendanceChange(
        result[0].id,
        userId,
        null,
        data.present,
        data.reason || 'Initial entry',
        clientIp
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Step 5: View Audit Trail Endpoint

```javascript
// app/api/attendance/[id]/audit/route.js - NEW

import { db } from "../../../../utils";
import { auditLogs, users } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const attendanceId = params.id;

  try {
    const audit = await db.select({
      id: auditLogs.id,
      previousValue: auditLogs.previousValue,
      newValue: auditLogs.newValue,
      reason: auditLogs.reason,
      changedBy: users.fullName,
      changedAt: auditLogs.changedAt,
      ipAddress: auditLogs.ipAddress,
    }).from(auditLogs)
      .leftJoin(users, eq(auditLogs.changedBy, users.id))
      .where(eq(auditLogs.attendanceId, parseInt(attendanceId)))
      .orderBy(desc(auditLogs.changedAt));

    return NextResponse.json({ audit });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Step 6: Add Audit UI Component

```javascript
// app/dashboard/attendance/_components/AuditTrail.jsx

"use client"
import React, { useState } from 'react';
import { HistoryIcon } from 'lucide-react';

function AuditTrail({ attendanceId }) {
  const [showAudit, setShowAudit] = useState(false);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/${attendanceId}/audit`);
      const data = await res.json();
      setAudit(data.audit);
      setShowAudit(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={fetchAudit}
        className="text-blue-500 hover:underline flex gap-1 items-center"
      >
        <HistoryIcon size={16} /> History
      </button>

      {showAudit && (
        <div className="mt-4 p-4 bg-gray-50 rounded border">
          <h3 className="font-bold mb-3">Change History</h3>
          {loading ? (
            <p>Loading...</p>
          ) : audit.length === 0 ? (
            <p className="text-gray-500">No changes yet</p>
          ) : (
            <div className="space-y-2 text-sm">
              {audit.map((change, idx) => (
                <div key={idx} className="border-l-2 border-blue-300 pl-3 py-1">
                  <div className="font-semibold">
                    {change.previousValue ? '✓' : '✗'} → {change.newValue ? '✓' : '✗'}
                  </div>
                  <div className="text-gray-600">
                    Changed by: {change.changedBy} on {new Date(change.changedAt).toLocaleString()}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Reason: {change.reason} | IP: {change.ipAddress}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AuditTrail;
```

---

## Week 2: Validation Rules + Bulk Operations

### Step 1: Add Validation Rules

```javascript
// app/api/attendance/validate.js

export const validateAttendanceEntry = async (data) => {
  const errors = [];
  const warnings = [];

  // Rule 1: Cannot mark future dates
  const entryDate = new Date(data.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (entryDate > today) {
    errors.push("❌ Cannot mark attendance for future dates");
  }

  // Rule 2: Cannot mark past dates beyond 30 days
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (entryDate < thirtyDaysAgo) {
    warnings.push("⚠️ This is an old entry (>30 days). Please verify.");
  }

  // Rule 3: Check if weekend
  const dayOfWeek = entryDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    errors.push("❌ Cannot mark attendance on weekends");
  }

  // Rule 4: Check if holiday
  const isHoliday = await checkIfHoliday(data.date);
  if (isHoliday) {
    errors.push("❌ This date is a school holiday");
  }

  // Rule 5: Check for duplicate
  const existing = await db.select().from(attendance)
    .where(and(
      eq(attendance.studentId, data.studentId),
      eq(attendance.date, data.date)
    )).limit(1);

  if (existing.length > 0 && !data.updateExisting) {
    errors.push("❌ Attendance already recorded for this student on this date");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

export const checkIfHoliday = async (date) => {
  // TODO: Implement holiday checking from schoolHolidays table
  return false;
};
```

### Step 2: Add School Holidays Table

```javascript
// utils/schema.js - ADD

export const schoolHolidays = pgTable('school_holidays', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // "Easter Holiday"
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
})
```

### Step 3: Bulk Operations Endpoint

```javascript
// app/api/attendance/bulk/route.js - NEW

import { db } from "../../../../utils";
import { attendance, students } from "@/utils/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { validateAttendanceEntry } from "../validate";

export async function POST(request) {
  const data = await request.json();
  const { grade, stream, date, action, userId } = data;
  // action = "present", "absent", or "clear"

  if (!grade || !date || !action || !userId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Get all students in this grade/stream
    const studentList = await db.select({
      id: students.id,
    }).from(students)
      .where(and(
        eq(students.class, grade),
        stream ? eq(students.stream, stream) : undefined
      ));

    if (studentList.length === 0) {
      return NextResponse.json({ error: "No students found" }, { status: 404 });
    }

    // Validate the date
    const validation = await validateAttendanceEntry({ date, studentId: null });
    if (!validation.valid) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    const results = [];
    let success = 0;
    let failed = 0;

    // Process each student
    for (const student of studentList) {
      try {
        const existing = await db.select().from(attendance)
          .where(and(
            eq(attendance.studentId, student.id),
            eq(attendance.date, date)
          )).limit(1);

        if (existing.length > 0) {
          if (action === 'clear') {
            // Delete
            await db.delete(attendance)
              .where(eq(attendance.id, existing[0].id));
          } else {
            // Update
            await db.update(attendance)
              .set({ present: action === 'present' })
              .where(eq(attendance.id, existing[0].id));
          }
        } else if (action !== 'clear') {
          // Insert
          await db.insert(attendance).values({
            studentId: student.id,
            date,
            day: new Date(date).getDate(),
            present: action === 'present',
            lastModifiedBy: userId,
          });
        }

        success++;
      } catch (error) {
        failed++;
        results.push({ studentId: student.id, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${studentList.length} students: ${success} success, ${failed} failed`,
      processed: studentList.length,
      succeeded: success,
      failed: failed,
      details: results,
    });
  } catch (error) {
    console.error("Bulk operation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Step 4: Bulk UI Component

```javascript
// app/dashboard/attendance/_components/BulkOperations.jsx

"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function BulkOperations({ grade, stream, date, onComplete }) {
  const [loading, setLoading] = useState(false);

  const handleBulkAction = async (action) => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          stream,
          date,
          action, // "present", "absent", "clear"
          userId: getCurrentUserId(), // TODO: Get from session
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(`Failed: ${result.error}`);
        return;
      }

      toast.success(`✓ ${result.message}`);
      onComplete?.();
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded">
      <span className="text-sm font-semibold">Bulk Actions:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleBulkAction('present')}
        disabled={loading}
      >
        Mark All Present
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleBulkAction('absent')}
        disabled={loading}
      >
        Mark All Absent
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleBulkAction('clear')}
        disabled={loading}
      >
        Clear All
      </Button>
      {loading && <span className="text-xs text-gray-500">Processing...</span>}
    </div>
  );
}

export default BulkOperations;
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Migration run: `npm run db:push`
- [ ] Audit logs table created
- [ ] Holiday table created
- [ ] Attendance API updated with validation
- [ ] Bulk operations endpoint working
- [ ] Audit UI component added to attendance grid
- [ ] Test marking attendance (should log to audit)
- [ ] Test bulk operations (should process all students)
- [ ] Test old dates (should warn)
- [ ] Test weekends (should prevent)
- [ ] Test holidays (should prevent)

---

## 🚀 NEXT IMMEDIATE IMPROVEMENTS

```
After this week:
1. Add reason/excuse categories to absences
2. Build attendance summary reports
3. Add parent notifications
4. Implement role-based access
5. Create admin dashboard with key metrics
```

**These 2 weeks will transform your system from "basic" to "enterprise-ready"! 🎯**
