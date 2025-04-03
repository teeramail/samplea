import { z } from "zod";
import { nanoid } from "nanoid";
import slugify from "slugify"; // Need to install slugify: npm install slugify @types/slugify

import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { trainingCourses, instructors, regions, venues } from "~/server/db/schema";
import { eq, desc, asc, and, isNull } from "drizzle-orm";

// Helper function to generate unique slugs
async function generateUniqueSlug(db: any, title: string, idToExclude?: string): Promise<string> {
  let slug = slugify(title, { lower: true, strict: true });
  let counter = 1;
  let uniqueSlug = slug;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existingConditions = [
      eq(trainingCourses.slug, uniqueSlug)
    ];
    if (idToExclude) {
        existingConditions.push(eq(trainingCourses.id, idToExclude));
    }
    
    const existing = await db.query.trainingCourses.findFirst({
      where: and(...existingConditions),
      columns: { id: true },
    });

    if (!existing) {
      break;
    }

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
  create: adminProcedure
    .input(createCourseSchema)
    .mutation(async ({ ctx, input }) => {
      const newId = nanoid();
      const slug = await generateUniqueSlug(ctx.db, input.title);

      await ctx.db.insert(trainingCourses).values({
        id: newId,
        slug: slug,
        ...input,
        // Handle optional nullable fields
        venueId: input.venueId ?? null,
        instructorId: input.instructorId ?? null,
        capacity: input.capacity ?? null,
        primaryImageIndex: input.primaryImageIndex ?? 0,
        imageUrls: input.imageUrls ?? [],
      });
      return { id: newId, slug };
    }),

  update: adminProcedure
    .input(updateCourseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const dataToUpdate: Partial<typeof trainingCourses.$inferInsert> = {};

      // Regenerate slug if title changes
      if (updateData.title !== undefined) {
        dataToUpdate.title = updateData.title;
        dataToUpdate.slug = await generateUniqueSlug(ctx.db, updateData.title, id);
      }
      
      // Map other potential fields
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

      await ctx.db
        .update(trainingCourses)
        .set({
            ...dataToUpdate,
            updatedAt: new Date()
        })
        .where(eq(trainingCourses.id, id));

      return { success: true, slug: dataToUpdate.slug }; // Return new slug if changed
    }),

  list: publicProcedure
    .input(z.object({ // Add input for potential filtering/pagination later
        regionId: z.string().optional(),
        instructorId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(), // for cursor-based pagination
    }).optional())
    .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 20;
        const cursor = input?.cursor;
        
        const items = await ctx.db.query.trainingCourses.findMany({
            where: and(
                eq(trainingCourses.isActive, true), // Only list active courses
                input?.regionId ? eq(trainingCourses.regionId, input.regionId) : undefined,
                input?.instructorId ? eq(trainingCourses.instructorId, input.instructorId) : undefined,
                // Add cursor condition if needed
            ),
            orderBy: [desc(trainingCourses.createdAt)], // Example order
            limit: limit + 1, // Get one extra to check for next page
            with: {
                region: { columns: { name: true, slug: true } },
                instructor: { columns: { name: true, imageUrl: true } },
                venue: { columns: { name: true } }
            },
            // Add cursor logic here if implementing cursor pagination
            // Example: cursor ? gt(trainingCourses.id, cursor) : undefined 
        });

        let nextCursor: typeof cursor | undefined = undefined;
        if (items.length > limit) {
            const nextItem = items.pop(); // Remove the extra item
            nextCursor = nextItem!.id; // Use its ID as the next cursor
        }

        return {
            items,
            nextCursor,
        };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.trainingCourses.findFirst({
        where: eq(trainingCourses.slug, input.slug),
        with: {
          region: true,
          instructor: true,
          venue: true,
        },
      });
    }),
    
  // Potential delete procedure
  // delete: adminProcedure
  //  .input ...
}); 