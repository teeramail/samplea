import { postRouter } from "~/server/api/routers/post";
import { instructorRouter } from "~/server/api/routers/instructor";
import { trainingCourseRouter } from "~/server/api/routers/trainingCourse";
import { courseEnrollmentRouter } from "~/server/api/routers/courseEnrollment";

// Import routers that exist
import { eventRouter } from "~/server/api/routers/event";
import { eventTemplateRouter } from "~/server/api/routers/eventTemplate";
import { fighterRouter } from "~/server/api/routers/fighter";
import { venueRouter } from "~/server/api/routers/venue";
import { regionRouter } from "~/server/api/routers/region";
import { productRouter } from "~/server/api/routers/product";
import { categoryRouter } from "~/server/api/routers/category";
import { productToCategoryRouter } from "~/server/api/routers/productToCategory";
import { reportsRouter } from "~/server/api/routers/reports";
import { ticketRouter } from "~/server/api/routers/ticket";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  instructor: instructorRouter,
  trainingCourse: trainingCourseRouter,
  courseEnrollment: courseEnrollmentRouter,
  // Add routers that exist
  event: eventRouter,
  eventTemplate: eventTemplateRouter,
  fighter: fighterRouter,
  venue: venueRouter,
  region: regionRouter,
  product: productRouter,
  category: categoryRouter,
  productToCategory: productToCategoryRouter,
  reports: reportsRouter,
  ticket: ticketRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
