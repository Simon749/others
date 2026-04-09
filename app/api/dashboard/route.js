import { and, desc, eq, sql, like } from "drizzle-orm";
import { db } from "../../../utils";
import { attendance, students } from "@/utils/schema";
import { NextResponse } from "next/server";

export async function GET(request) {
    const searchParams = request.nextUrl.searchParams;
    const grade = searchParams.get("grade");
    const dateParam = searchParams.get("date"); // This is "2025-04"

    if (!grade || !dateParam) {
        return NextResponse.json({ error: "Missing grade or date parameter" }, { status: 400 });
    }

    try {
        
        // Date is stored as string in DB (YYYY-MM or YYYY-MM-DD), so keep it as string
        const results = await db.select({
            day: attendance.day,
            presentCount: sql`count(${attendance.studentId})`.mapWith(Number),
        }).from(attendance)
            .innerJoin(students, eq(attendance.studentId, students.id))
            .where(and(
                eq(students.class, grade),
                sql`CAST(${attendance.day} AS TEXT) LIKE ${dateParam + '%'}`,
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


        console.log("Grade sent:", grade);
        console.log("Date sent:", dateParam);
        console.log("Rows found in DB:", results.length);
        if (results.length > 0) console.log("First row example:", results[0]);

        console.log("--- DEBUGGING DATA ---");
        console.log("Searching for Grade:", grade);
        console.log("Searching for Date starting with:", dateParam);
        console.log("Raw Results from DB:", JSON.stringify(results));
        console.log("----------------------");

        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
    }
}