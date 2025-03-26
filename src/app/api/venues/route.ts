import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { venues } from "~/server/db/schema";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { eq, desc } from "drizzle-orm";

// Schema for venue creation
const venueSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(2, "Address must be at least 2 characters"),
  capacity: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().positive().nullable().optional()
  ),
  regionId: z.string().min(1, "Region ID is required"),
});

export async function GET() {
  try {
    // Get all venues
    const allVenues = await db.query.venues.findMany({
      orderBy: (venues, { asc }) => [asc(venues.name)],
      with: {
        region: true,
      },
    });

    return NextResponse.json(allVenues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validation = venueSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    const venueId = uuidv4();
    
    // Insert venue
    await db.insert(venues).values({
      id: venueId,
      name: data.name,
      address: data.address,
      capacity: data.capacity,
      regionId: data.regionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Get the created venue with region data
    const newVenue = await db.query.venues.findFirst({
      where: (venues, { eq }) => eq(venues.id, venueId),
      with: {
        region: true,
      },
    });
    
    return NextResponse.json(newVenue, { status: 201 });
  } catch (error) {
    console.error("Error creating venue:", error);
    return NextResponse.json(
      { error: "Failed to create venue" },
      { status: 500 }
    );
  }
} 