import { z } from "zod";
import { nanoid } from "nanoid"; // Assuming nanoid is used for IDs based on other tables

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure, // Assuming you have an admin procedure defined
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
  create: adminProcedure // Use adminProcedure for protected actions
    .input(createInstructorSchema)
    .mutation(async ({ ctx, input }) => {
      const newId = nanoid(); // Generate a new ID
      await ctx.db.insert(instructors).values({
        id: newId,
        ...input,
        // Ensure optional fields are handled correctly, potentially setting null if undefined
        imageUrl: input.imageUrl ?? null,
        bio: input.bio ?? null,
        expertise: input.expertise ?? [],
        userId: input.userId ?? null,
      });
      return { id: newId };
    }),

  update: adminProcedure
    .input(updateInstructorSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      // Construct the update object, only including fields that were provided
      const dataToUpdate: Partial<typeof instructors.$inferInsert> = {};
      if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
      if (updateData.bio !== undefined) dataToUpdate.bio = updateData.bio;
      if (updateData.imageUrl !== undefined) dataToUpdate.imageUrl = updateData.imageUrl;
      if (updateData.expertise !== undefined) dataToUpdate.expertise = updateData.expertise;
      if (updateData.userId !== undefined) dataToUpdate.userId = updateData.userId;
      
      // Only proceed if there's something to update
      if (Object.keys(dataToUpdate).length === 0) {
          // Consider throwing an error or returning a specific message
          return { success: false, message: "No fields provided for update." };
      }

      await ctx.db
        .update(instructors)
        .set({ 
          ...dataToUpdate,
           updatedAt: new Date() // Explicitly update updatedAt timestamp
         })
        .where(eq(instructors.id, id));
        
      return { success: true };
    }),

  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.select().from(instructors).orderBy(instructors.name); // Example ordering
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const instructor = await ctx.db.query.instructors.findFirst({
        where: eq(instructors.id, input.id),
        // Optionally include related data if needed later
        // with: {
        //   user: true, // If you want to include linked user data
        //   trainingCourses: true, // If you want to include linked courses
        // }
      });
      return instructor;
    }),
    
  // Potential delete procedure (use adminProcedure)
  // delete: adminProcedure
  //   .input(z.object({ id: z.string() }))
  //   .mutation(async ({ ctx, input }) => {
  //     await ctx.db.delete(instructors).where(eq(instructors.id, input.id));
  //     return { success: true };
  //   }),
}); 