import { NextResponse } from "next/server";

export async function GET(request) {

    const results = await db.select().from(grade);
    return NextResponse.json({ results });
}