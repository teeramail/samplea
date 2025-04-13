import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { eventTickets } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// GET /api/events/[id]/tickets
// Fetch all tickets for a specific event
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // In Next.js 15, params is now asynchronous and must be awaited
    const params = await context.params;
    const eventId = params.id;
    
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
