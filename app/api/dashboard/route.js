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

    try {
        // Date is stored as string in DB (YYYY-MM or YYYY-MM-DD), so keep it as string
        const results = await db.select({
            day: attendance.day,
            presentCount: db.fn.count(attendance.present),
        }).from(attendance)
            .innerJoin(students, eq(attendance.studentId, students.id))
            .where(and(
                eq(attendance.date, dateParam),
                eq(students.class, grade),
                eq(attendance.present, true)
            ))
            .groupBy(attendance.day)
            .orderBy(desc(attendance.day))
            .limit(31);

        // Drizzle returns count as a numeric value in the aggregation result
        const formatted = results.map(r => ({
            day: r.day,
            presentCount: Number(r.presentCount) || r.presentCount
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Query error:", error);
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
    }
}