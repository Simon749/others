import { db } from "@/lib/db";
import { attendance, students } from "@/utils/schema";
import { eq, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";




export async function GET(request) {

    const searchParams = req.nextUrl.searchParams;
    const grade = searchParams.get("grade");
    const month = searchParams.get("month");

    const results = await db.select({
        name: students.name,
        present: attendance.present,
        day: attendance.day,
        date: attendance.date,
        grade: students.grade,
        studentId: students.id,
        attendanceId: attendance.id
    }).from(students)
        .leftJoin(attendance, eq(students.id, attendance.studentId))
        .where(eq(students.grade, grade))
        .where(
            or(
                eq(attendance.date, month),
                isNull(attendance.date)
            )
        )

    return NextResponse.json(results);
}