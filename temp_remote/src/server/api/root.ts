import { postRouter } from "~/server/api/routers/post";
import { instructorRouter } from "~/server/api/routers/instructor";
import { trainingCourseRouter } from "~/server/api/routers/trainingCourse";
import { courseEnrollmentRouter } from "~/server/api/routers/courseEnrollment";

// Import routers that exist
import { eventRouter } from "~/server/api/routers/event";
import { fighterRouter } from "~/server/api/routers/fighter";
import { venueRouter } from "~/server/api/routers/venue";
// Still keeping regionRouter commented out until its file is created
// import { regionRouter } from "~/server/api/routers/region";

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
  fighter: fighterRouter,
  venue: venueRouter,
  // region: regionRouter, // Router doesn't exist yet
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
