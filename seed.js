import 'dotenv/config';
import { db } from "./utils"; // Adjust based on where your db connection is
import { students } from "./utils/schema"; // Import students table
import { faker } from '@faker-js/faker'; // Optional: npm install @faker-js/faker for random data
import * as schema from "./utils/schema";



async function seed() {
  console.log("Clearing existing students...");
  
  try {
    await db.delete(students);
    console.log("✅ Cleared existing students");
  } catch (error) {
    console.log("(No students to clear)");
  }
  
  const studentRecords = [];
  const grades = ["Form 1", "Form 2", "Form 3", "Form 4"];
  const streams = ["A", "B", "C"];
  const genders = ["Male", "Female"];

  for (let i = 1; i <= 100; i++) {
    // Generate realistic names
    const firstName = ["John", "Mary", "Kevin", "Stacy", "Jabari", "Zahra", "Otieno", "Wanjiku"][Math.floor(Math.random() * 8)];
    const lastName = ["Kamau", "Onyango", "Musyoka", "Omollo", "Maina", "Kiptoo", "Mutua"][Math.floor(Math.random() * 7)];
    const fullName = `${firstName} ${lastName}`;

    studentRecords.push({
      admissionNumber: `ADM-2026-${String(i).padStart(3, '0')}`,
      firstName: firstName,
      lastName: lastName,
      fullName: fullName,
      gender: genders[Math.floor(Math.random() * genders.length)],
      dateOfBirth: "2015-05-10", // You can randomize this
      age: 10,
      class: grades[Math.floor(Math.random() * grades.length)],
      stream: streams[Math.floor(Math.random() * streams.length)],
    });
  }

  console.log(`Seeding 100 students...`);
  
  try {
    await db.insert(students).values(studentRecords);
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
  process.exit();
}

seed();