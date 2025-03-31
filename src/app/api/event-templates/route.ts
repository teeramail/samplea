import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { eventTemplates, eventTemplateTickets } from '~/server/db/schema';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

// Zod schema for validation on the backend (reuse or redefine if needed)
const eventTemplateTicketSchema = z.object({
  seatType: z.string().min(1),
  defaultPrice: z.number().positive(),
  defaultCapacity: z.number().int().positive(),
  defaultDescription: z.string().optional().nullable(), // Allow null from DB
});

const eventTemplateSchema = z.object({
  templateName: z.string().min(1),
  venueId: z.string().min(1),
  regionId: z.string().min(1),
  defaultTitleFormat: z.string().min(1),
  defaultDescription: z.string().optional().nullable(), // Allow null from DB
  recurringDaysOfWeek: z.array(z.number().min(0).max(6)).min(1),
  defaultStartTime: z.string(), // Already validated on client, pass as string
  defaultEndTime: z.string().optional().nullable(), // Allow null from DB
  isActive: z.boolean().default(true),
  templateTickets: z.array(eventTemplateTicketSchema).min(1),
});

// GET Handler (Optional, as list page fetches directly)
export async function GET() {
  try {
    const templates = await db.query.eventTemplates.findMany({
      orderBy: (et, { desc }) => [desc(et.createdAt)],
      with: {
        venue: true,
        region: true,
        templateTickets: true,
      },
    });
    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error("Error fetching event templates:", error);
    return NextResponse.json({ error: 'Failed to fetch event templates' }, { status: 500 });
  }
}

// POST Handler (Create New Template)
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate incoming data
    const validationResult = eventTemplateSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.errors }, 
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const templateId = nanoid();

    // Use transaction to insert template and its tickets together
    await db.transaction(async (tx) => {
      // Insert the main template
      await tx.insert(eventTemplates).values({
        id: templateId,
        templateName: validatedData.templateName,
        venueId: validatedData.venueId,
        regionId: validatedData.regionId,
        defaultTitleFormat: validatedData.defaultTitleFormat,
        defaultDescription: validatedData.defaultDescription,
        recurringDaysOfWeek: validatedData.recurringDaysOfWeek,
        defaultStartTime: validatedData.defaultStartTime,
        defaultEndTime: validatedData.defaultEndTime,
        isActive: validatedData.isActive,
      });

      // Prepare ticket data
      const ticketsData = validatedData.templateTickets.map(ticket => ({
        id: nanoid(),
        eventTemplateId: templateId,
        seatType: ticket.seatType,
        defaultPrice: ticket.defaultPrice,
        defaultCapacity: ticket.defaultCapacity,
        defaultDescription: ticket.defaultDescription,
      }));

      // Insert the associated tickets
      await tx.insert(eventTemplateTickets).values(ticketsData);
    });

    return NextResponse.json({ success: true, templateId }, { status: 201 });

  } catch (error) {
    console.error("Error creating event template:", error);
    // Basic error handling, consider more specific checks (e.g., duplicate name?)
    return NextResponse.json({ error: 'Failed to create event template' }, { status: 500 });
  }
} 