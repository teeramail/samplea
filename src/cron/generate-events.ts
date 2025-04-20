import { startOfDay, addDays, format } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { 
  eventTemplates,
  events,
  eventTickets
} from "~/server/db/schema";
import { calculateEventDates, doesEventExist } from "~/lib/recurringEvents";
import { createId } from "@paralleldrive/cuid2";

// Helper to format event title based on template format string
function formatEventTitle(
  template: string,
  data: { venue: string; date: string; time: string }
): string {
  let result = template;
  
  // Replace {placeholders} with actual values
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  
  return result;
}

/**
 * Generates events from active templates for the next 30 days
 * This function is meant to be called by a cron job
 */
export async function generateUpcomingEvents(lookAheadDays = 30): Promise<{
  generatedCount: number;
  templates: number;
}> {
  console.log(`[CRON] Starting event generation for next ${lookAheadDays} days`);
  
  // Define date range (from today to X days in the future)
  const today = startOfDay(new Date());
  const endDate = addDays(today, lookAheadDays);
  
  // Get all active templates
  const templates = await db.query.eventTemplates.findMany({
    where: eq(eventTemplates.isActive, true),
    with: {
      venue: true,
      region: true,
      templateTickets: true,
    },
  });
  
  console.log(`[CRON] Found ${templates.length} active templates`);
  
  let totalEventsGenerated = 0;
  
  // Process each template
  for (const template of templates) {
    // Calculate dates based on recurrence pattern
    const dates = calculateEventDates(today, endDate, template);
    
    console.log(`[CRON] Template "${template.templateName}": ${dates.length} potential dates`);
    
    // For each calculated date, create an event if it doesn't exist yet
    for (const { date, startTime, endTime } of dates) {
      // Skip if event already exists for this template and date
      const eventExists = await doesEventExist(db, template.id, date, template.venueId);
      
      if (eventExists) {
        console.log(`[CRON] Event already exists for template "${template.templateName}" on ${format(date, 'yyyy-MM-dd')}`);
        continue;
      }
      
      // Skip if we don't have a valid startTime (it's required by the schema)
      if (!startTime) {
        console.log(`[CRON] Skipping event for template "${template.templateName}" on ${format(date, 'yyyy-MM-dd')} - missing required startTime`);
        continue;
      }
      
      try {
        // Generate title based on template format
        const title = formatEventTitle(template.defaultTitleFormat, {
          venue: template.venue?.name ?? "Venue",
          date: format(date, "MMMM d, yyyy"),
          time: format(startTime, "h:mm a"),
        });
        
        // Create event data object
        const eventData = {
          title,
          description: template.defaultDescription,
          date,
          startTime,
          endTime,
          venueId: template.venueId,
          regionId: template.regionId,
          templateId: template.id,
          status: "SCHEDULED",
          usesDefaultPoster: true,
        };
        
        // Create event with required fields
        const eventId = createId();
        await db.insert(events).values({
          id: eventId,
          ...eventData,
        });
        
        // Create ticket types for this event
        for (const ticketTemplate of template.templateTickets) {
          await db.insert(eventTickets).values({
            id: createId(),
            eventId,
            seatType: ticketTemplate.seatType,
            price: ticketTemplate.defaultPrice,
            capacity: ticketTemplate.defaultCapacity,
            description: ticketTemplate.defaultDescription,
            soldCount: 0,
          });
        }
        
        totalEventsGenerated++;
        console.log(`[CRON] Created new event "${title}" for ${format(date, 'yyyy-MM-dd')}`);
      } catch (error) {
        console.error(`[CRON] Error creating event for template "${template.templateName}" on ${format(date, 'yyyy-MM-dd')}:`, error);
      }
    }
  }
  
  console.log(`[CRON] Event generation complete. Created ${totalEventsGenerated} new events.`);
  
  return {
    generatedCount: totalEventsGenerated,
    templates: templates.length,
  };
} 