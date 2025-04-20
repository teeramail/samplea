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
  description: z
    .string()
    .min(5, "Description must be at least 5 characters long"),
  date: z.string().datetime().refine(
    (dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      // Validate year is reasonable (not in Buddhist calendar - BE years are typically > 2500)
      return year > 1900 && year < 2500;
    },
    { message: "Date appears to be in Buddhist Era. Please use Christian Era (CE) dates." }
  ),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  imageUrls: z.array(z.string().url()).nullable().optional(),
  venueId: z.string().min(1, "Please select a venue"),
  regionId: z.string().min(1, "Please select a region"),
  ticketTypes: z
    .array(ticketTypeSchema)
    .min(1, "At least one ticket type is required"),
});

// Define interface for the POST request body based on eventSchema
interface EventCreateRequestBody {
  title: string;
  description: string;
  date: string; // Keep as string, will be parsed
  startTime: string; // Keep as string, will be parsed
  endTime?: string | null; // Keep as string, will be parsed
  thumbnailUrl?: string | null;
  imageUrls?: string[] | null;
  venueId: string;
  regionId: string;
  ticketTypes: Array<{
    // Keep this structure
    seatType: string;
    price: number;
    capacity: number;
    description?: string;
  }>;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const regionId = url.searchParams.get("region");

    let query;
    if (regionId) {
      query = db.query.events.findMany({
        columns: {
          // Explicitly select columns needed by the frontend
          id: true,
          title: true,
          date: true,
          thumbnailUrl: true,
        },
        where: (eventsTable, { eq }) => eq(eventsTable.regionId, regionId),
        with: {
          venue: {
            columns: { name: true }, // Only select venue name
          },
          region: {
            columns: { name: true }, // Only select region name
          },
        },
        orderBy: (eventsTable, { desc }) => [desc(eventsTable.date)], // Order by event date
      });
    } else {
      query = db.query.events.findMany({
        columns: {
          // Explicitly select columns needed by the frontend
          id: true,
          title: true,
          date: true,
          thumbnailUrl: true,
        },
        with: {
          venue: {
            columns: { name: true }, // Only select venue name
          },
          region: {
            columns: { name: true }, // Only select region name
          },
        },
        orderBy: (eventsTable, { desc }) => [desc(eventsTable.date)], // Order by event date
      });
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    // Use type assertion for the request body
    const body = (await req.json()) as EventCreateRequestBody;

    // Zod validation already handles type checking, no need for explicit validation before parse
    const validation = eventSchema.safeParse(body);
    if (!validation.success) {
      console.error("Event validation failed:", validation.error.errors);
      return NextResponse.json(
        {
          error: "Validation error",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const validatedData = validation.data;
    
    // Extra validation for Buddhist Era dates
    const convertToChristianEra = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      // If it's likely a Buddhist Era date (BE is 543 years ahead of CE)
      if (year > 2500) {
        date.setFullYear(year - 543);
        return date;
      }
      return new Date(dateString);
    };

    const result = await db.transaction(async (tx) => {
      const eventId = uuidv4();
      const now = new Date();

      await tx.insert(events).values({
        id: eventId,
        title: validatedData.title,
        description: validatedData.description,
        date: convertToChristianEra(validatedData.date),
        startTime: convertToChristianEra(validatedData.startTime),
        endTime: validatedData.endTime ? convertToChristianEra(validatedData.endTime) : null,
        thumbnailUrl: validatedData.thumbnailUrl,
        imageUrls: validatedData.imageUrls,
        venueId: validatedData.venueId,
        regionId: validatedData.regionId,
        usesDefaultPoster:
          !validatedData.thumbnailUrl && !validatedData.imageUrls,
        createdAt: now,
        updatedAt: now,
      });

      for (const ticketType of validatedData.ticketTypes) {
        await tx.insert(eventTickets).values({
          id: uuidv4(),
          eventId: eventId,
          seatType: ticketType.seatType,
          price: ticketType.price,
          capacity: ticketType.capacity,
          description: ticketType.description,
          soldCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      }

      return { id: eventId };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating event:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
