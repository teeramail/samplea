import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { events, eventTickets } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Define schema for ticket type
const ticketTypeSchema = z.object({
  id: z.string().optional(),
  seatType: z.string().min(1, "Seat type is required"),
  price: z.number().positive("Price must be greater than 0"),
  capacity: z.number().int().positive("Capacity must be greater than 0"),
  description: z.string().optional(),
});

// Define schema for event update
const updateEventSchema = z.object({
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
  endTime: z.string().datetime(),
  imageUrl: z.string().optional().nullable(),
  venueId: z.string().min(1, "Please select a venue"),
  regionId: z.string().min(1, "Please select a region"),
  ticketTypes: z
    .array(ticketTypeSchema)
    .min(1, "At least one ticket type is required"),
});

// GET event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Using the asynchronous param pattern required by Next.js 15
    const { id } = await params;

    console.log(`Fetching event with ID: ${id}`);

    // Get the event with related data
    const event = await db.query.events.findFirst({
      where: eq(events.id, id),
      with: {
        venue: true,
        region: true,
        eventTickets: true, // Corrected relation name
      },
    });

    if (!event) {
      console.log(`Event with ID ${id} not found`);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event); // Return the event object directly
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event", details: (error as Error).message },
      { status: 500 },
    );
  }
}

// UPDATE event by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Parse event ID
    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    console.log(`Updating event with ID: ${eventId}`);

    // Check if event exists
    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        eventTickets: true,
      },
    });

    if (!existingEvent) {
      console.log(`Event with ID ${eventId} not found`);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get the request body and validate it
    const body = await request.json();

    // Validate the request body
    const validation = updateEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
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

    // Begin a transaction
    await db.transaction(async (tx) => {
      // Update the event
      const now = new Date();

      await tx
        .update(events)
        .set({
          title: validatedData.title,
          description: validatedData.description,
          date: convertToChristianEra(validatedData.date),
          startTime: convertToChristianEra(validatedData.startTime),
          endTime: convertToChristianEra(validatedData.endTime),
          imageUrl: validatedData.imageUrl,
          venueId: validatedData.venueId,
          regionId: validatedData.regionId,
          usesDefaultPoster: !validatedData.imageUrl, // Set to true if no image URL is provided
          updatedAt: now,
        })
        .where(eq(events.id, eventId));

      // Process ticket types
      if (existingEvent.eventTickets) {
        const existingTicketIds = new Set(
          existingEvent.eventTickets.map((ticket) => ticket.id)
        );
        const updatedTicketIds = new Set(
          validatedData.ticketTypes
            .filter((t) => t.id)
            .map((t) => t.id as string)
        );

        console.log(`Processing ${validatedData.ticketTypes.length} ticket types`);

        // Delete tickets that are no longer present
        for (const ticketId of existingTicketIds) {
          if (!updatedTicketIds.has(ticketId)) {
            console.log(`Deleting ticket: ${ticketId}`);
            await tx.delete(eventTickets).where(eq(eventTickets.id, ticketId));
          }
        }

        // Update or create ticket types
        for (const ticketType of validatedData.ticketTypes) {
          if (ticketType.id && existingTicketIds.has(ticketType.id)) {
            // Update existing ticket type
            console.log(`Updating ticket: ${ticketType.id}`);
            await tx
              .update(eventTickets)
              .set({
                seatType: ticketType.seatType,
                price: ticketType.price,
                capacity: ticketType.capacity,
                description: ticketType.description,
                updatedAt: now,
              })
              .where(eq(eventTickets.id, ticketType.id));
          } else {
            // Create new ticket type
            const newTicketId = uuidv4();
            console.log(`Creating new ticket: ${newTicketId}`);
            await tx.insert(eventTickets).values({
              id: newTicketId,
              eventId: eventId,
              seatType: ticketType.seatType,
              price: ticketType.price,
              capacity: ticketType.capacity,
              description: ticketType.description,
              soldCount: 0, // Initialize with zero sold tickets
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }
    });

    console.log(`Event ${eventId} updated successfully`);

    // Get the updated event with related data
    const updatedEvent = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        venue: true,
        region: true,
        eventTickets: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update event", details: (error as Error).message },
      { status: 500 },
    );
  }
}

// DELETE event by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Using the asynchronous param pattern required by Next.js 15
    const { id } = await params;

    console.log(`Deleting event with ID: ${id}`);

    // Check if event exists
    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, id),
    });

    if (!existingEvent) {
      console.log(`Event with ID ${id} not found`);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Delete the event and related ticket types in a transaction
    await db.transaction(async (tx) => {
      // Delete all ticket types for this event
      console.log(`Deleting all tickets for event: ${id}`);
      await tx.delete(eventTickets).where(eq(eventTickets.eventId, id));

      // Delete the event
      console.log(`Deleting event: ${id}`);
      await tx.delete(events).where(eq(events.id, id));
    });

    console.log(`Event ${id} deleted successfully`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event", details: (error as Error).message },
      { status: 500 },
    );
  }
}
