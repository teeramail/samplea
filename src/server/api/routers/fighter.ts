import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  // adminProcedure, // TODO
} from "~/server/api/trpc";
import { fighters } from "~/server/db/schema";
import { eq, desc, and } from "drizzle-orm";

// Input schemas for fighter operations
const createFighterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  nickname: z.string().optional(),
  weightClass: z.string().optional(),
  record: z.string().optional(),
  country: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
  isFeatured: z.boolean().default(false),
});

const updateFighterSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters long").optional(),
  nickname: z.string().optional(),
  weightClass: z.string().optional(),
  record: z.string().optional(),
  country: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
  isFeatured: z.boolean().optional(),
});

export const fighterRouter = createTRPCRouter({
  // List all fighters
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const allFighters = await ctx.db.query.fighters.findMany({
        orderBy: [desc(fighters.createdAt)],
      });
      return allFighters;
    } catch (error) {
      console.error("Failed to fetch fighters list:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch fighters",
      });
    }
  }),

  // Get fighter by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const fighter = await ctx.db.query.fighters.findFirst({
          where: eq(fighters.id, input.id),
        });

        if (!fighter) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fighter not found",
          });
        }

        return fighter;
      } catch (error) {
        console.error("Failed to fetch fighter:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch fighter",
        });
      }
    }),

  // Create a new fighter
  create: publicProcedure // TODO: Change to adminProcedure
    .input(createFighterSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const id = nanoid();
        const now = new Date();

        const newFighter = await ctx.db
          .insert(fighters)
          .values({
            id,
            name: input.name,
            nickname: input.nickname,
            weightClass: input.weightClass,
            record: input.record,
            country: input.country,
            thumbnailUrl: input.thumbnailUrl,
            imageUrl: input.imageUrl,
            imageUrls: input.imageUrls,
            isFeatured: input.isFeatured,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        return newFighter[0];
      } catch (error) {
        console.error("Failed to create fighter:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create fighter",
        });
      }
    }),

  // Update an existing fighter
  update: publicProcedure // TODO: Change to adminProcedure
    .input(updateFighterSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        const updatedFighter = await ctx.db
          .update(fighters)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(fighters.id, id))
          .returning();

        if (updatedFighter.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fighter not found",
          });
        }

        return updatedFighter[0];
      } catch (error) {
        console.error("Failed to update fighter:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update fighter",
        });
      }
    }),

  // Delete a fighter
  delete: publicProcedure // TODO: Change to adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const deletedFighter = await ctx.db
          .delete(fighters)
          .where(eq(fighters.id, input.id))
          .returning();

        if (deletedFighter.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fighter not found",
          });
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to delete fighter:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete fighter",
        });
      }
    }),

  // Get featured fighters
  getFeatured: publicProcedure
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
        const featuredFighters = await ctx.db.query.fighters.findMany({
          where: eq(fighters.isFeatured, true),
          orderBy: [desc(fighters.createdAt)],
          limit: limit,
        });
        return featuredFighters;
      } catch (error) {
        console.error("Failed to fetch featured fighters:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch featured fighters",
        });
      }
    }),

  // Toggle featured status
  toggleFeatured: publicProcedure // TODO: Change to adminProcedure
    .input(
      z.object({
        id: z.string(),
        isFeatured: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .update(fighters)
          .set({ isFeatured: input.isFeatured, updatedAt: new Date() })
          .where(eq(fighters.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("Failed to toggle fighter featured status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update fighter",
        });
      }
    }),
});
