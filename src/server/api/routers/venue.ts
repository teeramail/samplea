import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  // adminProcedure, // TODO
} from "~/server/api/trpc";
import { venues, regions } from "~/server/db/schema";
import { eq, desc, and } from "drizzle-orm";

// TODO: Add input schemas for create/update if not already present

export const venueRouter = createTRPCRouter({
  // ... existing procedures like list, getById ...

  // Add this new procedure
  getFeatured: publicProcedure
    .input(z.object({
        limit: z.number().min(1).max(10).default(4),
        regionId: z.string().optional()
    }).optional())
    .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 4;
        const whereConditions = [eq(venues.isFeatured, true)];

        if (input?.regionId) {
            whereConditions.push(eq(venues.regionId, input.regionId));
        }

        try {
            const featuredVenues = await ctx.db.query.venues.findMany({
                where: and(...whereConditions),
                limit: limit,
                orderBy: [desc(venues.createdAt)], // Or other order like name
                with: {
                    region: { columns: { name: true, slug: true } }
                }
            });
            return featuredVenues;
        } catch (error) {
            console.error("Failed to fetch featured venues:", error);
            // Ensure isFeatured exists in your schema.ts for venues
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch featured venues' });
        }
    }),

  // TODO: Add create, update, delete procedures (marked for admin)
  // TODO: Add toggleFeatured procedure (marked for admin)
}); 