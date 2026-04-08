import { db } from "../../../../utils";
import { attendance, students } from "@/utils/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

const parseMonthRange = (monthString) => {
    const [year, month] = monthString.split("-").map(Number);
    if (!year || !month || month < 1 || month > 12) {
        return { error: "Invalid month format. Use YYYY-MM" };
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    return { startDate, endDate };
};

export async function GET(request) {
    const searchParams = request.nextUrl.searchParams;
    const grade = searchParams.get("grade");
    const month = searchParams.get("month");

    if (!grade || !month) {
        return NextResponse.json({ error: "grade and month are required" }, { status: 400 });
    }

    const range = parseMonthRange(month);
    if (range.error) {
        return NextResponse.json({ error: range.error }, { status: 400 });
    }

    try {
        const presentCountResult = await db.select({ count: db.fn.count(attendance.id) })
            .from(attendance)
            .innerJoin(students, eq(attendance.studentId, students.id))
            .where(and(
                eq(students.class, grade),
                eq(attendance.present, true),
                gte(attendance.date, range.startDate),
                lte(attendance.date, range.endDate)
            ));

        const absentCountResult = await db.select({ count: db.fn.count(attendance.id) })
            .from(attendance)
            .innerJoin(students, eq(attendance.studentId, students.id))
            .where(and(
                eq(students.class, grade),
                eq(attendance.present, false),
                gte(attendance.date, range.startDate),
                lte(attendance.date, range.endDate)
            ));

        const reasonCounts = await db.select({
            reason: attendance.reason,
            count: db.fn.count(attendance.id),
        })
            .from(attendance)
            .innerJoin(students, eq(attendance.studentId, students.id))
            .where(and(
                eq(students.class, grade),
                gte(attendance.date, range.startDate),
                lte(attendance.date, range.endDate)
            ))
            .groupBy(attendance.reason);

        const dailyPresent = await db.select({
            day: attendance.day,
            presentCount: db.fn.count(attendance.id),
        })
            .from(attendance)
            .innerJoin(students, eq(attendance.studentId, students.id))
            .where(and(
                eq(students.class, grade),
                eq(attendance.present, true),
                gte(attendance.date, range.startDate),
                lte(attendance.date, range.endDate)
            ))
            .groupBy(attendance.day)
            .orderBy(attendance.day);

        const dailyAbsent = await db.select({
            day: attendance.day,
            absentCount: db.fn.count(attendance.id),
        })
            .from(attendance)
            .innerJoin(students, eq(attendance.studentId, students.id))
            .where(and(
                eq(students.class, grade),
                eq(attendance.present, false),
                gte(attendance.date, range.startDate),
                lte(attendance.date, range.endDate)
            ))
            .groupBy(attendance.day)
            .orderBy(attendance.day);

        const dailyTotals = Array.from({ length: new Date(range.endDate).getUTCDate() }, (_, index) => ({
            day: index + 1,
            presentCount: 0,
            absentCount: 0,
        }));

        dailyPresent.forEach((row) => {
            if (row.day && row.day <= dailyTotals.length) {
                dailyTotals[row.day - 1].presentCount = Number(row.presentCount);
            }
        });

        dailyAbsent.forEach((row) => {
            if (row.day && row.day <= dailyTotals.length) {
                dailyTotals[row.day - 1].absentCount = Number(row.absentCount);
            }
        });

        return NextResponse.json({
            success: true,
            grade,
            month,
            totalPresent: Number(presentCountResult?.[0]?.count || 0),
            totalAbsent: Number(absentCountResult?.[0]?.count || 0),
            reasonCounts,
            dailyTotals,
        });
    } catch (error) {
        console.error("Attendance report error:", error);
        return NextResponse.json({ error: "Failed to generate attendance report" }, { status: 500 });
    }
}
