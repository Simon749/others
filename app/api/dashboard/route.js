import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../utils";
import { attendance, students } from "@/utils/schema";
import { NextResponse } from "next/server";

export async function GET(request) {
    const searchParams = request.nextUrl.searchParams;
    const grade = searchParams.get("grade");
    const dateParam = searchParams.get("date");

    if (!grade || !dateParam) {
        return NextResponse.json({ error: "Missing grade or date parameter" }, { status: 400 });
    }

    // Parse date to ensure it's a valid Date object (adjust format if needed)
    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    try {
        const results = await db.select({
            day: attendance.day,
            presentCount: db.fn.count(attendance.present),
        }).from(attendance)
            .innerJoin(students, eq(attendance.studentId, students.id))
            .groupBy(attendance.day)
            .where(and(eq(attendance.date, date), eq(students.grade, grade)))
            .orderBy(desc(attendance.day))
            .limit(7)

        return NextResponse.json(results);
    } catch (error) {
        console.error("Query error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}