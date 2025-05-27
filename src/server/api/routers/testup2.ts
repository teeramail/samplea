import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { testup2Uploads } from "~/server/db/schema"; // We created this table earlier
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
        const [newUpload] = await ctx.db
          .insert(testup2Uploads)
          .values({
            imageUrl: input.imageUrl,
            originalFilename: input.originalFilename,
            // createdAt and updatedAt will be handled by default values in the schema
          })
          .returning();

        if (!newUpload) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save upload details to database.",
          });
        }
        return newUpload;
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
  //     const limit = input.limit ?? 10;
  //     const items = await ctx.db.query.testup2Uploads.findMany({
  //       orderBy: (fields, { desc }) => [desc(fields.createdAt)],
  //       limit: limit + 1, // get an extra item to see if there's a next page
  //       where: input.cursor ? (fields, { lt }) => lt(fields.id, input.cursor) : undefined,
  //     });
  //     let nextCursor: typeof input.cursor | undefined = undefined;
  //     if (items.length > limit) {
  //       const nextItem = items.pop(); // remove and get the extra item
  //       nextCursor = nextItem!.id;
  //     }
  //     return {
  //       items,
  //       nextCursor,
  //     };
  //   }),
});
