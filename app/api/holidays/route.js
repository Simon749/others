// app/api/holidays/route.js
// PHASE 1: SCHOOL HOLIDAYS MANAGEMENT - PREVENT MARKING HOLIDAYS

import { db } from "../../../utils";
import { schoolHolidays } from "@/utils/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkPermission, USER_ROLES, permissionDeniedResponse } from "../middleware/permissions";

/**
 * GET /api/holidays
 * Get all school holidays, optionally filtered by date range
 */
export async function GET(req) {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    try {
        let query = db.select().from(schoolHolidays);

        if (startDate && endDate) {
            query = query.where(
                and(
                    lte(schoolHolidays.startDate, new Date(endDate)),
                    gte(schoolHolidays.endDate, new Date(startDate))
                )
            );
        }

        const holidays = await query.orderBy(schoolHolidays.startDate);

        return NextResponse.json({
            success: true,
            data: holidays,
            count: holidays.length,
        });
    } catch (error) {
        console.error("Error fetching holidays:", error);
        return NextResponse.json(
            { error: "Failed to fetch holidays" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/holidays
 * Create a new school holiday
 * Only ADMIN can do this
 */
export async function POST(request) {
    const data = await request.json();

    // TODO: Get from session/JWT after auth setup
    const userRole = data.userRole || USER_ROLES.ADMIN;

    // PHASE 1: CHECK PERMISSIONS
    if (!checkPermission(userRole, "settings:manage")) {
        return NextResponse.json(
            permissionDeniedResponse("unknown", "holidays:create", "Only admins can create holidays"),
            { status: 403 }
        );
    }

    // VALIDATE INPUT
    if (!data.name || !data.startDate || !data.endDate) {
        return NextResponse.json(
            { error: "name, startDate, and endDate are required" },
            { status: 400 }
        );
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate > endDate) {
        return NextResponse.json(
            { error: "startDate must be before endDate" },
            { status: 400 }
        );
    }

    try {
        const result = await db.insert(schoolHolidays)
            .values({
                name: data.name,
                startDate,
                endDate,
                description: data.description || null,
            })
            .returning();

        return NextResponse.json({
            success: true,
            message: "Holiday created successfully",
            data: result[0],
        });
    } catch (error) {
        console.error("Error creating holiday:", error);
        return NextResponse.json(
            { error: "Failed to create holiday" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/holidays/[id]
 * Update a school holiday
 * Only ADMIN can do this
 */
export async function PUT(request) {
    const data = await request.json();
    const userRole = data.userRole || USER_ROLES.ADMIN;

    // PHASE 1: CHECK PERMISSIONS
    if (!checkPermission(userRole, "settings:manage")) {
        return NextResponse.json(
            permissionDeniedResponse("unknown", "holidays:update", "Only admins can update holidays"),
            { status: 403 }
        );
    }

    try {
        const result = await db.update(schoolHolidays)
            .set({
                name: data.name,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                description: data.description,
            })
            .where(eq(schoolHolidays.id, parseInt(data.id)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Holiday updated successfully",
            data: result[0],
        });
    } catch (error) {
        console.error("Error updating holiday:", error);
        return NextResponse.json({ error: "Failed to update holiday" }, { status: 500 });
    }
}

/**
 * DELETE /api/holidays/[id]
 * Delete a school holiday
 * Only ADMIN can do this
 */
export async function DELETE(request) {
    const data = await request.json();
    const userRole = data.userRole || USER_ROLES.ADMIN;

    // PHASE 1: CHECK PERMISSIONS
    if (!checkPermission(userRole, "settings:manage")) {
        return NextResponse.json(
            permissionDeniedResponse("unknown", "holidays:delete", "Only admins can delete holidays"),
            { status: 403 }
        );
    }

    try {
        const result = await db.delete(schoolHolidays)
            .where(eq(schoolHolidays.id, parseInt(data.id)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Holiday deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting holiday:", error);
        return NextResponse.json({ error: "Failed to delete holiday" }, { status: 500 });
    }
}
