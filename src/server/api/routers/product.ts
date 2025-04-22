import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { products } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const productRouter = createTRPCRouter({
  getFeatured: publicProcedure.query(() =>
    db.query.products.findMany({
      where: eq(products.isFeatured, true),
      orderBy: [desc(products.updatedAt)],
      limit: 4,
    })
  ),

  listAll: publicProcedure.query(() =>
    db.query.products.findMany({
      orderBy: [desc(products.updatedAt)],
    })
  ),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) =>
      db.query.products.findFirst({ where: eq(products.id, input.id) })
    ),
  toggleFeatured: publicProcedure
    .input(z.object({ id: z.string(), isFeatured: z.boolean() }))
    .mutation(async ({ input }) => {
      await db
        .update(products)
        .set({ isFeatured: input.isFeatured })
        .where(eq(products.id, input.id));
      return { success: true };
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().min(0),
        thumbnailUrl: z.string().url().optional(),
        imageUrls: z.array(z.string().url()).max(8).optional(),
        isFeatured: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const id = createId();
      await db.insert(products).values({
        id,
        name: input.name,
        description: input.description || null,
        price: input.price,
        thumbnailUrl: input.thumbnailUrl || null,
        imageUrls: input.imageUrls || [],
        isFeatured: input.isFeatured,
      });
      return { id };
    }),
});
