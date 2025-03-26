import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { events } from "~/server/db/schema";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Create a new event with default date and time values for now
      await ctx.db.insert(events).values({
        id: uuidv4(),
        title: input.title,
        description: input.description ?? null,
        date: new Date(),
        startTime: new Date(),
      });
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const event = await ctx.db.query.events.findFirst({
      orderBy: (events, { desc }) => [desc(events.createdAt)],
    });

    return event ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
