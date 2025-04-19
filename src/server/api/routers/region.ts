import { z } from "zod";
import { desc, eq, like, sql, and } from "drizzle-orm";

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

      // Build query filter
      let whereClause;
      if (query) {
        whereClause = like(regions.name, `%${query}%`);
      }

      // Get total count for pagination
      const totalCountResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(regions)
        .where(whereClause || undefined)
        .then((result) => result[0]);
        
      const totalCount = totalCountResult?.count ?? 0;

      // Get the regions with pagination and sorting
      const items = await ctx.db
        .select()
        .from(regions)
        .where(whereClause || undefined)
        .orderBy(
          sortDirection === "desc"
            ? desc(regions[sortField as keyof typeof regions])
            : regions[sortField as keyof typeof regions],
        )
        .limit(limit)
        .offset(offset);

      return {
        items,
        meta: {
          totalCount,
          page,
          limit,
          pageCount: Math.ceil(totalCount / limit),
        },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const region = await ctx.db
        .select()
        .from(regions)
        .where(eq(regions.id, input.id))
        .then((results) => results[0] ?? null);

      return region;
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
      const result = await ctx.db.insert(regions).values({
        name: input.name,
        slug: input.slug,
        description: input.description,
        imageUrls: input.imageUrls,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        keywords: input.keywords,
      }).returning();

      return result[0];
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
      const { id, ...data } = input;
      
      const result = await ctx.db
        .update(regions)
        .set(data)
        .where(eq(regions.id, id))
        .returning();

      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(regions).where(eq(regions.id, input.id));
      return { success: true };
    }),
});
