// scripts/seed.js
import 'dotenv/config';
import { db } from "./utils"; // Adjust path to your db export
import { students } from "./utils/schema"; // Adjust path to your schema

async function seed() {
  console.log("🌱 Starting seed...");
  
  // Clear existing data
  try {
    await db.delete(students);
    console.log("✅ Cleared existing students");
  } catch (error) {
    console.log("ℹ️  No students to clear");
  }
  
  const studentRecords = [];
  const grades = ["Form 1", "Form 2", "Form 3", "Form 4"];
  const streams = ["A", "B", "C"];
  const genders = ["Male", "Female"];
  const firstNames = ["John", "Mary", "Kevin", "Stacy", "Jabari", "Zahra", "Otieno", "Wanjiku", "Brian", "Faith"];
  const lastNames = ["Kamau", "Onyango", "Musyoka", "Omollo", "Maina", "Kiptoo", "Mutua", "Wangari", "Koech"];

  for (let i = 1; i <= 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const grade = grades[Math.floor(Math.random() * grades.length)];
    const stream = streams[Math.floor(Math.random() * streams.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    
    // Randomize age based on form
    const baseAge = grade === "Form 1" ? 13 : grade === "Form 2" ? 14 : grade === "Form 3" ? 15 : 16;
    const age = baseAge + Math.floor(Math.random() * 2);
    const birthYear = 2026 - age;
    
    studentRecords.push({
      admissionNumber: `ADM-2026-${String(i).padStart(3, '0')}`,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      gender,
      dateOfBirth: `${birthYear}-05-10`,
      age,
      class: grade,
      stream,
    });
  }

  console.log(`📝 Inserting ${studentRecords.length} students...`);
  
  await db.insert(students).values(studentRecords);
  console.log("✅ Database seeded successfully!");
  
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});