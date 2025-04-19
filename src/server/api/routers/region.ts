import { z } from "zod";
import { desc, eq, like, sql, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { regions } from "~/server/db/schema";

export const regionRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        sortField: z.string().default("name"),
        sortDirection: z.enum(["asc", "desc"]).default("asc"),
        query: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, sortField, sortDirection, query } = input;
      const offset = (page - 1) * limit;

      try {
        // Get all regions first (we'll handle pagination in memory for simplicity)
        let allRegions = await ctx.db.select().from(regions);
        
        // Apply search filter if query exists
        if (query && query.trim() !== '') {
          allRegions = allRegions.filter(region => 
            region.name.toLowerCase().includes(query.toLowerCase())
          );
        }
        
        // Get total count
        const totalCount = allRegions.length;
        
        // Sort the regions
        allRegions.sort((a, b) => {
          const fieldA = a[sortField as keyof typeof a];
          const fieldB = b[sortField as keyof typeof b];
          
          if (typeof fieldA === 'string' && typeof fieldB === 'string') {
            return sortDirection === 'asc' 
              ? fieldA.localeCompare(fieldB)
              : fieldB.localeCompare(fieldA);
          }
          
          // Default comparison for non-string fields
          return sortDirection === 'asc'
            ? (fieldA as any) - (fieldB as any)
            : (fieldB as any) - (fieldA as any);
        });
        
        // Apply pagination
        const items = allRegions.slice(offset, offset + limit);
        
        return {
          items,
          meta: {
            totalCount,
            page,
            limit,
            pageCount: Math.ceil(totalCount / limit),
          },
        };
      } catch (error) {
        console.error('Error in region.list:', error);
        throw error;
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const results = await ctx.db
          .select()
          .from(regions)
          .where(eq(regions.id, input.id));

        return results[0] ?? null;
      } catch (error) {
        console.error('Error in region.getById:', error);
        throw error;
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required"),
        description: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        keywords: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate a slug if not provided
        const slug = input.slug || input.name.toLowerCase().replace(/\s+/g, '-');
        
        const newRegion = {
          id: createId(),
          name: input.name,
          slug,
          description: input.description,
          imageUrls: input.imageUrls || [],
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,
          keywords: input.keywords || [],
        };
        
        const result = await ctx.db.insert(regions).values(newRegion).returning();
        return result[0];
      } catch (error) {
        console.error('Error in region.create:', error);
        throw error;
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required"),
        description: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
        primaryImageIndex: z.number().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        keywords: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        
        const result = await ctx.db
          .update(regions)
          .set(data)
          .where(eq(regions.id, id))
          .returning();

        return result[0];
      } catch (error) {
        console.error('Error in region.update:', error);
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.delete(regions).where(eq(regions.id, input.id));
        return { success: true };
      } catch (error) {
        console.error('Error in region.delete:', error);
        throw error;
      }
    }),
});
