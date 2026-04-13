import { db } from "../../../../utils";
import { attendance, students, STREAMS } from "@/utils/schema";
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

const escapeCsv = (value) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
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
        const attendanceRows = await db.select({
            studentId: students.id,
            name: students.fullName,
            studentGrade: students.class,
            stream: STREAMS.name,
            date: attendance.date,
            day: attendance.day,
            present: attendance.present,
            reason: attendance.reason,
        })
            .from(attendance)
            .innerJoin(students, eq(attendance.studentId, students.id))
            .leftJoin(STREAMS, eq(attendance.streamId, STREAMS.id))
            .where(and(
                eq(students.class, grade),
                gte(attendance.date, range.startDate),
                lte(attendance.date, range.endDate)
            ))
            .orderBy(attendance.date);

        const headers = ["Student ID", "Name", "Grade", "Stream", "Date", "Day", "Present", "Reason"];
        const csvRows = [headers.join(",")];

        attendanceRows.forEach((row) => {
            csvRows.push([
                escapeCsv(row.studentId),
                escapeCsv(row.name),
                escapeCsv(row.studentGrade),
                escapeCsv(row.stream),
                escapeCsv(
                    row.date instanceof Date
                        ? row.date.toISOString().split("T")[0]
                        : row.date
                ),
                escapeCsv(row.day),
                escapeCsv(row.present),
                escapeCsv(row.reason),
            ].join(","));
        });

        const csv = csvRows.join("\n");
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename=attendance-${grade}-${month}.csv`,
            },
        });
    } catch (error) {
        console.error("Attendance export error:", error);
        return NextResponse.json({ error: "Failed to export attendance data" }, { status: 500 });
    }
}
