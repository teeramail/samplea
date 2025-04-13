import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { eventTickets } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export interface EventTicketsParams {
  params: {
    id: string;
  };
}

// GET /api/events/[id]/tickets
// Fetch all tickets for a specific event
export async function GET(
  request: Request,
  context: EventTicketsParams
) {
  try {
    // Properly access the id from context.params
    const { id: eventId } = context.params;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Fetch all tickets for this event
    const tickets = await db.query.eventTickets.findMany({
      where: eq(eventTickets.eventId, eventId),
    });

    return NextResponse.json(tickets, { status: 200 });
  } catch (error) {
    console.error("[API] Error fetching event tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch event tickets" },
      { status: 500 }
    );
  }
}
