import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { venues } from "~/server/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

// Schema for venue updates
const updateVenueSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  address: z
    .string()
    .min(2, "Address must be at least 2 characters")
    .optional(),
  capacity: z.number().int().positive().nullable().optional(),
  regionId: z.string().min(1, "Region ID is required").optional(),
});

// Schema for venue update (similar to create, but all fields potentially optional for PATCH, required for PUT)
// For PUT, we usually expect the full resource representation
const venueUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  capacity: z.number().int().min(0).nullable().optional(),
  regionId: z.string().min(1, "Region ID is required"),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  imageUrls: z.array(z.string().url()).nullable().optional(),
});

interface Params {
  id: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  try {
    const resolvedParams = await params;
    const venueId = resolvedParams.id;

    if (!venueId) {
      return NextResponse.json(
        { error: "Venue ID is required" },
        { status: 400 },
      );
    }

    const venue = await db.query.venues.findFirst({
      where: eq(venues.id, venueId),
      with: {
        region: true, // Include region data if needed for display
      },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    return NextResponse.json(venue);
  } catch (error) {
    const venueIdForError = (await params)?.id ?? "unknown";
    console.error(`Error fetching venue ${venueIdForError}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch venue" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as z.infer<typeof updateVenueSchema>;

    // Validate the request body
    const validation = updateVenueSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.errors },
        { status: 400 },
      );
    }

    const data = validation.data;

    // Check if venue exists
    const existingVenue = await db.query.venues.findFirst({
      where: eq(venues.id, id),
    });

    if (!existingVenue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Update venue with type-safe fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.regionId !== undefined) updateData.regionId = data.regionId;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;

    await db.update(venues).set(updateData).where(eq(venues.id, id));

    const updatedVenue = await db.query.venues.findFirst({
      where: eq(venues.id, id),
      with: {
        region: true,
      },
    });

    return NextResponse.json(updatedVenue);
  } catch (error) {
    console.error("Error updating venue:", error);
    return NextResponse.json(
      { error: "Failed to update venue" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if venue exists
    const existingVenue = await db.query.venues.findFirst({
      where: eq(venues.id, id),
      with: {
        events: true,
      },
    });

    if (!existingVenue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Check if venue has events
    if (existingVenue.events?.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete venue with events",
          message:
            "This venue has events associated with it. Please reassign or delete these events first.",
        },
        { status: 400 },
      );
    }

    // Delete venue
    await db.delete(venues).where(eq(venues.id, id));

    return NextResponse.json(
      { message: "Venue deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting venue:", error);
    return NextResponse.json(
      { error: "Failed to delete venue" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  try {
    const resolvedParams = await params;
    const venueId = resolvedParams.id;

    if (!venueId) {
      return NextResponse.json(
        { error: "Venue ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = venueUpdateSchema.safeParse(body);

    if (!validation.success) {
      console.error("Venue update validation failed:", validation.error.errors);
      return NextResponse.json(
        {
          error: "Invalid venue data",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    // Check if venue exists before attempting update
    const existingVenue = await db.query.venues.findFirst({
      where: eq(venues.id, venueId),
    });

    if (!existingVenue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Update the venue
    await db
      .update(venues)
      .set({
        name: data.name,
        address: data.address,
        capacity: data.capacity,
        regionId: data.regionId,
        latitude: data.latitude,
        longitude: data.longitude,
        thumbnailUrl: data.thumbnailUrl,
        imageUrls: data.imageUrls,
        updatedAt: new Date(), // Update the timestamp
      })
      .where(eq(venues.id, venueId));

    // Fetch the updated venue to return it
    const updatedVenue = await db.query.venues.findFirst({
      where: eq(venues.id, venueId),
      with: {
        region: true,
      },
    });

    return NextResponse.json(updatedVenue);
  } catch (error) {
    const venueIdForError = (await params)?.id ?? "unknown";
    console.error(`Error updating venue ${venueIdForError}:`, error);
    return NextResponse.json(
      { error: "Failed to update venue" },
      { status: 500 },
    );
  }
}
