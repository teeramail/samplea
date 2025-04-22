import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { products } from "~/server/db/schema";
import { eq, desc, asc, like, and, or, count } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const productRouter = createTRPCRouter({
  getFeatured: publicProcedure.query(() =>
    db.query.products.findMany({
      where: eq(products.isFeatured, true),
      orderBy: [desc(products.updatedAt)],
      limit: 4,
    })
  ),

  listAll: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        perPage: z.number().int().positive().default(10),
        orderBy: z.enum(['updatedAt', 'name', 'price']).default('updatedAt'),
        orderDir: z.enum(['asc', 'desc']).default('desc'),
        search: z.string().optional(),
        featured: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input = {} }) => {
      const {
        page = 1,
        perPage = 10,
        orderBy = 'updatedAt',
        orderDir = 'desc',
        search,
        featured,
      } = input;

      // Build where conditions
      const whereConditions = [];
      
      if (featured !== undefined) {
        whereConditions.push(eq(products.isFeatured, featured));
      }
      
      if (search) {
        whereConditions.push(
          or(
            like(products.name, `%${search}%`),
            like(products.description || '', `%${search}%`)
          )
        );
      }
      
      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined;
      
      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: count() })
        .from(products)
        .where(whereClause)
        .execute();
      
      const totalCount = totalCountResult[0]?.count || 0;
      const totalPages = Math.ceil(totalCount / perPage);
      
      // Build order by clause
      const orderByClause = orderDir === 'asc'
        ? orderBy === 'name' ? asc(products.name) : orderBy === 'price' ? asc(products.price) : asc(products.updatedAt)
        : orderBy === 'name' ? desc(products.name) : orderBy === 'price' ? desc(products.price) : desc(products.updatedAt);
      
      // Get paginated results
      const items = await db.query.products.findMany({
        where: whereClause,
        orderBy: [orderByClause],
        limit: perPage,
        offset: (page - 1) * perPage,
      });
      
      return {
        items,
        pagination: {
          page,
          perPage,
          totalCount,
          totalPages,
        },
      };
    }),

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
    
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().min(0),
        thumbnailUrl: z.string().url().optional(),
        imageUrls: z.array(z.string().url()).max(8).optional(),
        isFeatured: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(products)
        .set({
          name: input.name,
          description: input.description || null,
          price: input.price,
          thumbnailUrl: input.thumbnailUrl || null,
          imageUrls: input.imageUrls || [],
          isFeatured: input.isFeatured ?? false,
          updatedAt: new Date(),
        })
        .where(eq(products.id, input.id));
      return { success: true };
    }),
    
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .delete(products)
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
