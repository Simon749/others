import { NextResponse } from "next/server";
import { db } from "../../../utils";
import { GRADES } from "../../../utils/schema";

export async function GET(request) {
    const results = await db.select().from(GRADES);
    return NextResponse.json({ results });
}