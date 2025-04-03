import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  // adminProcedure, // TODO
} from "~/server/api/trpc";
import { venues, regions } from "~/server/db/schema";
import { eq, desc, and, like } from "drizzle-orm";

// TODO: Add input schemas for create/update if not already present

export const venueRouter = createTRPCRouter({
  // Add list procedure to fetch all venues
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().nullish(),
      query: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const query = input?.query;
      
      try {
        let whereClause = undefined;
        
        if (query) {
          whereClause = like(venues.name, `%${query}%`);
        }
        
        const venuesList = await ctx.db.query.venues.findMany({
          where: whereClause,
          orderBy: [desc(venues.name)],
          limit: limit,
          with: {
            region: true,
          },
        });
        
        return venuesList;
      } catch (error) {
        console.error("Failed to fetch venues:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch venues' });
      }
    }),

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

  // Add toggleFeatured mutation
  toggleFeatured: publicProcedure // TODO: Change to adminProcedure
    .input(z.object({
      id: z.string(),
      isFeatured: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .update(venues)
          .set({ isFeatured: input.isFeatured, updatedAt: new Date() })
          .where(eq(venues.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("Failed to toggle venue featured status:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update venue' });
      }
    }),

  // TODO: Add create, update, delete procedures (marked for admin)
  // TODO: Add toggleFeatured procedure (marked for admin)
}); 