import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "~/server/db";
import { events, eventTickets } from "~/server/db/schema";

// Define schema for ticket type
const ticketTypeSchema = z.object({
  seatType: z.string().min(1, "Seat type is required"),
  price: z.number().positive("Price must be greater than 0"),
  capacity: z.number().int().positive("Capacity must be greater than 0"),
  description: z.string().optional(),
});

// Define schema for event creation
const eventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  description: z.string().min(5, "Description must be at least 5 characters long"),
  date: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  imageUrl: z.string().optional(),
  venueId: z.string().min(1, "Please select a venue"),
  regionId: z.string().min(1, "Please select a region"),
  ticketTypes: z.array(ticketTypeSchema).min(1, "At least one ticket type is required"),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const regionId = url.searchParams.get("region");
    
    let query = db.query.events.findMany({
      with: {
        venue: true,
        region: true,
      },
      orderBy: (events, { asc }) => [asc(events.date)],
    });
    
    if (regionId) {
      query = db.query.events.findMany({
        where: (events, { eq }) => eq(events.regionId, regionId),
        with: {
          venue: true,
          region: true,
        },
        orderBy: (events, { asc }) => [asc(events.date)],
      });
    }
    
    const result = await query;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request body
    const data = eventSchema.parse(body);
    
    // Begin a transaction
    const result = await db.transaction(async (tx) => {
      // Create the event
      const eventId = uuidv4();
      const now = new Date();
      
      await tx.insert(events).values({
        id: eventId,
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        imageUrl: data.imageUrl,
        venueId: data.venueId,
        regionId: data.regionId,
        usesDefaultPoster: !data.imageUrl, // Set to true if no image URL is provided
        createdAt: now,
        updatedAt: now // Explicitly set the updatedAt field
      });
      
      // Create ticket types for the event
      for (const ticketType of data.ticketTypes) {
        await tx.insert(eventTickets).values({
          id: uuidv4(),
          eventId: eventId,
          seatType: ticketType.seatType,
          price: ticketType.price,
          capacity: ticketType.capacity,
          description: ticketType.description,
          soldCount: 0, // Initialize with zero sold tickets
          createdAt: now,
          updatedAt: now // Explicitly set the updatedAt field
        });
      }
      
      // Return the created event ID
      return { id: eventId };
    });
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating event:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
} 