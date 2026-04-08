# 🚀 PHASE 1 QUICK REFERENCE
## Where Everything Is + What To Do Next

---

## 📂 FILE LOCATIONS - PHASE 1

### Database Schema
```
/utils/schema.js
├── ✅ New: users table (store user roles)
├── ✅ New: audit_logs table (track all changes)  
├── ✅ New: school_holidays table (prevent holiday marking)
└── ✅ Updated: attendance table (track who changed it)
```

### Middleware (NEW FOLDER)
```
/app/api/middleware/
├── validate.js        ← Input validation rules
├── audit.js           ← Audit logging functions
└── permissions.js     ← Role-based access control
```

### API Endpoints
```
/app/api/
├── attendance/route.js    ← Updated with all middleware
├── audit/route.js         ← NEW: View change history
└── holidays/route.js      ← NEW: Manage school holidays
```

### React Components (NEW)
```
/app/dashboard/_components/
├── AuditTrail.jsx         ← Display change history
├── HolidayManager.jsx      ← Manage holidays
└── ValidationErrors.jsx    ← Show validation feedback
```

### Documentation
```
/
├── PHASE_1_TESTING_GUIDE.md           ← 9 test cases + curl commands
├── PHASE_1_IMPLEMENTATION_SUMMARY.md  ← What was done (this is detailed)
└── PHASE_1_QUICK_REFERENCE.md         ← You are here
```

---

## ⚡ QUICK START - 3 STEPS

### 1️⃣ RUN DATABASE MIGRATIONS
```bash
# Auto-migrate (if using drizzle-kit)
npm run db:migrate

# OR manual SQL:
psql -U your_user -d your_database
# Paste SQL from PHASE_1_TESTING_GUIDE.md
```

### 2️⃣ RUN TESTS
```bash
# Open PHASE_1_TESTING_GUIDE.md
# Run each curl command one by one
# Mark each test ✅ when it passes

# All 9 tests should pass
```

### 3️⃣ INTEGRATE INTO UI
```jsx
// Add to your attendance page:
<AuditTrail attendanceId={selectedAttendanceId} />
<HolidayManager />
<ValidationErrors errors={errors} warnings={warnings} />
```

---

## 🔍 WHAT EACH MIDDLEWARE DOES

### `validate.js` - INPUT VALIDATION
- Checks date format: YYYY-MM-DD ✅
- Rejects future dates ❌
- Rejects weekends (Sat/Sun) ❌
- Rejects school holidays ❌
- Warns about old entries (>30 days) ⚠️
- Validates reason codes ✅

**Used in:** `/api/attendance POST`

### `audit.js` - CHANGE TRACKING
- Logs who made change
- Logs what changed (before/after)
- Logs when it happened (timestamp)
- Logs why it happened (reason)
- Logs where from (IP address)
- Logs browser/device (user agent)

**Used in:** `/api/attendance POST & DELETE`

### `permissions.js` - ROLE CHECKING
- Checks if user can perform action
- ROLES: super_admin, admin, class_teacher, parent, student
- ACTIONS: create, edit, delete, view
- Teachers can only edit their own class
- Parents can only see their own child
- Only admins can delete and manage settings

**Used in:** `/api/attendance & /api/holidays`

---

## 📋 PERMISSION RULES QUICK TABLE

| Who | Attendance Create | Attendance Edit | Attendance Delete | Holiday Manage |
|-----|---------|------|---------|----------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ |
| Teacher | ✅ own class | ✅ own class | ❌ | ❌ |
| Parent | ❌ | ❌ | ❌ | ❌ |
| Student | ❌ | ❌ | ❌ | ❌ |

---

## 🧪 TESTING - 9 TEST CASES

```bash
# 1. Future date rejection
curl -X POST http://localhost:3001/api/attendance \
  -d '{"studentId": 1, "date": "2026-04-20", ...}'
# Expected: ❌ Error

# 2. Weekend rejection  
curl -X POST http://localhost:3001/api/attendance \
  -d '{"studentId": 1, "date": "2026-04-11", ...}'
# Expected: ❌ Error (if 2026-04-11 is Saturday)

# 3. Holiday rejection
curl -X POST http://localhost:3001/api/attendance \
  -d '{"studentId": 1, "date": "2026-04-15", ...}'
# Expected: ❌ Error (if holiday exists)

# 4. Valid entry
curl -X POST http://localhost:3001/api/attendance \
  -d '{"studentId": 1, "date": "2026-04-08", ...}'
# Expected: ✅ Success

# 5. View audit trail
curl "http://localhost:3001/api/audit?attendanceId=1"
# Expected: ✅ Shows change history

# 6. Delete denied for teacher
curl -X DELETE "http://localhost:3001/api/attendance?attendanceId=1&userId=1"
# Expected: ❌ Permission denied (403)

# 7. Add holiday
curl -X POST http://localhost:3001/api/holidays \
  -d '{"name": "Sports Day", ...}'
# Expected: ✅ Created

# 8. Get holidays
curl "http://localhost:3001/api/holidays"
# Expected: ✅ All holidays listed

# 9. Update + audit
curl -X POST http://localhost:3001/api/attendance \
  -d '{"studentId": 1, "date": "2026-04-08", "present": false, ...}'
# Expected: ✅ Audit logs show new entry
```

**Full details in:** `/PHASE_1_TESTING_GUIDE.md`

---

## 🛠️ COMMON ISSUES & FIXES

### "Cannot find module" error
```bash
npm install axios drizzle-orm pg
```

### "Unknown table: audit_logs"
```bash
# Run migrations:
npm run db:migrate

# OR manual SQL from PHASE_1_TESTING_GUIDE.md
```

### API returns 500 error
```bash
# Check:
1. npm run dev is running
2. Database connection working
3. Check terminal for error message
4. Verify all middleware files exist
```

### Validation not working
```bash
# Verify:
1. validateAttendanceEntry imported
2. Date format is YYYY-MM-DD
3. Holidays saved in database
```

---

## 🔗 WHEN READY FOR PHASE 2

Once Phase 1 is ✅ TESTED & WORKING:

### What Phase 2 Adds:
- Bulk operations (mark all students at once)
- Reports generation (attendance statistics)
- Export to Excel/PDF (Ministry format)
- Absence reason categorization

### Where Code Is:
**See:** `/QUICK_START_IMPLEMENTATION.md` (Week 2 section)

### Timeline:
- Phase 1: 1-2 hours testing (now)
- Phase 2: 3-5 days implementation

---

## 📞 HELP & REFERENCE

### For Issues:
1. Check error message in terminal
2. Search `/app/api/middleware/[file].js` for details
3. Review test case in `PHASE_1_TESTING_GUIDE.md`
4. Run corresponding curl command to test

### For Understanding:
1. **Why validation?** → Prevents data entry mistakes
2. **Why audit logs?** → Proof when students/parents dispute attendance
3. **Why permissions?** → Teachers can't delete, admins can't afford mistakes

### For Adding Features:
1. Update schema.js if new table needed
2. Create middleware in /api/middleware/ 
3. Import middleware into route.js
4. Write tests first
5. Create React component for UI

---

## ✅ SUCCESS CHECKLIST

Before moving to Phase 2, confirm:

- [ ] Database migrations complete
- [ ] All 9 test cases pass
- [ ] Audit logs show changes
- [ ] Permissions block invalid users
- [ ] Validation rejects bad dates
- [ ] Holiday manager working
- [ ] Components can be imported in React
- [ ] No console errors

---

## 🚀 RIGHT NOW

```bash
# Step 1: Migrations
npm run db:migrate

# Step 2: Test
curl http://localhost:3001/api/attendance?grade=Form%201&month=2026-04

# Step 3: All 9 tests from PHASE_1_TESTING_GUIDE.md
# Mark each ✅ when done

# Step 4: Ready for Phase 2!
```

---

**Current Status:** ✅ Phase 1 code 100% complete and ready  
**Your Action:** Run migrations → Test → Confirm  
**Next:** Phase 2 (bulk operations + reports)

Need help? Check the detailed guides or review the middleware code!
