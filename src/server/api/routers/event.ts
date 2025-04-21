import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createId } from "@paralleldrive/cuid2";
import { format } from "date-fns";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import {
  events,
  eventTemplates,
  eventTemplateTickets,
  eventTickets,
} from "~/server/db/schema";
import { eq, desc, and, gte, like, asc, count, inArray } from "drizzle-orm";

// Helper function to generate dates from a monthly recurring pattern
function generateDatesFromMonthlyPattern(
  startDate: Date,
  endDate: Date,
  daysOfMonth: number[],
  defaultStartTime: string,
  defaultEndTime?: string | null,
) {
  const dates = [];
  const currentDate = new Date(startDate);
  
  // Set to the beginning of the start month to ensure we catch all possible days
  currentDate.setDate(1);
  
  // Loop through each month in the range
  while (currentDate <= endDate) {
    for (const dayOfMonth of daysOfMonth) {
      // Create a new date for this day of month
      const eventDate = new Date(currentDate);
      eventDate.setDate(dayOfMonth);
      
      // Skip if this date is before the start date or after the end date
      if (eventDate < startDate || eventDate > endDate) {
        continue;
      }
      
      // Skip if the day doesn't exist in the current month (e.g., February 30)
      if (eventDate.getMonth() !== currentDate.getMonth()) {
        continue;
      }
      
      // Parse time strings
      const startTimeParts = defaultStartTime.split(":").map(Number);
      const startHours = startTimeParts[0] ?? 0;
      const startMinutes = startTimeParts[1] ?? 0;
      
      // Create start time
      const startTime = new Date(eventDate);
      startTime.setHours(startHours, startMinutes, 0, 0);
      
      // Create end time if provided
      let endTime;
      if (defaultEndTime) {
        const endTimeParts = defaultEndTime.split(":").map(Number);
        const endHours = endTimeParts[0] ?? 0;
        const endMinutes = endTimeParts[1] ?? 0;
        endTime = new Date(eventDate);
        endTime.setHours(endHours, endMinutes, 0, 0);
      }
      
      dates.push({
        date: new Date(eventDate),
        startTime,
        endTime,
      });
    }
    
    // Move to the next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  // Sort the dates chronologically
  return dates.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Helper function to generate dates from a recurring pattern
function generateDatesFromRecurringPattern(
  startDate: Date,
  endDate: Date,
  recurringDaysOfWeek: number[],
  defaultStartTime: string,
  defaultEndTime?: string | null,
) {
  const dates = [];
  const currentDate = new Date(startDate);

  // Loop through each day in the range
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check if this day of week is in the recurring pattern
    if (recurringDaysOfWeek.includes(dayOfWeek)) {
      // Parse time strings
      const startTimeParts = defaultStartTime.split(":").map(Number);
      const startHours = startTimeParts[0] ?? 0;
      const startMinutes = startTimeParts[1] ?? 0;

      // Create start time
      const startTime = new Date(currentDate);
      startTime.setHours(startHours, startMinutes, 0, 0);

      // Create end time if provided
      let endTime;
      if (defaultEndTime) {
        const endTimeParts = defaultEndTime.split(":").map(Number);
        const endHours = endTimeParts[0] ?? 0;
        const endMinutes = endTimeParts[1] ?? 0;
        endTime = new Date(currentDate);
        endTime.setHours(endHours, endMinutes, 0, 0);
      }

      dates.push({
        date: new Date(currentDate),
        startTime,
        endTime,
      });
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// Helper function to generate dates from custom dates provided by the user
function generateDatesFromCustomDates(
  customDates: Date[],
  defaultStartTime: string,
  defaultEndTime?: string | null,
) {
  const dates = [];

  for (const customDate of customDates) {
    // Parse time strings
    const startTimeParts = defaultStartTime.split(":").map(Number);
    const startHours = startTimeParts[0] ?? 0;
    const startMinutes = startTimeParts[1] ?? 0;

    // Create start time
    const startTime = new Date(customDate);
    startTime.setHours(startHours, startMinutes, 0, 0);

    // Create end time if provided
    let endTime;
    if (defaultEndTime) {
      const endTimeParts = defaultEndTime.split(":").map(Number);
      const endHours = endTimeParts[0] ?? 0;
      const endMinutes = endTimeParts[1] ?? 0;
      endTime = new Date(customDate);
      endTime.setHours(endHours, endMinutes, 0, 0);
    }

    dates.push({
      date: new Date(customDate),
      startTime,
      endTime,
    });
  }

  // Sort the dates chronologically
  return dates.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Helper function to format event title using template
function formatEventTitle(
  template: string,
  data: { venue: string; date: string; time: string },
) {
  return template
    .replace("{venue}", data.venue)
    .replace("{date}", data.date)
    .replace("{time}", data.time);
}

export const eventRouter = createTRPCRouter({
  getUpcoming: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(10).default(3),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 3;
      try {
        const upcomingEvents = await ctx.db.query.events.findMany({
          where: and(
            gte(events.date, new Date()), // Events from today onwards
          ),
          orderBy: [asc(events.date)], // Sort by nearest upcoming events first
          limit: limit,
          with: {
            // Ensure full related objects are fetched
            venue: true, // Fetch full venue object
            region: true, // Fetch full region object
          },
          // Remove 'columns' to fetch all default columns + relations
          // columns: {
          //     id: true,
          //     title: true,
          //     date: true,
          //     thumbnailUrl: true,
          //     // slug: true, // Event table likely doesn't have a slug column
          // }
        });
        // Now upcomingEvents will include the full venue and region objects
        return upcomingEvents;
      } catch (error) {
        console.error("Failed to fetch upcoming events:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch upcoming events",
        });
      }
    }),

  // Add list procedure with pagination and sorting
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(10),
          page: z.number().min(1).default(1),
          query: z.string().optional(),
          sortField: z
            .enum(["title", "date", "venue", "region", "updatedAt"])
            .default("updatedAt"),
          sortDirection: z.enum(["asc", "desc"]).default("desc"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const page = input?.page ?? 1;
      const offset = (page - 1) * limit;
      const query = input?.query;
      const sortField = input?.sortField ?? "updatedAt";
      const sortDirection = input?.sortDirection ?? "desc";

      try {
        let whereClause = undefined;

        if (query) {
          whereClause = like(events.title, `%${query}%`);
        }

        // Count total events for pagination
        const totalCount = await ctx.db
          .select({ count: count() })
          .from(events)
          .where(whereClause ?? undefined)
          .then((result) => result[0]?.count ?? 0);

        // Determine sort order
        let orderBy;
        switch (sortField) {
          case "title":
            orderBy =
              sortDirection === "asc" ? asc(events.title) : desc(events.title);
            break;
          case "date":
            orderBy =
              sortDirection === "asc" ? asc(events.date) : desc(events.date);
            break;
          case "updatedAt":
            orderBy =
              sortDirection === "asc"
                ? asc(events.updatedAt)
                : desc(events.updatedAt);
            break;
          default:
            orderBy = desc(events.updatedAt);
        }

        const eventsList = await ctx.db.query.events.findMany({
          where: whereClause,
          orderBy: [orderBy],
          limit: limit,
          offset: offset,
          with: {
            venue: true,
            region: true,
          },
        });

        return {
          items: eventsList,
          totalCount,
          pageCount: Math.ceil(totalCount / limit),
          currentPage: page,
        };
      } catch (error) {
        console.error("Failed to fetch events:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch events",
        });
      }
    }),

  // Get event by ID procedure
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const event = await ctx.db.query.events.findFirst({
          where: eq(events.id, input.id),
          with: {
            venue: true,
            region: true,
          },
        });

        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        return event;
      } catch (error) {
        console.error("Failed to fetch event:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch event",
        });
      }
    }),

  // Get all event IDs for navigation
  getAllIds: publicProcedure.query(async ({ ctx }) => {
    try {
      const allEvents = await ctx.db
        .select({ id: events.id })
        .from(events)
        .orderBy(desc(events.updatedAt));

      return allEvents.map((event) => event.id);
    } catch (error) {
      console.error("Failed to fetch event IDs:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch event IDs",
      });
    }
  }),

  // Create a new event
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        date: z.date(),
        startTime: z.date(),
        endTime: z.date().optional(),
        venueId: z.string().optional(),
        regionId: z.string().optional(),
        status: z.string().default("SCHEDULED"),
        thumbnailUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
        usesDefaultPoster: z.boolean().default(true),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        // Ticket types
        tickets: z
          .array(
            z.object({
              seatType: z.string().min(1),
              price: z.number().positive(),
              capacity: z.number().positive(),
              description: z.string().optional(),
              discountedPrice: z.number().optional(),
              cost: z.number().optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { tickets, ...eventData } = input;

        // Create the event
        const eventId = createId();
        await ctx.db.insert(events).values({
          id: eventId,
          ...eventData,
        });

        // Create ticket types if provided
        if (tickets && tickets.length > 0) {
          for (const ticket of tickets) {
            await ctx.db.insert(eventTickets).values({
              id: createId(),
              eventId,
              ...ticket,
              soldCount: 0,
            });
          }
        }

        return { id: eventId };
      } catch (error) {
        console.error("Failed to create event:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create event",
        });
      }
    }),

  // Generate events from templates
  // TEMPORARY: Changed from protectedProcedure to publicProcedure for development
  // TODO: Change back to protectedProcedure before deploying to production
  generateEventsFromTemplates: publicProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        templateIds: z.array(z.string()).optional(),
        previewOnly: z.boolean().default(false),
        customDates: z.array(z.date()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { startDate, endDate, templateIds, previewOnly, customDates } = input;

        // 1. Get active templates (filter by templateIds if provided)
        const templates = await ctx.db.query.eventTemplates.findMany({
          where:
            templateIds && templateIds.length > 0
              ? inArray(eventTemplates.id, templateIds)
              : eq(eventTemplates.isActive, true),
          with: {
            venue: true,
            region: true,
          },
          // Ensure we select all needed fields
          columns: {
            id: true,
            templateName: true,
            venueId: true,
            regionId: true,
            defaultTitleFormat: true,
            defaultDescription: true,
            recurringDaysOfWeek: true,
            dayOfMonth: true, // Important for monthly recurrence
            recurrenceType: true, // Important to determine recurrence pattern
            defaultStartTime: true,
            defaultEndTime: true,
            isActive: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // For each template, get its ticket types
        const templatesWithTickets = await Promise.all(
          templates.map(async (template) => {
            const templateTickets =
              await ctx.db.query.eventTemplateTickets.findMany({
                where: eq(eventTemplateTickets.eventTemplateId, template.id),
              });
            return { ...template, templateTickets };
          }),
        );

        // 2. Generate event dates based on recurrence type and pattern
        const eventsToCreate = [];

        for (const template of templatesWithTickets) {
          // Generate dates based on recurrence type and pattern
          let dates = [];
          
          if (template.recurrenceType === 'none' && customDates && customDates.length > 0) {
            // For templates with no recurrence, use the custom dates provided by the user
            dates = generateDatesFromCustomDates(
              customDates,
              template.defaultStartTime ?? "00:00", // Provide default time if null
              template.defaultEndTime,
            );
          } else if (template.recurrenceType === 'monthly' && template.dayOfMonth) {
            // For monthly recurrence, use the dayOfMonth field as array
            // Make sure dayOfMonth is an array (for backward compatibility)
            const daysArray = Array.isArray(template.dayOfMonth) 
              ? template.dayOfMonth 
              : template.dayOfMonth ? [template.dayOfMonth] : [];
              
            dates = generateDatesFromMonthlyPattern(
              startDate,
              endDate,
              daysArray,
              template.defaultStartTime ?? "00:00", // Provide default time if null
              template.defaultEndTime,
            );
          } else {
            // For weekly recurrence (default), use recurringDaysOfWeek
            dates = generateDatesFromRecurringPattern(
              startDate,
              endDate,
              template.recurringDaysOfWeek ?? [], // Provide empty array as fallback if null
              template.defaultStartTime ?? "00:00", // Provide default time if null
              template.defaultEndTime,
            );
          }

          // 3. For each date, create event data
          for (const date of dates) {
            // Format title using template
            const title = formatEventTitle(template.defaultTitleFormat ?? "{venue} Event", {
              venue: template.venue?.name ?? "Venue",
              date: format(date.date, "MMMM d, yyyy"),
              time: format(date.startTime, "h:mm a"),
            });

            // Create event data
            const eventData = {
              title,
              description: template.defaultDescription,
              date: date.date,
              startTime: date.startTime,
              endTime: date.endTime,
              venueId: template.venueId,
              regionId: template.regionId,
              status: "SCHEDULED",
              usesDefaultPoster: true,
            };

            // Create ticket data
            const ticketData = template.templateTickets.map((ticket) => ({
              seatType: ticket.seatType,
              price: ticket.defaultPrice,
              capacity: ticket.defaultCapacity,
              description: ticket.defaultDescription,
              soldCount: 0,
            }));

            eventsToCreate.push({
              event: eventData,
              tickets: ticketData,
              venueName: template.venue?.name,
              regionName: template.region?.name,
              templateName: template.templateName,
            });
          }
        }

        // 4. If not preview, save to database
        if (!previewOnly && eventsToCreate.length > 0) {
          for (const item of eventsToCreate) {
            // Create event
            const eventId = createId();
            await ctx.db.insert(events).values({
              id: eventId,
              ...item.event,
            });

            // Create tickets for this event
            for (const ticket of item.tickets) {
              await ctx.db.insert(eventTickets).values({
                id: createId(),
                eventId,
                ...ticket,
              });
            }
          }
        }

        return eventsToCreate;
      } catch (error) {
        console.error("Failed to generate events from templates:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate events from templates",
        });
      }
    }),
});
