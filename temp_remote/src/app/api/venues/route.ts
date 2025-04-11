import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { venues } from "~/server/db/schema";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Schema for venue creation
const venueSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(2, "Address must be at least 2 characters"),
  capacity: z.number().int().min(0).nullable().optional(),
  regionId: z.string().min(1, "Region ID is required"),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  imageUrls: z.array(z.string().url()).nullable().optional(),
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

export async function POST(request: NextRequest) {
  try {
    // Get request body and validate
    const body = await request.json();
    
    const validation = venueSchema.safeParse(body);
    if (!validation.success) {
      console.error("Venue validation failed:", validation.error.errors);
      return NextResponse.json({
        error: "Invalid venue data",
        details: validation.error.errors,
      }, { status: 400 });
    }
    
    const data = validation.data;
    const venueId = uuidv4();
    
    // Insert venue including new fields
    await db.insert(venues).values({
      id: venueId,
      name: data.name,
      address: data.address,
      capacity: data.capacity,
      regionId: data.regionId,
      latitude: data.latitude,
      longitude: data.longitude,
      thumbnailUrl: data.thumbnailUrl,
      imageUrls: data.imageUrls,
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