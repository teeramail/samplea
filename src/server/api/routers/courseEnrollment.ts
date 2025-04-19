import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure, // Using publicProcedure TEMPORARILY
} from "~/server/api/trpc";
import {
  courseEnrollments,
  trainingCourses,
  customers,
} from "~/server/db/schema";
import { eq, and, desc, sql, ne } from "drizzle-orm";

// Input schema for creating an enrollment
const createEnrollmentSchema = z.object({
  courseId: z.string(),
  // Temporary fields for guest/dev enrollment without login
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
});

export const courseEnrollmentRouter = createTRPCRouter({
  // WARNING: Using publicProcedure for development. Add proper auth and user handling later.
  create: publicProcedure
    .input(createEnrollmentSchema)
    .mutation(async ({ ctx, input }) => {
      // --- TEMPORARY USER/CUSTOMER HANDLING ---
      // Remove this section when authentication is added
      let customerId: string;
      let customerName: string;
      let customerEmail: string;

      // In development without auth, use guest details if provided, otherwise use placeholders
      if (input.guestEmail && input.guestName) {
        // Try to find existing customer by email (useful for testing guest checkout)
        const customer = await ctx.db.query.customers.findFirst({
          where: eq(customers.email, input.guestEmail),
        });
        if (!customer) {
          customerId = nanoid();
          customerName = input.guestName;
          customerEmail = input.guestEmail;
          await ctx.db.insert(customers).values({
            id: customerId,
            userId: null, // No user logged in
            name: customerName,
            email: customerEmail,
          });
        } else {
          customerId = customer.id;
          customerName = customer.name; // Use existing name
          customerEmail = customer.email;
        }
      } else {
        // Fallback placeholder if no guest details provided
        console.warn(
          "Creating enrollment with placeholder customer details. Add guestName and guestEmail to input or implement authentication.",
        );
        customerId = "dev_customer_placeholder";
        customerName = "Dev User";
        customerEmail = "dev@example.com";
        // Ensure placeholder customer exists (or handle potential errors)
        const existingPlaceholder = await ctx.db.query.customers.findFirst({
          where: eq(customers.id, customerId),
        });
        if (!existingPlaceholder) {
          await ctx.db
            .insert(customers)
            .values({
              id: customerId,
              name: customerName,
              email: customerEmail,
              userId: null,
            });
        }
      }
      // --- END TEMPORARY HANDLING ---

      // Fetch Course (remains the same)
      const course = await ctx.db.query.trainingCourses.findFirst({
        where: and(
          eq(trainingCourses.id, input.courseId),
          eq(trainingCourses.isActive, true), // Ensure course is active
        ),
        columns: { id: true, title: true, capacity: true, price: true },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active course not found.",
        });
      }

      // Check if already enrolled (remains the same)
      const existingEnrollment = await ctx.db.query.courseEnrollments.findFirst(
        {
          where: and(
            eq(courseEnrollments.customerId, customerId),
            eq(courseEnrollments.courseId, input.courseId),
            // Optional: check for non-cancelled status if re-enrollment is allowed after cancelling
            ne(courseEnrollments.status, "CANCELLED"), // Example: prevent re-enrollment unless cancelled
          ),
        },
      );

      // Only throw conflict if status is NOT cancelled (or pending payment perhaps)
      if (existingEnrollment && existingEnrollment.status !== "CANCELLED") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already enrolled in this course.",
        });
      }

      // Check capacity (remains the same, ensure `sql` is imported)
      if (course.capacity !== null) {
        const enrollmentCountResult = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(courseEnrollments)
          .where(
            and(
              eq(courseEnrollments.courseId, input.courseId),
              // Consider which statuses count towards capacity (e.g., not PENDING_PAYMENT or CANCELLED)
              eq(courseEnrollments.status, "CONFIRMED"), // Only count confirmed enrollments towards capacity
            ),
          );
        const enrollmentCount: number = enrollmentCountResult[0]?.count ?? 0;
        if (enrollmentCount >= course.capacity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Course is full.",
          });
        }
      }

      // Create the enrollment record (use derived customer details)
      const enrollmentId = nanoid();
      try {
        await ctx.db.insert(courseEnrollments).values({
          id: enrollmentId,
          customerId: customerId, // Use derived/placeholder customerId
          courseId: input.courseId,
          pricePaid: course.price,
          status: "PENDING_PAYMENT",
          enrollmentDate: new Date(),
          startDate: null,
          // Snapshot data using derived/placeholder details
          courseTitleSnapshot: course.title,
          customerNameSnapshot: customerName,
          customerEmailSnapshot: customerEmail,
        });
      } catch (error) {
        console.error("Failed to create course enrollment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create enrollment",
        });
      }

      return { enrollmentId: enrollmentId };
    }),

  // WARNING: Using publicProcedure for development. Change back to protectedProcedure later.
  // This might not show anything useful without a logged-in user concept.
  listMyEnrollments: publicProcedure.query(async ({ ctx }) => {
    // --- TEMPORARY HANDLING ---
    // Without a session, we can't get the current user's enrollments.
    // Returning empty array for now. Replace with actual logic later.
    console.warn(
      "listMyEnrollments called without authentication. Returning empty array.",
    );
    return [];
    // --- END TEMPORARY HANDLING ---

    /* // Original logic (requires protectedProcedure and ctx.session)
      const userId = ctx.session.user.id;
      const customer = await ctx.db.query.customers.findFirst({ where: eq(customers.userId, userId), columns: { id: true } });
      if (!customer) { return []; }
      const enrollments = await ctx.db.query.courseEnrollments.findMany({ ... });
      return enrollments.map(e => ({ ... }));
      */
  }),

  // getById: protectedProcedure ...
  // cancel: protectedProcedure ...
});
