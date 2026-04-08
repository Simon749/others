import { NextResponse } from "next/server";
import { db } from "../../../../utils";
import { GRADES, STREAMS } from "@/utils/schema";

/**
 * Initialize default streams for grades
 * This endpoint helps populate the streams table with default values
 * for the Kenyan education system
 */
export async function POST(request) {
    const data = await request.json();
    const { gradeId, streamName, description } = data;

    if (!gradeId || !streamName || !description) {
        return NextResponse.json(
            { error: "gradeId, streamName, and description are required" },
            { status: 400 }
        );
    }

    try {
        // Check if stream already exists
        const existingStream = await db
            .select()
            .from(STREAMS)
            .where((t) => t.gradeId === gradeId && t.streamName === streamName)
            .limit(1);

        if (existingStream.length > 0) {
            return NextResponse.json(
                { error: "Stream already exists for this grade" },
                { status: 409 }
            );
        }

        const result = await db.insert(STREAMS).values({
            gradeId,
            streamName,
            description,
        }).returning();

        return NextResponse.json({
            success: true,
            message: "Stream created successfully",
            data: result[0],
        });
    } catch (error) {
        console.error("Error creating stream:", error);
        return NextResponse.json(
            { error: "Failed to create stream" },
            { status: 500 }
        );
    }
}

/**
 * Endpoint to initialize default streams for all grades
 * Usage: POST /api/streams/initialize
 * This creates default streams A, B, C for each grade
 */
export async function PUT(request) {
    try {
        // Get all grades
        const allGrades = await db.select().from(GRADES);

        const defaultStreams = ["A", "B", "C"];
        let created = 0;

        for (const grade of allGrades) {
            for (const stream of defaultStreams) {
                try {
                    const existingStream = await db
                        .select()
                        .from(STREAMS)
                        .where((t) => t.gradeId === grade.id && t.streamName === stream)
                        .limit(1);

                    if (existingStream.length === 0) {
                        await db.insert(STREAMS).values({
                            gradeId: grade.id,
                            streamName: stream,
                            description: `${grade.grade}${stream}`,
                        });
                        created++;
                    }
                } catch (error) {
                    console.error(
                        `Error creating stream ${stream} for grade ${grade.grade}:`,
                        error
                    );
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Initialization complete. ${created} streams created.`,
            created,
        });
    } catch (error) {
        console.error("Error initializing streams:", error);
        return NextResponse.json(
            { error: "Failed to initialize streams" },
            { status: 500 }
        );
    }
}
