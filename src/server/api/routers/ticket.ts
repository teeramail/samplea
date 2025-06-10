import { z } from "zod";
import { and, eq, sql, desc, asc, like } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { tickets, bookings, events, eventTickets, venues, regions, customers } from "~/server/db/schema";

export const ticketRouter = createTRPCRouter({
  // List tickets with pagination and filtering
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        sortField: z.enum(["createdAt", "status", "eventTitle", "customerName"]).default("createdAt"),
        sortDirection: z.enum(["asc", "desc"]).default("desc"),
        query: z.string().optional(),
        status: z.enum(["ACTIVE", "USED", "CANCELLED"]).optional(),
        eventId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;

      // Build where conditions
      const whereConditions = [];
      
      if (input.query) {
        // Search in customer name, event title, or ticket ID
        whereConditions.push(
          sql`(${customers.name} ILIKE ${`%${input.query}%`} OR 
               ${events.title} ILIKE ${`%${input.query}%`} OR 
               ${tickets.id} ILIKE ${`%${input.query}%`})`
        );
      }

      if (input.status) {
        whereConditions.push(eq(tickets.status, input.status));
      }

      if (input.eventId) {
        whereConditions.push(eq(tickets.eventId, input.eventId));
      }

      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined;

      // Get total count
      const totalCountResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .leftJoin(bookings, eq(tickets.bookingId, bookings.id))
        .leftJoin(customers, eq(bookings.customerId, customers.id))
        .leftJoin(events, eq(tickets.eventId, events.id))
        .where(whereClause);

      const totalCount = totalCountResult[0]?.count ?? 0;

      // Determine sort order
      const orderBy = input.sortDirection === "desc" ? desc : asc;
      let sortColumn;
      
      switch (input.sortField) {
        case "status":
          sortColumn = tickets.status;
          break;
        case "eventTitle":
          sortColumn = events.title;
          break;
        case "customerName":
          sortColumn = customers.name;
          break;
        default:
          sortColumn = tickets.createdAt;
      }

      // Get paginated results
      const results = await ctx.db
        .select({
          id: tickets.id,
          status: tickets.status,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt,
          eventId: tickets.eventId,
          bookingId: tickets.bookingId,
          // Booking info
          booking: {
            id: bookings.id,
            totalAmount: bookings.totalAmount,
            paymentStatus: bookings.paymentStatus,
          },
          // Customer info
          customer: {
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone,
          },
          // Event info
          event: {
            id: events.id,
            title: events.title,
            date: events.date,
          },
          // Ticket type info
          eventTicket: {
            id: eventTickets.id,
            seatType: eventTickets.seatType,
            price: eventTickets.price,
          },
          // Venue info
          venue: {
            id: venues.id,
            name: venues.name,
          },
          // Region info
          region: {
            id: regions.id,
            name: regions.name,
          },
        })
        .from(tickets)
        .leftJoin(bookings, eq(tickets.bookingId, bookings.id))
        .leftJoin(customers, eq(bookings.customerId, customers.id))
        .leftJoin(events, eq(tickets.eventId, events.id))
        .leftJoin(eventTickets, eq(tickets.eventDetailId, eventTickets.id))
        .leftJoin(venues, eq(events.venueId, venues.id))
        .leftJoin(regions, eq(events.regionId, regions.id))
        .where(whereClause)
        .orderBy(orderBy(sortColumn))
        .limit(input.limit)
        .offset(offset);

      const pageCount = Math.ceil(totalCount / input.limit);

      return {
        items: results,
        totalCount,
        pageCount,
        currentPage: input.page,
      };
    }),

  // Get a single ticket by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: tickets.id,
          status: tickets.status,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt,
          eventId: tickets.eventId,
          bookingId: tickets.bookingId,
                     // Booking info
           booking: {
             id: bookings.id,
             totalAmount: bookings.totalAmount,
             paymentStatus: bookings.paymentStatus,
             createdAt: bookings.createdAt,
           },
          // Customer info
          customer: {
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone,
          },
          // Event info
          event: {
            id: events.id,
            title: events.title,
            date: events.date,
            startTime: events.startTime,
            endTime: events.endTime,
          },
          // Ticket type info
          eventTicket: {
            id: eventTickets.id,
            seatType: eventTickets.seatType,
            price: eventTickets.price,
            description: eventTickets.description,
          },
          // Venue info
          venue: {
            id: venues.id,
            name: venues.name,
            address: venues.address,
          },
          // Region info
          region: {
            id: regions.id,
            name: regions.name,
          },
        })
        .from(tickets)
        .leftJoin(bookings, eq(tickets.bookingId, bookings.id))
        .leftJoin(customers, eq(bookings.customerId, customers.id))
        .leftJoin(events, eq(tickets.eventId, events.id))
        .leftJoin(eventTickets, eq(tickets.eventDetailId, eventTickets.id))
        .leftJoin(venues, eq(events.venueId, venues.id))
        .leftJoin(regions, eq(events.regionId, regions.id))
        .where(eq(tickets.id, input.id))
        .limit(1);

      return result[0] ?? null;
    }),

  // Update ticket status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["ACTIVE", "USED", "CANCELLED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(tickets)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, input.id))
        .returning();

      return result[0] ?? null;
    }),

  // Get ticket statistics
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const stats = await ctx.db
        .select({
          status: tickets.status,
          count: sql<number>`count(*)`,
        })
        .from(tickets)
        .groupBy(tickets.status);

      const totalTickets = stats.reduce((sum, stat) => sum + stat.count, 0);
      
      return {
        totalTickets,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat.count;
          return acc;
        }, {} as Record<string, number>),
      };
    }),

  // Get tickets for a specific event
  getByEventId: protectedProcedure
    .input(z.object({ 
      eventId: z.string(),
      status: z.enum(["ACTIVE", "USED", "CANCELLED"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const whereConditions = [eq(tickets.eventId, input.eventId)];
      
      if (input.status) {
        whereConditions.push(eq(tickets.status, input.status));
      }

      const results = await ctx.db
        .select({
          id: tickets.id,
          status: tickets.status,
          createdAt: tickets.createdAt,
          customer: {
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone,
          },
          eventTicket: {
            seatType: eventTickets.seatType,
            price: eventTickets.price,
          },
        })
        .from(tickets)
        .leftJoin(bookings, eq(tickets.bookingId, bookings.id))
        .leftJoin(customers, eq(bookings.customerId, customers.id))
        .leftJoin(eventTickets, eq(tickets.eventDetailId, eventTickets.id))
        .where(and(...whereConditions))
        .orderBy(desc(tickets.createdAt));

      return results;
    }),
}); 