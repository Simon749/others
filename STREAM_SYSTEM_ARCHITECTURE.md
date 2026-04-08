# Stream System Architecture

## How It's Organized (Kenyan Education System)

```
SCHOOL STRUCTURE
├── Form 1
│   ├── Stream A (Form 1A) - Students A1, A2, A3...
│   ├── Stream B (Form 1B) - Students B1, B2, B3...
│   └── Stream C (Form 1C) - Students C1, C2, C3...
├── Form 2
│   ├── Stream A (Form 2A)
│   ├── Stream B (Form 2B)
│   └── Stream C (Form 2C)
└── Form 3
    ├── Stream A (Form 3A)
    ├── Stream B (Form 3B)
    └── Stream C (Form 3C)
```

---

## Database Flow

```
GRADES TABLE
┌─────────────────────────────────────┐
│ id  │ grade   │                     │
├─────┼─────────┤                     │
│ 1   │ Form 1  │                     │
│ 2   │ Form 2  │                     │
│ 3   │ Form 3  │                     │
└─────┴─────────┴──────────────────────┘
        │
        │ (has many)
        ▼
STREAMS TABLE
┌────────────────────────────────────────────┐
│ id  │ gradeId │ streamName │ description  │
├─────┼─────────┼────────────┼──────────────┤
│ 1   │ 1       │ A          │ Form 1A      │
│ 2   │ 1       │ B          │ Form 1B      │
│ 3   │ 1       │ C          │ Form 1C      │
│ 4   │ 2       │ A          │ Form 2A      │
│ 5   │ 2       │ B          │ Form 2B      │
│ 6   │ 2       │ C          │ Form 2C      │
└─────┴─────────┴────────────┴──────────────┘
        │
        │ (has many)
        ▼
STUDENTS TABLE
┌───────────────────────────────────────────┐
│ id  │ fullName  │ class   │ stream        │
├─────┼───────────┼─────────┼───────────────┤
│ 101 │ John K.   │ Form 1  │ A             │
│ 102 │ Mary W.   │ Form 1  │ A             │
│ 103 │ Sarah M.  │ Form 1  │ B             │
│ 104 │ Peter O.  │ Form 2  │ A             │
└─────┴───────────┴─────────┴───────────────┘
        │
        │ (has many)
        ▼
ATTENDANCE TABLE
┌──────────────────────────────────────┐
│ id  │ studentId │ date      │ present│
├─────┼───────────┼───────────┼────────┤
│ 1   │ 101       │ 2026-04-01│ true   │
│ 2   │ 102       │ 2026-04-01│ true   │
│ 3   │ 103       │ 2026-04-01│ false  │
│ 4   │ 104       │ 2026-04-01│ true   │
└─────┴───────────┴───────────┴────────┘
```

---

## UI Component Flow

### Attendance Page Workflow
```
User Interface
│
├─ MonthlySelection Component
│  └─ Output: selectedMonth (Date object)
│
├─ GradeSelection Component  
│  └─ Output: selectedGrade (Grade ID or name)
│
├─ StreamSelection Component
│  │
│  ├─ Watch selectedGrade
│  │  └─ When changed: Fetch /api/streams?gradeId={gradeId}
│  │
│  └─ Output: selectedStream (Stream ID or name)
│
└─ Search Button
   └─ Calls: /api/attendance?grade={grade}&month={month}&stream={stream}
      └─ Returns: Attendance records for that specific class-stream combination
```

---

## API Call Sequence

### Scenario: View Form 1A attendance for April 2026

```
1. User selects Grade: "Form 1" (gradeId: 1)
   └─ GET /api/streams?gradeId=1
   └─ Returns: [
        { id: 1, streamName: "A", description: "Form 1A" },
        { id: 2, streamName: "B", description: "Form 1B" },
        { id: 3, streamName: "C", description: "Form 1C" }
      ]

2. User selects Stream: "Form 1A" (streamId: 1)
   └─ State updated: selectedStream = "A"

3. User selects Month: April 2026
   └─ State updated: selectedMonth = "2026-04"

4. User clicks Search
   └─ GET /api/attendance?grade=Form 1&month=2026-04&stream=A
   └─ Backend Query:
      SELECT * FROM students
      WHERE class = "Form 1" AND stream = "A"
      LEFT JOIN attendance WHERE date STARTS WITH "2026-04"
   └─ Returns: All students in Form 1A with their April attendance
```

---

## Data Structure Examples

### Example 1: Creating a Stream
```javascript
// API Call
POST /api/streams
Body: {
  gradeId: 1,
  streamName: "A",
  description: "Form 1A"
}

// Response
{
  success: true,
  data: {
    id: 1,
    gradeId: 1,
    streamName: "A",
    description: "Form 1A",
    createdAt: "2026-04-08T10:00:00Z"
  }
}
```

### Example 2: Getting Streams for Form 1
```javascript
// API Call
GET /api/streams?gradeId=1

// Response
{
  results: [
    { id: 1, streamName: "A", description: "Form 1A", gradeId: 1 },
    { id: 2, streamName: "B", description: "Form 1B", gradeId: 1 },
    { id: 3, streamName: "C", description: "Form 1C", gradeId: 1 }
  ]
}
```

### Example 3: Getting Attendance for Form 1A
```javascript
// API Call
GET /api/attendance?grade=Form 1&month=2026-04&stream=A

// Response
[
  {
    name: "John Kamau",
    studentId: 101,
    day: 1,
    present: true,
    date: "2026-04-01",
    grade: "Form 1",
    stream: "A"
  },
  {
    name: "Mary Wanjiru",
    studentId: 102,
    day: 1,
    present: false,
    date: "2026-04-01",
    grade: "Form 1",
    stream: "A"
  }
]
```

---

## Component Dependencies

```
Attendance Page
├─ MonthlySelection
│  └─ Popover Component
│     └─ Calendar Component
├─ GradeSelection
│  └─ Dropdown with hardcoded grades
├─ StreamSelection (NEW)
│  └─ Calls /api/streams to populate dropdown
└─ AttendanceGrid
   └─ Displays results

AddNewStudent Dialog
├─ Form with fields
│  ├─ Admission Number
│  ├─ Full Name
│  ├─ Gender
│  ├─ Date of Birth
│  ├─ Class Dropdown
│  ├─ Stream Dropdown (NEW - Dynamic)
│  │  └─ Watches class field
│  │  └─ Calls /api/streams when class changes
│  └─ Other fields...
└─ Creates student with class + stream
```

---

## Key Query Examples

### Find all streams for a grade
```sql
SELECT * FROM streams WHERE grade_id = 1;
```

### Find all students in Form 1A
```sql
SELECT * FROM students WHERE class = 'Form 1' AND stream = 'A';
```

### Find attendance for Form 1A in April 2026
```sql
SELECT s.*, a.* FROM students s
LEFT JOIN attendance a ON s.id = a.studentId
WHERE s.class = 'Form 1' 
  AND s.stream = 'A' 
  AND a.date LIKE '2026-04%'
ORDER BY a.day ASC;
```

### Count present students per stream
```sql
SELECT s.stream, COUNT(*) as total, 
       SUM(CASE WHEN a.present = true THEN 1 ELSE 0 END) as present_count
FROM students s
LEFT JOIN attendance a ON s.id = a.studentId
WHERE s.class = 'Form 1' AND a.date LIKE '2026-04%'
GROUP BY s.stream;
```

---

## Benefits of This System

1. **Scalability**: Easy to add new streams or grades
2. **Flexibility**: Each stream can have different characteristics
3. **Accuracy**: Clear separation of attendance per stream
4. **User Experience**: Intuitive dropdowns based on selections
5. **Kenyan Compliance**: Matches actual school structure
6. **Performance**: Indexed queries for fast lookups
7. **Maintainability**: Clear data relationships

---

## File Structure Overview

```
app/
├─ api/
│  ├─ attendance/route.js (UPDATED)
│  ├─ streams/
│  │  ├─ route.js (NEW)
│  │  └─ initialize/route.js (NEW)
│  └─ ...
├─ _components/
│  ├─ StreamSelection.jsx (NEW)
│  ├─ GradeSelection.jsx
│  └─ ...
├─ dashboard/
│  └─ attendance/
│     ├─ page.jsx (UPDATED)
│     └─ _components/...
└─ _services/
   └─ GlobalApi.js (UPDATED)

utils/
└─ schema.js (UPDATED - Added STREAMS, updated ATTENDANCE)

STREAM_SETUP_GUIDE.md (NEW - Complete Documentation)
```
