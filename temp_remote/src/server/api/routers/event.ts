import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { events, venues, regions } from "~/server/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";

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

    // TODO: Add getFeatured, getBySlug, list, create, update, delete procedures later
}); 