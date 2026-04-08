# PHASE 1: TESTING GUIDE
## Audit + Permissions + Validation System

**Date Created:** April 8, 2026  
**Current Status:** ✅ All features implemented and ready for testing  
**Estimated Testing Time:** 1-2 hours  

---

## 📋 QUICK TEST CHECKLIST

- [ ] Database migrations run successfully
- [ ] Validation rejects future dates
- [ ] Validation rejects weekend dates  
- [ ] Validation rejects holidays
- [ ] Permissions prevent non-admins from deleting
- [ ] Audit logs show who changed what
- [ ] Holiday manager allows adding/deleting holidays
- [ ] UI shows validation errors properly
- [ ] All curl commands work as documented

---

## 🔧 SETUP BEFORE TESTING

### 1. Run Database Migrations

```bash
# Create the new tables
npm run db:migrate  # Or use: drizzle-kit migrate

# OR manually run these SQL commands:
```

**SQL to create tables (if your migration tool doesn't auto-create):**

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  grade_id INTEGER,
  stream_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (grade_id) REFERENCES grades(id),
  FOREIGN KEY (stream_id) REFERENCES streams(id)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  attendance_id INTEGER NOT NULL,
  changed_by INTEGER NOT NULL,
  previous_value BOOLEAN,
  new_value BOOLEAN,
  reason VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  changed_at TIMESTAMP DEFAULT NOW(),
  status_code INTEGER,
  FOREIGN KEY (attendance_id) REFERENCES attendance(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- School holidays table
CREATE TABLE IF NOT EXISTS school_holidays (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update attendance table to track modifications
ALTER TABLE attendance 
ADD COLUMN last_modified_by INTEGER,
ADD COLUMN last_modified_at TIMESTAMP DEFAULT NOW(),
ADD FOREIGN KEY (last_modified_by) REFERENCES users(id);
```

### 2. Insert Test Data

```sql
-- Create test users
INSERT INTO users (email, full_name, role, password, grade_id, stream_id, is_active) VALUES
('teacher1@school.com', 'John Doe', 'class_teacher', 'hashedpwd123', 1, 1, true),
('admin@school.com', 'Admin User', 'admin', 'hashedpwd456', NULL, NULL, true),
('parent@school.com', 'Parent User', 'parent', 'hashedpwd789', NULL, NULL, true);

-- Create test holidays
INSERT INTO school_holidays (name, start_date, end_date, description) VALUES
('Easter Break', '2026-04-10', '2026-04-17', 'Easter holidays'),
('Mid-Term Break', '2026-05-23', '2026-05-30', 'Mid-term break');

SELECT * FROM users;
SELECT * FROM school_holidays;
```

---

## ✅ TEST CASES

### TEST 1: Validation - Future Date Rejection

**Expected:** API should reject attendance for future dates  
**Test Command:**

```bash
curl -X POST http://localhost:3001/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "date": "2026-04-20",
    "present": true,
    "day": 20,
    "userId": 1,
    "gradeId": 1,
    "streamId": 1
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "isValid": false,
  "errors": ["❌ Cannot mark attendance for future dates"],
  "timestamp": "2026-04-08T10:30:00.000Z"
}
```

---

### TEST 2: Validation - Weekend Rejection

**Expected:** API should reject attendance on Saturdays/Sundays  
**Test Command:**

```bash
# Get today's date first
date=$(date +%Y-%m-%d)

# Try marking Saturday (adjust to actual Saturday)
curl -X POST http://localhost:3001/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "date": "2026-04-11",
    "present": true,
    "day": 11,
    "userId": 1,
    "gradeId": 1,
    "streamId": 1
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "isValid": false,
  "errors": ["❌ Cannot mark attendance on weekends (Saturday/Sunday)"],
  "timestamp": "2026-04-08T10:30:00.000Z"
}
```

---

### TEST 3: Validation - Holiday Rejection

**Expected:** API should reject attendance on school holidays  
**Test Command:**

```bash
curl -X POST http://localhost:3001/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "date": "2026-04-15",
    "present": true,
    "day": 15,
    "userId": 1,
    "gradeId": 1,
    "streamId": 1,
    "reason": "manual_entry"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "isValid": false,
  "errors": ["❌ This date is a school holiday - cannot mark attendance"],
  "timestamp": "2026-04-08T10:30:00.000Z"
}
```

---

### TEST 4: Valid Attendance Entry

**Expected:** Valid attendance should be created and logged  
**Test Command:**

```bash
# Mark a valid weekday
curl -X POST http://localhost:3001/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "date": "2026-04-08",
    "present": true,
    "day": 8,
    "userId": 1,
    "gradeId": 1,
    "streamId": 1,
    "reason": "manual_entry"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "id": 1,
    "studentId": 1,
    "gradeId": 1,
    "streamId": 1,
    "date": "2026-04-08",
    "present": true,
    "lastModifiedBy": 1,
    "lastModifiedAt": "2026-04-08T10:30:00.000Z"
  },
  "action": "created"
}
```

---

### TEST 5: Audit Logging - View Change History

**Expected:** Audit logs should show who changed what and when  
**Test Command:**

```bash
# Get audit logs for attendance record
curl -X GET "http://localhost:3001/api/audit?attendanceId=1" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "attendanceId": 1,
      "before": "Absent ✗",
      "after": "Present ✓",
      "changedBy": 1,
      "reason": "manual_entry",
      "changedAt": "2026-04-08 10:30:00",
      "timestamp": "2026-04-08T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### TEST 6: Permission Check - Delete Denied for Teachers

**Expected:** Teachers cannot delete attendance records (only admins can)  
**Test Command:**

```bash
curl -X DELETE "http://localhost:3001/api/attendance?attendanceId=1&userId=1" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Permission Denied",
  "message": "User 1 is not authorized to perform \"attendance:delete\": Only admins can delete attendance",
  "timestamp": "2026-04-08T10:30:00.000Z",
  "statusCode": 403
}
```

---

### TEST 7: Holiday Management - Add Holiday

**Expected:** Admin can add school holidays  
**Test Command:**

```bash
curl -X POST http://localhost:3001/api/holidays \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sports Day",
    "startDate": "2026-04-25",
    "endDate": "2026-04-25",
    "description": "Annual sports day event",
    "userRole": "admin"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Holiday created successfully",
  "data": {
    "id": 3,
    "name": "Sports Day",
    "startDate": "2026-04-25",
    "endDate": "2026-04-25",
    "description": "Annual sports day event",
    "createdAt": "2026-04-08T10:30:00.000Z"
  }
}
```

---

### TEST 8: Holiday Management - Retrieve Holidays

**Expected:** Should return all holidays  
**Test Command:**

```bash
curl -X GET "http://localhost:3001/api/holidays" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "Easter Break", "startDate": "2026-04-10", "endDate": "2026-04-17", "description": "Easter holidays"},
    {"id": 2, "name": "Mid-Term Break", "startDate": "2026-05-23", "endDate": "2026-05-30", "description": "Mid-term break"},
    {"id": 3, "name": "Sports Day", "startDate": "2026-04-25", "endDate": "2026-04-25", "description": "Annual sports day event"}
  ],
  "count": 3
}
```

---

### TEST 9: Update Existing Attendance (Audit Trail)

**Expected:** Updating attendance should create audit log entry  
**Test Command:**

```bash
curl -X POST http://localhost:3001/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "date": "2026-04-08",
    "present": false,
    "day": 8,
    "userId": 1,
    "gradeId": 1,
    "streamId": 1,
    "reason": "correction"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": { ... },
  "action": "updated"
}
```

**Then check audit logs:**

```bash
curl -X GET "http://localhost:3001/api/audit?attendanceId=1" \
  -H "Content-Type: application/json"
```

**Should now show 2 entries with before/after states:**
```json
{
  "data": [
    {
      "id": 2,
      "before": "Present ✓",
      "after": "Absent ✗",
      "reason": "correction",
      "changedAt": "2026-04-08 10:35:00"
    },
    {
      "id": 1,
      "before": "Absent ✗",
      "after": "Present ✓",
      "reason": "manual_entry",
      "changedAt": "2026-04-08 10:30:00"
    }
  ]
}
```

---

## 🎯 TESTING SUMMARY TABLE

| Test # | Feature | Expected Result | Status |
|--------|---------|-----------------|--------|
| 1 | Future date rejection | Error | ⬜ |
| 2 | Weekend rejection | Error | ⬜ |
| 3 | Holiday rejection | Error | ⬜ |
| 4 | Valid entry | Success + logged | ⬜ |
| 5 | Audit trail viewing | Shows history | ⬜ |
| 6 | Permission denied | 403 error | ⬜ |
| 7 | Add holiday | Success | ⬜ |
| 8 | Get holidays | All holidays listed | ⬜ |
| 9 | Update + audit | Change logged | ⬜ |

---

## 🐛 TROUBLESHOOTING

### Issue: "Cannot find module" error
**Solution:** Run `npm install` to install all dependencies

### Issue: Database table doesn't exist
**Solution:** Run the SQL migrations above manually or use:
```bash
npm run db:migrate
```

### Issue: API returns 500 error
**Check:**
1. Database connection is working: `psql -U user -d database -c "SELECT 1"`
2. All middleware files exist in `/app/api/middleware/`
3. Check server logs for specific error message

### Issue: Validation not working
**Check:**
1. Date format is YYYY-MM-DD
2. `validateAttendanceEntry` is imported correctly
3. Holidays are properly inserted into database

---

## ✅ NEXT STEPS AFTER TESTING

Once all tests pass:

1. ✅ Confirm Phase 1 is 100% working
2. 📊 Get user feedback on UI/UX
3. 🔄 Integrate with authentication system (currently hardcoded userId)
4. 📱 Begin Phase 2 (Bulk Operations + Reports)

---

**For Questions:** Review code comments in `/app/api/middleware/` files  
**For Updates:** Check `/QUICK_START_IMPLEMENTATION.md` for Phase 2 code
