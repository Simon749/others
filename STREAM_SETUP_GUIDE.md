# Stream Management System Guide

## Overview
This system allows you to organize classes by streams, which is essential for the Kenyan education system where classes like "Form 1A", "Form 1B", "Form 1C" have the same grade but different streams.

## How It Works

### Database Structure
```
GRADES (e.g., Form 1, Form 2, Form 3)
  ↓
STREAMS (e.g., Stream A, Stream B, Stream C)
  ↓
STUDENTS (belong to a specific Grade + Stream combination)
  ↓
ATTENDANCE (tracked per Grade + Stream + Date)
```

### Key Components

#### 1. **STREAMS Table** (New)
Added to track streams per grade:
- `id`: Auto-increment ID
- `gradeId`: Reference to the GRADES table
- `streamName`: The stream identifier (e.g., "A", "B", "C")
- `description`: Full description (e.g., "Form 1A")

#### 2. **Updated ATTENDANCE Table**
Now includes:
- `gradeId`: Reference to GRADES
- `streamId`: Reference to STREAMS
- Better tracking per class-stream combination

#### 3. **StreamSelection Component** (New)
`app/_components/StreamSelection.jsx`
- Dynamically loads streams based on selected grade
- Only shows available streams for the chosen class
- Integrates seamlessly with existing grade selection

---

## Setup Instructions

### Step 1: Initialize Default Streams
Run this in your API to create default streams (A, B, C) for all existing grades:

```bash
curl -X PUT http://localhost:3000/api/streams/initialize
```

This will create streams for all grades in your GRADES table.

### Step 2: Add Custom Streams
If you need specific streams for a particular grade:

```bash
curl -X POST http://localhost:3000/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "gradeId": 1,
    "streamName": "A",
    "description": "Form 1A"
  }'
```

### Step 3: View Streams for a Grade
Get all streams for a specific grade:

```bash
curl http://localhost:3000/api/streams?gradeId=1
```

---

## UI Changes

### Attendance Page
Now has two selection dropdowns:
1. **Grade Selection**: First, select the class (Form 1, Form 2, etc.)
2. **Stream Selection**: Then, select the stream (A, B, C, etc.)

```
┌─ Select Month ─────────────────┐
├─ Select Grade ─────────────────┤
├─ Select Stream ─────────────────┤
└─ Search Button ─────────────────┘
```

### Add Student Dialog
The stream field is now:
- **Dynamic**: Shows only streams available for the selected class
- **Optional**: Students can be added without a stream if needed
- **Auto-loading**: Changes when the class selection changes

---

## API Routes

### GET `/api/streams`
Get all streams for a specific grade.

**Query Parameters:**
- `gradeId` (required): The ID of the grade

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "streamName": "A",
      "description": "Form 1A",
      "gradeId": 1
    },
    {
      "id": 2,
      "streamName": "B",
      "description": "Form 1B",
      "gradeId": 1
    }
  ]
}
```

### GET `/api/attendance`
Now supports stream filtering.

**Query Parameters:**
- `grade` (required): The class name
- `month` (required): The month in YYYY-MM format
- `stream` (optional): The stream to filter by

**Example:**
```
GET /api/attendance?grade=Form 1&month=2026-04&stream=A
```

### POST `/api/streams/initialize`
Initialize default streams for all grades.

**Response:**
```json
{
  "success": true,
  "message": "Initialization complete. 12 streams created.",
  "created": 12
}
```

---

## Database Migrations

If you're using Drizzle migrations, run:

```bash
npm run db:push
```

Or manually execute these SQL commands:

```sql
-- Create STREAMS table
CREATE TABLE streams (
  id SERIAL PRIMARY KEY,
  grade_id INTEGER NOT NULL REFERENCES grades(id),
  stream_name VARCHAR(10) NOT NULL,
  description VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update ATTENDANCE table
ALTER TABLE attendance 
ADD COLUMN grade_id INTEGER REFERENCES grades(id),
ADD COLUMN stream_id INTEGER REFERENCES streams(id);

-- Create index for faster queries
CREATE INDEX idx_streams_grade_id ON streams(grade_id);
CREATE INDEX idx_attendance_grade_stream ON attendance(grade_id, stream_id, date);
```

---

## Usage Examples

### Example 1: Get streams for Form 1
```javascript
const response = await fetch('/api/streams?gradeId=1');
const data = await response.json();
// Returns: [
//   { id: 1, streamName: 'A', description: 'Form 1A', gradeId: 1 },
//   { id: 2, streamName: 'B', description: 'Form 1B', gradeId: 1 },
//   { id: 3, streamName: 'C', description: 'Form 1C', gradeId: 1 }
// ]
```

### Example 2: Upload attendance for a specific class-stream
```javascript
// Mark attendance for Form 1A in April 2026
const response = await fetch('/api/attendance?grade=Form 1&month=2026-04&stream=A');
const attendance = await response.json();
// Returns students in Form 1, Stream A
```

### Example 3: Create a new stream
```javascript
const response = await fetch('/api/streams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gradeId: 2,
    streamName: 'D',
    description: 'Form 2D (Science)' // You can use descriptions for specialization
  })
});
```

---

## Best Practices

1. **Use descriptive stream names**: Include the grade in the description for clarity
   - ✅ Good: `{ streamName: "A", description: "Form 1A" }`
   - ❌ Bad: `{ streamName: "Section 1", description: "1" }`

2. **Initialize streams early**: Run the initialization endpoint when setting up the database

3. **Consistent naming**: Use uppercase letters (A, B, C) for standard streams

4. **Filter attendance by stream**: Always include the stream when viewing attendance for accurate tracking

---

## Common Issues

### Issue: Stream dropdown shows "No streams available"
**Solution**: Make sure you've initialized streams for the selected grade
```bash
curl -X PUT http://localhost:3000/api/streams/initialize
```

### Issue: Old attendance data doesn't show stream info
**Solution**: Migrate existing attendance records to include `gradeId` and `streamId`

### Issue: Streams appear in wrong grade
**Solution**: Check the `gradeId` when creating streams - ensure it matches the correct grade ID

---

## Backward Compatibility

The system maintains backward compatibility with existing code:
- Existing attendance records without `stream_id` will still work
- Students without an assigned stream can still be tracked
- The stream field in the students table is optional

---

## Future Enhancements

1. Add stream-specific settings (e.g., specialization like Science, Arts)
2. Bulk stream assignment tools
3. Stream statistics and analytics
4. Automatic stream assignment based on capacity
5. Stream transfer functionality
