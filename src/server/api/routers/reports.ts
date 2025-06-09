import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { bookings, courseEnrollments, events, trainingCourses, customers, venues, instructor } from "~/server/db/schema";
import { sql, eq, gte, and, desc } from "drizzle-orm";

// Define types for unified booking data
const bookingTypeEnum = z.enum(["EVENT", "COURSE", "ALL"]);

export const reportsRouter = createTRPCRouter({
  getRevenueStats: publicProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - input.days);

      // Get event booking revenue
      const eventRevenue = await ctx.db
        .select({
          total: sql<number>`SUM(${bookings.totalAmount})::numeric`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(bookings)
        .where(gte(bookings.createdAt, fromDate));

      // Get course enrollment revenue
      const courseRevenue = await ctx.db
        .select({
          total: sql<number>`SUM(${courseEnrollments.pricePaid})::numeric`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(courseEnrollments)
        .where(gte(courseEnrollments.createdAt, fromDate));

      return {
        eventRevenue: eventRevenue[0]?.total ?? 0,
        eventCount: eventRevenue[0]?.count ?? 0,
        courseRevenue: courseRevenue[0]?.total ?? 0,
        courseCount: courseRevenue[0]?.count ?? 0,
        totalRevenue: (eventRevenue[0]?.total ?? 0) + (courseRevenue[0]?.total ?? 0),
        totalBookings: (eventRevenue[0]?.count ?? 0) + (courseRevenue[0]?.count ?? 0),
      };
    }),

  getUnifiedBookings: publicProcedure
    .input(z.object({
      days: z.number().default(30),
      type: bookingTypeEnum.default("ALL"),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - input.days);

      const unifiedBookings: Array<{
        id: string;
        type: "EVENT" | "COURSE";
        customerName: string;
        customerEmail: string;
        activityTitle: string;
        amount: number;
        status: string;
        bookingDate: Date;
        paymentMethod?: string;
        eventDate?: Date;
        venueName?: string;
        ticketDetails?: string;
        courseDuration?: string;
        courseSchedule?: string;
        instructorName?: string;
      }> = [];

      // Fetch event bookings if requested
      if (input.type === "ALL" || input.type === "EVENT") {
        const eventBookings = await ctx.db
          .select({
            id: bookings.id,
            customerName: bookings.customerNameSnapshot,
            customerEmail: bookings.customerEmailSnapshot,
            activityTitle: bookings.eventTitleSnapshot,
            amount: bookings.totalAmount,
            status: bookings.paymentStatus,
            bookingDate: bookings.createdAt,
            paymentMethod: bookings.paymentMethod,
            eventDate: bookings.eventDateSnapshot,
            venueName: bookings.venueNameSnapshot,
            bookingItemsJson: bookings.bookingItemsJson,
          })
          .from(bookings)
          .where(gte(bookings.createdAt, fromDate))
          .orderBy(desc(bookings.createdAt))
          .limit(input.limit);

        for (const booking of eventBookings) {
          unifiedBookings.push({
            id: booking.id,
            type: "EVENT",
            customerName: booking.customerName ?? "Unknown",
            customerEmail: booking.customerEmail ?? "Unknown",
            activityTitle: booking.activityTitle ?? "Unknown Event",
            amount: booking.amount,
            status: booking.status,
            bookingDate: new Date(booking.bookingDate),
            paymentMethod: booking.paymentMethod ?? undefined,
            eventDate: booking.eventDate ? new Date(booking.eventDate) : undefined,
            venueName: booking.venueName ?? undefined,
            ticketDetails: booking.bookingItemsJson ? 
              JSON.stringify(booking.bookingItemsJson).slice(0, 50) + "..." : undefined,
          });
        }
      }

      // Fetch course enrollments if requested
      if (input.type === "ALL" || input.type === "COURSE") {
        const courseEnrollmentData = await ctx.db
          .select({
            id: courseEnrollments.id,
            customerName: courseEnrollments.customerNameSnapshot,
            customerEmail: courseEnrollments.customerEmailSnapshot,
            activityTitle: courseEnrollments.courseTitleSnapshot,
            amount: courseEnrollments.pricePaid,
            status: courseEnrollments.status,
            bookingDate: courseEnrollments.createdAt,
            courseId: courseEnrollments.courseId,
          })
          .from(courseEnrollments)
          .where(gte(courseEnrollments.createdAt, fromDate))
          .orderBy(desc(courseEnrollments.createdAt))
          .limit(input.limit);

        // Get additional course details
        for (const enrollment of courseEnrollmentData) {
          const course = await ctx.db.query.trainingCourses.findFirst({
            where: eq(trainingCourses.id, enrollment.courseId),
            with: {
              instructor: true,
              venue: true,
            },
          });

          unifiedBookings.push({
            id: enrollment.id,
            type: "COURSE",
            customerName: enrollment.customerName ?? "Unknown",
            customerEmail: enrollment.customerEmail ?? "Unknown",
            activityTitle: enrollment.activityTitle ?? "Unknown Course",
            amount: enrollment.amount,
            status: enrollment.status,
            bookingDate: new Date(enrollment.bookingDate),
            courseDuration: course?.duration ?? undefined,
            courseSchedule: course?.scheduleDetails ?? undefined,
            instructorName: course?.instructor?.name ?? undefined,
            venueName: course?.venue?.name ?? undefined,
          });
        }
      }

      // Sort unified bookings by date (most recent first)
      unifiedBookings.sort((a, b) => b.bookingDate.getTime() - a.bookingDate.getTime());

      return unifiedBookings.slice(0, input.limit);
    }),

  getBookingAnalytics: publicProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - input.days);

      // Get daily revenue breakdown
      const dailyStats = await ctx.db
        .select({
          date: sql<string>`DATE(${bookings.createdAt})`,
          eventRevenue: sql<number>`SUM(${bookings.totalAmount})::numeric`,
          eventCount: sql<number>`COUNT(*)::int`,
        })
        .from(bookings)
        .where(gte(bookings.createdAt, fromDate))
        .groupBy(sql`DATE(${bookings.createdAt})`)
        .orderBy(sql`DATE(${bookings.createdAt})`);

      const dailyCourseStats = await ctx.db
        .select({
          date: sql<string>`DATE(${courseEnrollments.createdAt})`,
          courseRevenue: sql<number>`SUM(${courseEnrollments.pricePaid})::numeric`,
          courseCount: sql<number>`COUNT(*)::int`,
        })
        .from(courseEnrollments)
        .where(gte(courseEnrollments.createdAt, fromDate))
        .groupBy(sql`DATE(${courseEnrollments.createdAt})`)
        .orderBy(sql`DATE(${courseEnrollments.createdAt})`);

      return {
        dailyEventStats: dailyStats,
        dailyCourseStats: dailyCourseStats,
      };
    }),

  getTopCustomers: publicProcedure
    .input(z.object({
      days: z.number().default(30),
      limit: z.number().default(10),
    }))
    .query(async ({ ctx, input }) => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - input.days);

      // Get top customers by total spending
      const topCustomers = await ctx.db
        .select({
          customerEmail: bookings.customerEmailSnapshot,
          customerName: bookings.customerNameSnapshot,
          totalSpent: sql<number>`SUM(${bookings.totalAmount})::numeric`,
          bookingCount: sql<number>`COUNT(*)::int`,
        })
        .from(bookings)
        .where(gte(bookings.createdAt, fromDate))
        .groupBy(bookings.customerEmailSnapshot, bookings.customerNameSnapshot)
        .orderBy(desc(sql`SUM(${bookings.totalAmount})`))
        .limit(input.limit);

      return topCustomers;
    }),
}); 