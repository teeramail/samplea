import { z } from "zod";
import { nanoid } from "nanoid";
import slugify from "slugify"; // Need to install slugify: npm install slugify @types/slugify
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  // protectedProcedure, // TODO: Use protected/admin procedure later
  // adminProcedure, // TODO: Define and import adminProcedure in trpc.ts
} from "~/server/api/trpc";
import { trainingCourses } from "~/server/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import type { db } from "~/server/db";

// Helper function to generate unique slugs
async function generateUniqueSlug(dbInstance: typeof db, title: string, idToExclude?: string): Promise<string> {
  const slug = slugify(title, { lower: true, strict: true });
  let counter = 1;
  let uniqueSlug = slug;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const conditions = [
      eq(trainingCourses.slug, uniqueSlug)
    ];
    // When updating, exclude the current item ID from the uniqueness check
    if (idToExclude) {
        conditions.push(ne(trainingCourses.id, idToExclude));
    }

    const existing = await dbInstance.query.trainingCourses.findFirst({
      where: and(...conditions),
      columns: { id: true },
    });

    if (!existing) {
      break; // Found a unique slug
    }

    // If slug exists, append counter and try again
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}

// Input schema for creating a training course
const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  skillLevel: z.string().optional(),
  duration: z.string().optional(),
  scheduleDetails: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  capacity: z.number().int().positive("Capacity must be a positive integer").optional(),
  venueId: z.string().optional().nullable(),
  regionId: z.string(), // Region is required
  instructorId: z.string().optional().nullable(),
  imageUrls: z.array(z.string().url()).optional(),
  primaryImageIndex: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

// Input schema for updating a training course
const updateCourseSchema = z.object({
  id: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  skillLevel: z.string().optional(),
  duration: z.string().optional(),
  scheduleDetails: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
  capacity: z.number().int().positive("Capacity must be a positive integer").optional().nullable(),
  venueId: z.string().optional().nullable(),
  regionId: z.string().optional(),
  instructorId: z.string().optional().nullable(),
  imageUrls: z.array(z.string().url()).optional(),
  primaryImageIndex: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const trainingCourseRouter = createTRPCRouter({
  // WARNING: Using publicProcedure. Change to adminProcedure later.
  create: publicProcedure
    .input(createCourseSchema)
    .mutation(async ({ ctx, input }) => {
       // TODO: Add auth check
      const newId = nanoid();
      const slug = await generateUniqueSlug(ctx.db, input.title);
      
      try {
          await ctx.db.insert(trainingCourses).values({
            id: newId,
            slug: slug,
            ...input,
            venueId: input.venueId === "" ? null : input.venueId,
            instructorId: input.instructorId === "" ? null : input.instructorId,
            capacity: input.capacity ?? null,
            primaryImageIndex: input.primaryImageIndex ?? 0,
            imageUrls: input.imageUrls ?? [],
          });
          return { id: newId, slug };
      } catch (error) {
          console.error("Failed to create training course:", error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create course' });
      }
    }),

  // WARNING: Using publicProcedure. Change to adminProcedure later.
  update: publicProcedure
    .input(updateCourseSchema)
    .mutation(async ({ ctx, input }) => {
      // TODO: Add auth check
      const { id, ...updateData } = input;

      const dataToUpdate: Partial<typeof trainingCourses.$inferInsert> = {};
      let newSlug: string | undefined = undefined;

      if (updateData.title !== undefined) {
        dataToUpdate.title = updateData.title;
        newSlug = await generateUniqueSlug(ctx.db, updateData.title, id);
        dataToUpdate.slug = newSlug;
      }

      if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
      if (updateData.skillLevel !== undefined) dataToUpdate.skillLevel = updateData.skillLevel;
      if (updateData.duration !== undefined) dataToUpdate.duration = updateData.duration;
      if (updateData.scheduleDetails !== undefined) dataToUpdate.scheduleDetails = updateData.scheduleDetails;
      if (updateData.price !== undefined) dataToUpdate.price = updateData.price;
      if (updateData.capacity !== undefined) dataToUpdate.capacity = updateData.capacity;
      if (updateData.venueId !== undefined) dataToUpdate.venueId = updateData.venueId;
      if (updateData.regionId !== undefined) dataToUpdate.regionId = updateData.regionId;
      if (updateData.instructorId !== undefined) dataToUpdate.instructorId = updateData.instructorId;
      if (updateData.imageUrls !== undefined) dataToUpdate.imageUrls = updateData.imageUrls;
      if (updateData.primaryImageIndex !== undefined) dataToUpdate.primaryImageIndex = updateData.primaryImageIndex;
      if (updateData.isActive !== undefined) dataToUpdate.isActive = updateData.isActive;

      if (Object.keys(dataToUpdate).length === 0) {
        return { success: false, message: "No fields provided for update." };
      }

      try {
          await ctx.db
            .update(trainingCourses)
            .set({
                ...dataToUpdate,
                updatedAt: new Date()
            })
            .where(eq(trainingCourses.id, id));
          return { success: true, slug: newSlug };
      } catch (error) {
          console.error("Failed to update training course:", error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update course' });
      }
    }),

  list: publicProcedure
    .input(z.object({ 
        regionId: z.string().optional(),
        instructorId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
    }).optional())
    .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 20;
        
        const whereConditions = [
            eq(trainingCourses.isActive, true)
        ];
        if (input?.regionId) {
            whereConditions.push(eq(trainingCourses.regionId, input.regionId));
        }
        if (input?.instructorId) {
            whereConditions.push(eq(trainingCourses.instructorId, input.instructorId));
        }

        try {
            const items = await ctx.db.query.trainingCourses.findMany({
                where: and(...whereConditions),
                orderBy: [desc(trainingCourses.createdAt)], 
                limit: limit + 1, 
                with: {
                    region: { columns: { name: true, slug: true } },
                    instructor: { columns: { name: true, imageUrl: true } },
                    venue: { columns: { name: true } }
                },
            });

            let nextCursor: string | undefined = undefined;
            if (items.length > limit) {
                items.pop(); // Remove the extra item used for cursor check
                nextCursor = items[items.length - 1]?.id;
            }

            return {
                items,
                nextCursor,
            };
        } catch (error) {
            console.error("Failed to list training courses:", error);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to list courses' });
        }
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
            const course = await ctx.db.query.trainingCourses.findFirst({
                where: eq(trainingCourses.slug, input.slug),
                with: {
                region: true,
                instructor: true,
                venue: true,
                },
            });
             if (!course) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
            }
            return course;
      } catch (error) {
          console.error(`Failed to get course by slug ${input.slug}:`, error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve course' });
      }
    }),
    
  // WARNING: Using publicProcedure. Change to adminProcedure later.
  // delete: publicProcedure
  //  .input(z.object({ id: z.string() }))
  //  .mutation(async ({ ctx, input }) => { 
  //     // TODO: Add auth check
  //     try {
  //          await ctx.db.delete(trainingCourses).where(eq(trainingCourses.id, input.id));
  //          return { success: true };
  //      } catch (error) {
  //          console.error("Failed to delete training course:", error);
  //          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete course' });
  //      }
  //   }),

  getFeatured: publicProcedure
    .input(z.object({
        limit: z.number().min(1).max(10).default(3),
    }).optional())
    .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 3;
        try {
            const featuredCourses = await ctx.db.query.trainingCourses.findMany({
                where: and(
                    eq(trainingCourses.isFeatured, true),
                    eq(trainingCourses.isActive, true) // Also ensure course is active
                ),
                orderBy: [desc(trainingCourses.createdAt)], // Or some other order
                limit: limit,
                with: {
                    region: { columns: { name: true, slug: true } },
                    instructor: { columns: { name: true, imageUrl: true } },
                    venue: { columns: { name: true } }
                },
            });
            return featuredCourses;
        } catch (error) {
            console.error("Failed to fetch featured training courses:", error);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch featured courses' });
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
          .update(trainingCourses)
          .set({ isFeatured: input.isFeatured, updatedAt: new Date() })
          .where(eq(trainingCourses.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("Failed to toggle course featured status:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update course' });
      }
    }),
}); 