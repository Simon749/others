import Attendance from "@/app/dashboard/attendance/page";
import { db } from "@/lib/db";
import { attendance, students } from "@/utils/schema";
import { eq, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";




export async function GET(req) {

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

export async function POST(request) {

    const data = await request.json();

    const result = await db.insert(attendance)
        .values({
            studentId: data.studentId,
            present: data.present,
            day: data.day,
            date: data.date
        })

    return NextResponse.json(result);
}

export async function DELETE(req) {

    const searchParams = req.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const day = searchParams.get("day");
    const date = searchParams.get("date");

    const result = await db.delete(Attendance)
        .where(
            and(
                eq(attendance.studentId, studentId),
                eq(attendance.day, day),
                eq(attendance.date, date)
            )
        )

    return NextResponse.json(result);

}