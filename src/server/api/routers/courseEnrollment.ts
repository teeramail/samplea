import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure, // Use protectedProcedure to ensure user is logged in
} from "~/server/api/trpc";
import { courseEnrollments, trainingCourses, customers } from "~/server/db/schema";
import { eq, and, desc, sql, ne } from "drizzle-orm";

// Input schema for creating an enrollment
const createEnrollmentSchema = z.object({
  courseId: z.string(),
  // Payment details might be handled separately or passed here
});

export const courseEnrollmentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createEnrollmentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // 1. Find or create the customer record for the logged-in user
      let customer = await ctx.db.query.customers.findFirst({
        where: eq(customers.userId, userId),
      });

      if (!customer) {
        // If no customer record exists for this user, create one
        // We might need more user details here (name, email) - assume they are on ctx.session.user
        const customerId = nanoid();
        await ctx.db.insert(customers).values({
          id: customerId,
          userId: userId,
          // Make sure name and email are available in your session context
          name: ctx.session.user.name ?? "Unknown User", 
          email: ctx.session.user.email ?? "unknown@example.com",
          phone: null, // Or get from user profile if available
        });
        // Fetch the newly created customer to get all fields
        customer = await ctx.db.query.customers.findFirst({where: eq(customers.id, customerId)});
        if (!customer) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create customer record." });
      }

      const customerId = customer.id;

      // 2. Fetch the course details to check capacity and get snapshot data
      const course = await ctx.db.query.trainingCourses.findFirst({
        where: and(
          eq(trainingCourses.id, input.courseId),
          eq(trainingCourses.isActive, true) // Ensure course is active
        ),
        columns: { id: true, title: true, capacity: true, price: true },
      });

      if (!course) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Active course not found." });
      }

      // 3. (Optional) Check if already enrolled
      const existingEnrollment = await ctx.db.query.courseEnrollments.findFirst({
          where: and(
              eq(courseEnrollments.customerId, customerId),
              eq(courseEnrollments.courseId, input.courseId),
              // Optional: check for non-cancelled status if re-enrollment is allowed after cancelling
              ne(courseEnrollments.status, 'CANCELLED') // Example: prevent re-enrollment unless cancelled
          )
      });
      
      // Only throw conflict if status is NOT cancelled (or pending payment perhaps)
      if(existingEnrollment && existingEnrollment.status !== 'CANCELLED') {
          throw new TRPCError({ code: "CONFLICT", message: "You are already enrolled in this course." });
      }

      // 4. Check capacity (if defined)
      if (course.capacity !== null) {
        const enrollmentCountResult = await ctx.db
          .select({ count: sql`count(*)::int` })
          .from(courseEnrollments)
          .where(and(
              eq(courseEnrollments.courseId, input.courseId),
              // Consider which statuses count towards capacity (e.g., not PENDING_PAYMENT or CANCELLED)
              eq(courseEnrollments.status, 'CONFIRMED') // Only count confirmed enrollments towards capacity
            )
          );
        const enrollmentCount = enrollmentCountResult[0]?.count ?? 0;
        if (enrollmentCount >= course.capacity) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Course is full." });
        }
      }

      // 5. Create the enrollment record
      const enrollmentId = nanoid();
      await ctx.db.insert(courseEnrollments).values({
        id: enrollmentId,
        customerId: customerId,
        courseId: input.courseId,
        pricePaid: course.price, // Assume full price paid, adjust if discounts/payments apply
        status: "PENDING_PAYMENT", // Start as pending, update after successful payment
        enrollmentDate: new Date(),
        startDate: null, // Set if the course has a specific start date instance
        // Snapshot data
        courseTitleSnapshot: course.title,
        customerNameSnapshot: customer.name,
        customerEmailSnapshot: customer.email,
      });

      // 6. Return enrollment ID (and potentially redirect URL for payment)
      return {
        enrollmentId: enrollmentId,
        // paymentUrl: "/payment/enrollment/" + enrollmentId // Example
      };
    }),

  listMyEnrollments: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      // Find the customer ID associated with the user
      const customer = await ctx.db.query.customers.findFirst({
        where: eq(customers.userId, userId),
        columns: { id: true },
      });

      if (!customer) {
        // If the user has never enrolled or booked anything, they might not have a customer record
        return [];
      }

      // Fetch enrollments for this customer
      const enrollments = await ctx.db.query.courseEnrollments.findMany({
        where: eq(courseEnrollments.customerId, customer.id),
        orderBy: [desc(courseEnrollments.enrollmentDate)],
        with: {
          // Include course details (use snapshot title, but link via ID for current info)
          course: {
            columns: {
              id: true,
              slug: true, 
              // title: true, // Use snapshot title
              // Add other useful fields like instructor name if needed
            },
            with: {
                instructor: { columns: { name: true } }
            }
          },
        },
      });

      // Map results to potentially combine snapshot title with current course slug/instructor
      return enrollments.map(e => ({
        ...e,
        courseTitle: e.courseTitleSnapshot, // Use the title from time of enrollment
        courseSlug: e.course?.slug, // Provide slug for linking
        instructorName: e.course?.instructor?.name, // Provide current instructor name
      }));
    }),
    
    // getById: protectedProcedure ...
    // cancel: protectedProcedure ...
}); 