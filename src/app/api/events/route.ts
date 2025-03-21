import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "~/server/db";
import { events } from "~/server/db/schema";

// Accept string values and handle conversion in the controller
const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string().optional().nullable(),
  venueId: z.string(),
  regionId: z.string(),
  imageUrl: z.string().optional(),
  usesDefaultPoster: z.boolean().default(true),
});

export async function GET() {
  try {
    const allEvents = await db.query.events.findMany({
      orderBy: (events, { desc }) => [desc(events.date)],
      with: {
        venue: true,
        region: true,
      },
    });
    
    return NextResponse.json(allEvents);
  } catch (error) {
    console.error("Error getting events:", error);
    return NextResponse.json(
      { error: "Failed to get events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received event data:", body);
    
    // Validate basic structure
    const validatedData = eventSchema.parse(body);
    console.log("Validated event data:", validatedData);
    
    // Safe date parsing
    const parseDate = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date: ${dateStr}`);
        }
        return date;
      } catch (err) {
        console.error(`Error parsing date ${dateStr}:`, err);
        throw new Error(`Invalid date format: ${dateStr}`);
      }
    };
    
    // Parse dates
    const dateObj = parseDate(validatedData.date);
    const startTimeObj = parseDate(validatedData.startTime);
    const endTimeObj = validatedData.endTime ? parseDate(validatedData.endTime) : null;
    
    console.log("Parsed dates:", {
      date: dateObj,
      startTime: startTimeObj,
      endTime: endTimeObj,
    });
    
    // Insert event
    const newEvent = await db.insert(events).values({
      id: uuidv4(),
      title: validatedData.title,
      description: validatedData.description || null,
      date: dateObj,
      startTime: startTimeObj,
      endTime: endTimeObj,
      venueId: validatedData.venueId,
      regionId: validatedData.regionId,
      imageUrl: validatedData.imageUrl || null,
      usesDefaultPoster: validatedData.usesDefaultPoster,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log("Created event:", newEvent[0]);
    return NextResponse.json(newEvent[0], { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { error: "Failed to create event", message: errorMessage },
      { status: 500 }
    );
  }
} 