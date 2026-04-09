import { NextResponse } from "next/server";
import { db } from "../../../utils";
import { STREAMS, GRADES } from "../../../utils/schema";
import { eq } from "drizzle-orm";

export async function GET(request) {
    const searchParams = request.nextUrl.searchParams;
    const gradeId = searchParams.get("gradeId");

    const numericGradeId = parseInt(gradeId.replace(/\D/g, ""));

    if (isNaN(numericGradeId)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

    if (!gradeId) {
        return NextResponse.json({ error: "gradeId is required" }, { status: 400 });
    }

    try {
        const streams = await db
            .select({
                id: STREAMS.id,
                streamName: STREAMS.streamName,
                description: STREAMS.description,
                gradeId: STREAMS.gradeId,
            })
            .from(STREAMS)
            .where(eq(STREAMS.gradeId, numericGradeId))
            .orderBy(STREAMS.streamName);

        return NextResponse.json({ results: streams });
    } catch (error) {
        console.error("Error fetching streams:", error);
        return NextResponse.json(
            { error: "Failed to fetch streams" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    const data = await request.json();

    try {
        const result = await db.insert(STREAMS).values({
            gradeId: data.gradeId,
            streamName: data.streamName,
            description: data.description,
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error("Error creating stream:", error);
        return NextResponse.json(
            { error: "Failed to create stream" },
            { status: 500 }
        );
    }
}
