import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { testup2Upload } from "~/server/db/schema/realestate"; // Using the test upload table from realestate schema
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const testup2Router = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        imageUrl: z.string().url({ message: "Invalid image URL" }),
        originalFilename: z.string().min(1, { message: "Original filename cannot be empty" }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Insert the new upload record
        await ctx.db.insert(testup2Upload).values({
          id: crypto.randomUUID(),
          image_url: input.imageUrl,
          original_filename: input.originalFilename,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        // Return a formatted response
        return {
          id: crypto.randomUUID(), // This is just a placeholder - we don't need the actual ID
          imageUrl: input.imageUrl,
          originalFilename: input.originalFilename,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } catch (error) {
        console.error("Error creating testup2 upload record:", error);
        // Check if it's a known Drizzle error or a generic one
        if (error instanceof Error && 'message' in error && error.message.includes("unique constraint")) {
             throw new TRPCError({
                code: "CONFLICT",
                message: "An upload with similar details might already exist.",
             });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while saving upload details.",
        });
      }
    }),

  // Optional: Add a procedure to list uploads if needed later
  // list: publicProcedure
  //   .input(z.object({ limit: z.number().min(1).max(100).nullish(), cursor: z.string().nullish() }))
  //   .query(async ({ ctx, input }) => {
  //     const limit = input.limit ?? 50;
  //     const items = await ctx.db.query.testup2Upload.findMany({
  //       limit: limit + 1,
  //       orderBy: (table, { desc }) => [desc(table.created_at)],
  //     });
  //     
  //     let nextCursor: string | undefined = undefined;
  //     if (items.length > limit) {
  //       const nextItem = items.pop();
  //       nextCursor = nextItem?.id;
  //     }
  //     
  //     return {
  //       items,
  //       nextCursor,
  //     };
  //   }),
});
