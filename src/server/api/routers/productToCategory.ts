import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { productToCategories, products, categories } from "~/server/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";

export const productToCategoryRouter = createTRPCRouter({
  // Get categories for a product
  getByProductId: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.productToCategories.findMany({
        where: eq(productToCategories.productId, input.productId),
        with: {
          category: true,
        },
      });

      return result.map((item) => item.category);
    }),

  // Get products for a category
  getByCategoryId: publicProcedure
    .input(z.object({ categoryId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.productToCategories.findMany({
        where: eq(productToCategories.categoryId, input.categoryId),
        with: {
          product: true,
        },
      });

      return result.map((item) => item.product);
    }),

  // Add a product to categories (replacing existing associations)
  setProductCategories: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        categoryIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, categoryIds } = input;

      // Check if product exists
      const productExists = await ctx.db.query.products.findFirst({
        where: eq(products.id, productId),
      });

      if (!productExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Check if all categories exist
      if (categoryIds.length > 0) {
        const categoriesCount = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(categories)
          .where(inArray(categories.id, categoryIds));
        
        if (categoriesCount[0]?.count !== categoryIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more categories do not exist",
          });
        }
      }

      // Delete existing associations
      await ctx.db
        .delete(productToCategories)
        .where(eq(productToCategories.productId, productId));

      // Create new associations
      if (categoryIds.length > 0) {
        const newAssociations = categoryIds.map((categoryId) => ({
          id: createId(),
          productId,
          categoryId,
          createdAt: new Date(),
        }));

        await ctx.db.insert(productToCategories).values(newAssociations);
      }

      return { success: true };
    }),

  // Add a category to a product
  addCategoryToProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        categoryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, categoryId } = input;

      // Check if the association already exists
      const existingAssociation = await ctx.db.query.productToCategories.findFirst({
        where: and(
          eq(productToCategories.productId, productId),
          eq(productToCategories.categoryId, categoryId)
        ),
      });

      if (existingAssociation) {
        return { success: true, alreadyExists: true };
      }

      // Create the association
      await ctx.db.insert(productToCategories).values({
        id: createId(),
        productId,
        categoryId,
        createdAt: new Date(),
      });

      return { success: true, alreadyExists: false };
    }),

  // Remove a category from a product
  removeCategoryFromProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        categoryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, categoryId } = input;

      await ctx.db
        .delete(productToCategories)
        .where(
          and(
            eq(productToCategories.productId, productId),
            eq(productToCategories.categoryId, categoryId)
          )
        );

      return { success: true };
    }),
});
