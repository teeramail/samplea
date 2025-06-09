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
  courseTitle: z.string().optional(), // Add for checkout flow
  // Customer information for enrollment
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string(),
  customerAddress: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalConditions: z.string().optional(),
  experienceLevel: z.string().optional(),
  paymentMethod: z.string(),
  pricePaid: z.number(),
  notes: z.string().optional(),
  // Temporary fields for guest/dev enrollment without login
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
});

export const courseEnrollmentRouter = createTRPCRouter({
  // WARNING: Using publicProcedure for development. Add proper auth and user handling later.
  create: publicProcedure
    .input(createEnrollmentSchema)
    .mutation(async ({ ctx, input }) => {
      // --- UPDATED CUSTOMER HANDLING ---
      let customerId: string;
      let customerName: string;
      let customerEmail: string;

      // Use provided customer information from the form
      customerName = input.customerName;
      customerEmail = input.customerEmail;

      // Try to find existing customer by email
      const existingCustomer = await ctx.db.query.customers.findFirst({
        where: eq(customers.email, customerEmail),
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Update customer info if needed
        await ctx.db
          .update(customers)
          .set({
            name: customerName,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, existingCustomer.id));
      } else {
        // Create new customer
        customerId = nanoid();
        await ctx.db.insert(customers).values({
          id: customerId,
          userId: null, // No user logged in
          name: customerName,
          email: customerEmail,
        });
      }
      // --- END UPDATED HANDLING ---

      // Fetch Course (remains the same)
      const course = await ctx.db.query.trainingCourses.findFirst({
        where: and(
          eq(trainingCourses.id, input.courseId),
          eq(trainingCourses.isActive, true),
        ),
        columns: { id: true, title: true, capacity: true, price: true },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active course not found.",
        });
      }

      // Check if already enrolled
      const existingEnrollment = await ctx.db.query.courseEnrollments.findFirst({
        where: and(
          eq(courseEnrollments.customerId, customerId),
          eq(courseEnrollments.courseId, input.courseId),
          ne(courseEnrollments.status, "CANCELLED"),
        ),
      });

      if (existingEnrollment && existingEnrollment.status !== "CANCELLED") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already enrolled in this course.",
        });
      }

      // Check capacity
      if (course.capacity !== null) {
        const enrollmentCountResult = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(courseEnrollments)
          .where(
            and(
              eq(courseEnrollments.courseId, input.courseId),
              eq(courseEnrollments.status, "CONFIRMED"),
            ),
          );
        const enrollmentCount = enrollmentCountResult[0]?.count ?? 0;
        if (enrollmentCount >= course.capacity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Course is full.",
          });
        }
      }

      // Create the enrollment record with only existing fields
      const enrollmentId = nanoid();
      try {
        await ctx.db.insert(courseEnrollments).values({
          id: enrollmentId,
          customerId: customerId,
          courseId: input.courseId,
          pricePaid: input.pricePaid,
          status: "AWAITING_CONFIRMATION",
          enrollmentDate: new Date(),
          startDate: null,
          courseTitleSnapshot: input.courseTitle || course.title,
          customerNameSnapshot: customerName,
          customerEmailSnapshot: customerEmail,
        });

        // For now, store additional enrollment details in the customer notes or a separate system
        // TODO: Add additional fields to courseEnrollments table in a future migration
        console.log("Additional enrollment info:", {
          phone: input.customerPhone,
          address: input.customerAddress,
          emergencyContact: input.emergencyContactName,
          emergencyPhone: input.emergencyContactPhone,
          medicalConditions: input.medicalConditions,
          experienceLevel: input.experienceLevel,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
        });

      } catch (error) {
        console.error("Failed to create course enrollment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create enrollment",
        });
      }

      return { id: enrollmentId };
    }),

  // Get enrollment by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const enrollment = await ctx.db.query.courseEnrollments.findFirst({
        where: eq(courseEnrollments.id, input.id),
      });

      if (!enrollment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Enrollment not found.",
        });
      }

      return enrollment;
    }),

  // List all enrollments (for admin)
  listAll: publicProcedure.query(async ({ ctx }) => {
    const enrollments = await ctx.db.query.courseEnrollments.findMany({
      orderBy: [desc(courseEnrollments.createdAt)],
      limit: 100,
    });
    return enrollments;
  }),

  // Update enrollment status (for admin)
  updateStatus: publicProcedure
    .input(z.object({ 
      id: z.string(),
      status: z.enum(["PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "COMPLETED", "AWAITING_CONFIRMATION"])
    }))
    .mutation(async ({ ctx, input }) => {
      const updatedEnrollment = await ctx.db
        .update(courseEnrollments)
        .set({ 
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(courseEnrollments.id, input.id))
        .returning();

      if (!updatedEnrollment[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Enrollment not found.",
        });
      }

      return updatedEnrollment[0];
    }),

  // WARNING: Using publicProcedure for development. Change back to protectedProcedure later.
  listMyEnrollments: publicProcedure.query(async ({ ctx }) => {
    // --- TEMPORARY HANDLING ---
    console.warn(
      "listMyEnrollments called without authentication. Returning empty array.",
    );
    return [] as Array<never>;
    // --- END TEMPORARY HANDLING ---
  }),
});
