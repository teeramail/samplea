import { z } from "zod";
import { nanoid } from "nanoid"; // Assuming nanoid is used for IDs based on other tables
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure, // Using publicProcedure TEMPORARILY for create/update during dev
  // protectedProcedure, // TODO: Use protected/admin procedure later
  // adminProcedure, // TODO: Define and import adminProcedure in trpc.ts
} from "~/server/api/trpc";
import { instructors } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// Input schema for creating an instructor
const createInstructorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  expertise: z.array(z.string()).optional(),
  userId: z.string().optional().nullable(), // Optional link to an existing user
});

// Input schema for updating an instructor
const updateInstructorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required").optional(),
  bio: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  expertise: z.array(z.string()).optional(),
  userId: z.string().optional().nullable(),
});


export const instructorRouter = createTRPCRouter({
  // WARNING: Using publicProcedure for create/update. Change to adminProcedure later.
  create: publicProcedure 
    .input(createInstructorSchema)
    .mutation(async ({ ctx, input }) => {
      // TODO: Add auth check here when using publicProcedure if needed during dev,
      //       OR switch back to protected/admin procedure.
      const newId = nanoid(); // Generate a new ID
      try {
        await ctx.db.insert(instructors).values({
          id: newId,
          ...input,
          imageUrl: input.imageUrl ?? null,
          bio: input.bio ?? null,
          expertise: input.expertise ?? [],
          userId: input.userId ?? null,
        });
        return { id: newId };
      } catch (error) {
        console.error("Failed to create instructor:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create instructor' });
      }
    }),

  // WARNING: Using publicProcedure for create/update. Change to adminProcedure later.
  update: publicProcedure
    .input(updateInstructorSchema)
    .mutation(async ({ ctx, input }) => {
      // TODO: Add auth check here when using publicProcedure if needed during dev,
      //       OR switch back to protected/admin procedure.
      const { id, ...updateData } = input;
      
      const dataToUpdate: Partial<typeof instructors.$inferInsert> = {};
      if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
      if (updateData.bio !== undefined) dataToUpdate.bio = updateData.bio;
      if (updateData.imageUrl !== undefined) dataToUpdate.imageUrl = updateData.imageUrl;
      if (updateData.expertise !== undefined) dataToUpdate.expertise = updateData.expertise;
      if (updateData.userId !== undefined) dataToUpdate.userId = updateData.userId;
      
      if (Object.keys(dataToUpdate).length === 0) {
          return { success: false, message: "No fields provided for update." };
      }

      try {
        await ctx.db
          .update(instructors)
          .set({ 
            ...dataToUpdate,
            updatedAt: new Date() // Explicitly update updatedAt timestamp
          })
          .where(eq(instructors.id, id));
        return { success: true };
      } catch (error) {
        console.error("Failed to update instructor:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update instructor' });
      }
    }),

  list: publicProcedure
    .query(async ({ ctx }) => {
      try {
          return await ctx.db.select().from(instructors).orderBy(instructors.name);
      } catch (error) {
          console.error("Failed to list instructors:", error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to list instructors' });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
       try {
            const instructor = await ctx.db.query.instructors.findFirst({
                where: eq(instructors.id, input.id),
            });
            if (!instructor) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Instructor not found' });
            }
            return instructor;
        } catch (error) {
            console.error(`Failed to get instructor by ID ${input.id}:`, error);
            if (error instanceof TRPCError) throw error;
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve instructor' });
        }
    }),
    
  // WARNING: Using publicProcedure. Change to adminProcedure later.
  // delete: publicProcedure 
  //   .input(z.object({ id: z.string() }))
  //   .mutation(async ({ ctx, input }) => {
  //     // TODO: Add auth check
  //     try {
  //        await ctx.db.delete(instructors).where(eq(instructors.id, input.id));
  //        return { success: true };
  //     } catch (error) {
  //        console.error("Failed to delete instructor:", error);
  //        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete instructor' });
  //     }
  //   }),
}); 