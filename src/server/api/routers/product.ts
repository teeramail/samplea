import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { products } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";

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
});
