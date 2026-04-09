import 'dotenv/config';
import { db } from "./index.js";
import { students, attendance } from "./schema.js";

async function seed() {
  console.log("🌱 Starting full system seed (HTTP Mode)...");

  try {
    // 1. Clear existing data
    console.log("🧹 Cleaning tables...");
    try {
      await db.delete(attendance);
      await db.delete(students);
      console.log("✅ Tables cleared");
    } catch (e) {
      console.log("ℹ️ Tables already empty or didn't exist");
    }

    // 2. Setup Student Data
    const studentRecords = [];
    const grades = ["grade_1", "grade_2", "grade_3", "grade_4", "grade_5", "grade_6", "grade_7", "grade_8", "grade_9", "Form 1", "Form 2", "Form 3", "Form 4"];
    const streams = ["A", "B", "C"];
    const genders = ["Male", "Female"];
    const firstNames = ["John", "Mary", "Kevin", "Stacy", "Jabari", "Zahra", "Otieno", "Wanjiku", "Brian", "Faith"];
    const lastNames = ["Kamau", "Onyango", "Musyoka", "Omollo", "Maina", "Kiptoo", "Mutua", "Wangari", "Koech"];

    for (let i = 1; i <= 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const grade = grades[Math.floor(Math.random() * grades.length)];

      studentRecords.push({
        id: i,
        admissionNumber: `ADM-2026-${String(i).padStart(3, '0')}`,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        gender: genders[Math.floor(Math.random() * genders.length)],
        dateOfBirth: `2011-05-10`, // Simplified for now
        age: 15,
        class: grade,
        stream: streams[Math.floor(Math.random() * streams.length)],
      });
    }

    console.log(`📝 Inserting ${studentRecords.length} students...`);
    // We use the full studentRecords array
    await db.insert(students).values(studentRecords);

    // 3. Setup Term 1 Attendance (Jan 7 - March 1)
    console.log("📅 Generating Term 1 Attendance...");
    const attendanceRecords = [];
    const termStart = new Date("2026-01-07");
    const termEnd = new Date("2026-03-01");

    // ... inside your loop after generating studentRecords

    // ... inside the attendance generation loop
    for (let d = new Date(termStart); d <= termEnd; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateString = d.toISOString().split('T')[0];

      for (let i = 0; i < studentRecords.length; i++) {
        const student = studentRecords[i]; // Get the specific student's info

        attendanceRecords.push({
          studentId: student.id,
          date: dateString,
          day: dateString, // Keeping both if your schema requires them
          present: Math.random() > 0.1,
          grade_id: student.class,  // Matches your schema's "grade_id"
          stream_id: student.stream, 
          reason: null,
          last_modified_by: 'SYSTEM_SEED'
        });
      }
    }

    // 4. Batch Insert Attendance in chunks
    const chunkSize = 500;
    console.log(`🚀 Inserting ${attendanceRecords.length} attendance records in chunks...`);

    for (let i = 0; i < attendanceRecords.length; i += chunkSize) {
      const chunk = attendanceRecords.slice(i, i + chunkSize);
      await db.insert(attendance).values(chunk);
      console.log(`   Inserted chunk ${Math.floor(i / chunkSize) + 1}...`);
    }

    console.log("✅ Database successfully seeded with Students and Term 1 Attendance!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();