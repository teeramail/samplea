import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { categories } from "~/server/db/schema";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const categoryRouter = createTRPCRouter({
  // Get a list of categories with pagination
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(10),
        sortField: z.string().default("name"),
        sortDirection: z.enum(["asc", "desc"]).default("asc"),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, sortField, sortDirection, search } = input;
      const offset = (page - 1) * limit;

      // Build query conditions
      let query = ctx.db.select().from(categories);
      
      // Add search condition if provided
      if (search) {
        query = query.where(like(categories.name, `%${search}%`));
      }

      // Add sorting
      if (sortDirection === "asc") {
        if (sortField === "name") {
          query = query.orderBy(categories.name);
        } else if (sortField === "createdAt") {
          query = query.orderBy(categories.createdAt);
        }
      } else {
        if (sortField === "name") {
          query = query.orderBy(desc(categories.name));
        } else if (sortField === "createdAt") {
          query = query.orderBy(desc(categories.createdAt));
        }
      }

      // Execute count query
      let countQuery = ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(categories);
      
      if (search) {
        countQuery = countQuery.where(like(categories.name, `%${search}%`));
      }
      
      const countResult = await countQuery;
      const count = countResult[0]?.count ?? 0;

      // Execute main query with pagination
      const items = await query.limit(limit).offset(offset);

      return {
        items,
        meta: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
      };
    }),

  // Get a single category by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(categories)
        .where(eq(categories.id, input.id))
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      return result[0];
    }),

  // Create a new category (admin only)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required"),
        description: z.string().optional(),
        thumbnailUrl: z.string().url().optional(),
        imageUrls: z.array(z.string().url()).max(8).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug is unique
      const existingWithSlug = await ctx.db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, input.slug))
        .limit(1);

      if (existingWithSlug.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A category with this slug already exists",
        });
      }

      const newCategory = {
        id: createId(),
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        thumbnailUrl: input.thumbnailUrl || null,
        imageUrls: input.imageUrls || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await ctx.db.insert(categories).values(newCategory);

      return newCategory;
    }),

  // Update an existing category (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required"),
        description: z.string().optional(),
        thumbnailUrl: z.string().url().optional(),
        imageUrls: z.array(z.string().url()).max(8).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if category exists
      const existingCategory = await ctx.db
        .select()
        .from(categories)
        .where(eq(categories.id, input.id))
        .limit(1);

      if (existingCategory.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Check if slug is unique (excluding this category)
      const existingWithSlug = await ctx.db
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.slug, input.slug),
            sql`${categories.id} != ${input.id}`,
          ),
        )
        .limit(1);

      if (existingWithSlug.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A category with this slug already exists",
        });
      }

      // Update the category
      await ctx.db
        .update(categories)
        .set({
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          thumbnailUrl: input.thumbnailUrl || null,
          imageUrls: input.imageUrls || [],
          updatedAt: new Date(),
        })
        .where(eq(categories.id, input.id));

      return {
        id: input.id,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
      };
    }),

  // Delete a category (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if category exists
      const existingCategory = await ctx.db
        .select()
        .from(categories)
        .where(eq(categories.id, input.id))
        .limit(1);

      if (existingCategory.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Delete the category
      await ctx.db.delete(categories).where(eq(categories.id, input.id));

      return { success: true };
    }),
});
