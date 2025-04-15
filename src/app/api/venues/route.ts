import { type NextRequest, NextResponse } from "next/server";
import { db } from "../../../server/db";
import { venues, venueToVenueTypes } from "../../../server/db/schema";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";

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
  // New fields
  googleMapsUrl: z.string().url().nullable().optional(),
  remarks: z.string().nullable().optional(),
  socialMediaLinks: z.record(z.string()).nullable().optional(),
  // Venue types
  venueTypes: z.array(z.object({
    venueTypeId: z.string(),
    isPrimary: z.boolean().default(false)
  })).min(1, "At least one venue type is required"),
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
    const venueId = createId();
    
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
      // Add new fields
      googleMapsUrl: data.googleMapsUrl,
      remarks: data.remarks,
      socialMediaLinks: data.socialMediaLinks,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Insert venue types
    if (data.venueTypes && data.venueTypes.length > 0) {
      const venueTypeEntries = data.venueTypes.map(type => ({
        id: createId(),
        venueId: venueId,
        venueTypeId: type.venueTypeId,
        isPrimary: type.isPrimary,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      await db.insert(venueToVenueTypes).values(venueTypeEntries);
    }
    
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