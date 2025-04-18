import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { events, venues, regions } from "~/server/db/schema";
import { eq, desc, and, gte, like, asc, count } from "drizzle-orm";

export const eventRouter = createTRPCRouter({
  getUpcoming: publicProcedure
    .input(z.object({
        limit: z.number().min(1).max(10).default(3),
    }).optional())
    .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 3;
        try {
            const upcomingEvents = await ctx.db.query.events.findMany({
                where: and(
                    gte(events.date, new Date()), // Events from today onwards
                ),
                orderBy: [desc(events.date)],
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
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch upcoming events' });
        }
    }),

  // Add list procedure with pagination and sorting
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      page: z.number().min(1).default(1),
      query: z.string().optional(),
      sortField: z.enum(['title', 'date', 'venue', 'region', 'updatedAt']).default('updatedAt'),
      sortDirection: z.enum(['asc', 'desc']).default('desc'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const page = input?.page ?? 1;
      const offset = (page - 1) * limit;
      const query = input?.query;
      const sortField = input?.sortField ?? 'updatedAt';
      const sortDirection = input?.sortDirection ?? 'desc';
      
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
          .then(result => result[0]?.count ?? 0);
        
        // Determine sort order
        let orderBy;
        switch (sortField) {
          case 'title':
            orderBy = sortDirection === 'asc' ? asc(events.title) : desc(events.title);
            break;
          case 'date':
            orderBy = sortDirection === 'asc' ? asc(events.date) : desc(events.date);
            break;
          case 'updatedAt':
            orderBy = sortDirection === 'asc' ? asc(events.updatedAt) : desc(events.updatedAt);
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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch events' });
      }
    }),

  // Get event by ID procedure
  getById: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const event = await ctx.db.query.events.findFirst({
          where: eq(events.id, input.id),
          with: {
            venue: true,
            region: true
          }
        });
        
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        
        return event;
      } catch (error) {
        console.error("Failed to fetch event:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch event' });
      }
    }),
    
  // Get all event IDs for navigation
  getAllIds: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const allEvents = await ctx.db
          .select({ id: events.id })
          .from(events)
          .orderBy(desc(events.updatedAt));
        
        return allEvents.map(event => event.id);
      } catch (error) {
        console.error("Failed to fetch event IDs:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch event IDs' });
      }
    }),

  // TODO: Add create, update, delete procedures later
});