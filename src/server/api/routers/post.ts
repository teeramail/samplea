import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { eq, desc, and, like } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { posts } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";

// Define a status enum for blog posts
const PostStatus = z.enum(["DRAFT", "PUBLISHED"]);
type PostStatus = z.infer<typeof PostStatus>;

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: publicProcedure // TODO: Restore to protectedProcedure or adminProcedure when auth is implemented
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string(),
        excerpt: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        isFeatured: z.boolean().default(false),
        status: PostStatus.default("DRAFT"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Create a new post
        const newPostId = createId();
        await ctx.db.insert(posts).values({
          id: newPostId,
          title: input.title,
          slug: input.slug,
          content: input.content,
          excerpt: input.excerpt ?? null,
          isFeatured: input.isFeatured,
          status: input.status,
          publishedAt: input.status === "PUBLISHED" ? new Date() : null,
          // Map SEO fields to the correct DB fields
          metaTitle: input.seoTitle ?? null,
          metaDescription: input.seoDescription ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return { success: true, id: newPostId };
      } catch (error) {
        console.error("Failed to create post:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post",
        });
      }
    }),

  list: publicProcedure // TODO: For admin view, change to adminProcedure
    .input(
      z
        .object({
          status: z.enum(["DRAFT", "PUBLISHED", "ALL"]).default("PUBLISHED"),
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().nullish(),
          query: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const status = input?.status ?? "PUBLISHED";
      const query = input?.query;

      try {
        // Build the where clause
        let whereClause = undefined;

        if (status !== "ALL") {
          whereClause = eq(posts.status, status);
        }

        if (query) {
          whereClause = and(
            whereClause ?? undefined,
            like(posts.title, `%${query}%`),
          );
        }

        // Get the posts
        const items = await ctx.db.query.posts.findMany({
          where: whereClause,
          orderBy: [desc(posts.updatedAt)],
          limit: limit,
        });

        return items;
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch posts",
        });
      }
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const post = await ctx.db.query.posts.findFirst({
          where: and(
            eq(posts.slug, input.slug),
            eq(posts.status, "PUBLISHED"),
          ),
          with: {
            region: true,
            author: true,
          },
        });

        if (!post) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }

        return post;
      } catch (error) {
        console.error(`Failed to fetch post with slug ${input.slug}:`, error);
        // Forward the TRPC error if it's already one
        if (error instanceof TRPCError) {
          throw error;
        }
        // Throw a generic error otherwise
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch post",
        });
      }
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.query.posts.findFirst({
      where: eq(posts.status, "PUBLISHED"),
      orderBy: [desc(posts.publishedAt), desc(posts.createdAt)],
    });

    return post ?? null;
  }),

  getSecretMessage: publicProcedure.query(() => {
    // TODO: Restore to protectedProcedure when auth is implemented
    return "you can now see this secret message!";
  }),

  getFeatured: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(10).default(2), // Limit to 2 for homepage
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 2;
      try {
        const featuredPosts = await ctx.db.query.posts.findMany({
          where: and(
            eq(posts.isFeatured, true),
            eq(posts.status, "PUBLISHED"), // Ensure post is published
          ),
          orderBy: [desc(posts.publishedAt), desc(posts.createdAt)], // Order by publish date first
          limit: limit,
          // Add 'with' if needed (e.g., author)
        });
        return featuredPosts;
      } catch (error) {
        console.error("Failed to fetch featured posts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch featured posts",
        });
      }
    }),

  toggleFeatured: publicProcedure // TODO: Change to adminProcedure when auth is implemented
    .input(
      z.object({
        id: z.string(),
        isFeatured: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .update(posts)
          .set({ isFeatured: input.isFeatured, updatedAt: new Date() })
          .where(eq(posts.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("Failed to toggle post featured status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update post",
        });
      }
    }),

  updateSlug: publicProcedure // TODO: Change to adminProcedure
    .input(
      z.object({
        id: z.string(),
        newSlug: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .update(posts)
          .set({ slug: input.newSlug, updatedAt: new Date() })
          .where(eq(posts.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("Failed to update slug:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update slug",
        });
      }
    }),

  // TODO: Add delete procedure
});
