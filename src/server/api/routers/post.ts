import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { eq, desc, and, like } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { events, posts } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Create a new event with default date and time values for now
      await ctx.db.insert(events).values({
        id: uuidv4(),
        title: input.title,
        description: input.description ?? null,
        date: new Date(),
        startTime: new Date(),
      });
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const event = await ctx.db.query.events.findFirst({
      orderBy: (events, { desc }) => [desc(events.createdAt)],
    });

    return event ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getFeatured: publicProcedure
    .input(z.object({
        limit: z.number().min(1).max(10).default(2), // Limit to 2 for homepage
    }).optional())
    .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 2;
        try {
            const featuredPosts = await ctx.db.query.posts.findMany({
                where: and(
                    eq(posts.isFeatured, true),
                    eq(posts.status, 'PUBLISHED') // Ensure post is published
                ),
                orderBy: [desc(posts.publishedAt), desc(posts.createdAt)], // Order by publish date first
                limit: limit,
                 // Add 'with' if needed (e.g., author)
            });
            return featuredPosts;
        } catch (error) {
            console.error("Failed to fetch featured posts:", error);
            // Ensure isFeatured exists in your schema.ts for posts
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch featured posts' });
        }
    }),

  toggleFeatured: publicProcedure // TODO: Change to adminProcedure
    .input(z.object({
      id: z.string(),
      isFeatured: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .update(posts)
          .set({ isFeatured: input.isFeatured, updatedAt: new Date() })
          .where(eq(posts.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("Failed to toggle post featured status:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update post' });
      }
    }),

  // TODO: Add delete procedure
});
