import { NextResponse } from "next/server";
import { db } from "../../../utils";
import { students } from "../../../utils/schema";
import { eq } from "drizzle-orm";

const calculateAge = (dobString) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (Number.isNaN(dob.getTime())) return null;
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

export async function POST(request) {
    const data = await request.json();

    const requiredFields = ["admissionNumber", "fullName", "gender", "dateOfBirth", "class"];
    const missing = requiredFields.filter((f) => !data?.[f]);

    if (missing.length > 0) {
        return NextResponse.json(
            { error: `Missing required fields: ${missing.join(", ")}` },
            { status: 400 }
        );
    }

    const fullName = (data.fullName || "").trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : null;

    const ageValue = data.age ? Number(data.age) : calculateAge(data.dateOfBirth);

    try {
        const result = await db
            .insert(students)
            .values({
                admissionNumber: data.admissionNumber,
                firstName,
                middleName,
                lastName,
                fullName,
                gender: data.gender,
                dateOfBirth: new Date(data.dateOfBirth),
                age: ageValue,
                class: data.class,
                stream: data.stream || null,
                admissionDate: data.admissionDate ? new Date(data.admissionDate) : new Date(),
                previousSchool: data.previousSchool || null,
            })
            .returning();

        return NextResponse.json({ data: result });
    } catch (err) {
        console.error("Student create failed", err);
        return NextResponse.json({ error: err?.message || "Failed to create student" }, { status: 500 });
    }
}


export async function GET(request) {


    const results = await db.select().from(students);

    return NextResponse.json({ data: results });
}

export async function DELETE(request) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    const result = await db.delete(students).where(eq(students.id, id));

    return NextResponse.json({ data: result });
}