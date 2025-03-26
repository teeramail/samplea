import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { regions } from "~/server/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

// Schema for region updates - match the actual database structure
const updateRegionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get region by ID
    const region = await db.query.regions.findFirst({
      where: eq(regions.id, id),
      with: {
        venues: true,
      },
    });
    
    if (!region) {
      return NextResponse.json(
        { error: "Region not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(region);
  } catch (error) {
    console.error("Error fetching region:", error);
    return NextResponse.json(
      { error: "Failed to fetch region" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Validate request body
    const validation = updateRegionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Check if region exists
    const existingRegion = await db.query.regions.findFirst({
      where: eq(regions.id, id),
    });
    
    if (!existingRegion) {
      return NextResponse.json(
        { error: "Region not found" },
        { status: 404 }
      );
    }
    
    // Update region
    await db.update(regions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(regions.id, id));
    
    const updatedRegion = await db.query.regions.findFirst({
      where: eq(regions.id, id),
    });
    
    return NextResponse.json(updatedRegion);
  } catch (error) {
    console.error("Error updating region:", error);
    return NextResponse.json(
      { error: "Failed to update region" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if region exists
    const existingRegion = await db.query.regions.findFirst({
      where: eq(regions.id, id),
      with: {
        venues: true,
      },
    });
    
    if (!existingRegion) {
      return NextResponse.json(
        { error: "Region not found" },
        { status: 404 }
      );
    }
    
    // Check if region has venues
    if (existingRegion.venues && existingRegion.venues.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete region with venues",
          message: "This region has venues associated with it. Please reassign or delete these venues first."
        },
        { status: 400 }
      );
    }
    
    // Delete region
    await db.delete(regions).where(eq(regions.id, id));
    
    return NextResponse.json(
      { message: "Region deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting region:", error);
    return NextResponse.json(
      { error: "Failed to delete region" },
      { status: 500 }
    );
  }
} 