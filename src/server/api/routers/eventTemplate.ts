import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { and, asc, desc, eq, inArray, like, sql } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  eventTemplates,
  eventTemplateTickets,
  venues,
  regions,
} from "~/server/db/schema";

export const eventTemplateRouter = createTRPCRouter({
  // Get a paginated list of event templates with sorting and filtering
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(10),
        sortField: z.string().optional(),
        sortDirection: z.enum(["asc", "desc"]).optional(),
        query: z.string().optional(),
        venueId: z.string().optional(),
        regionId: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        page,
        limit,
        sortField,
        sortDirection,
        query,
        venueId,
        regionId,
        isActive,
      } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = [];

      if (query) {
        whereConditions.push(like(eventTemplates.templateName, `%${query}%`));
      }

      if (venueId) {
        whereConditions.push(eq(eventTemplates.venueId, venueId));
      }

      if (regionId) {
        whereConditions.push(eq(eventTemplates.regionId, regionId));
      }

      if (isActive !== undefined) {
        whereConditions.push(eq(eventTemplates.isActive, isActive));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Build order by
      let orderBy;
      if (sortField && sortDirection) {
        const direction = sortDirection === "asc" ? asc : desc;

        // Map sortField to the corresponding column
        switch (sortField) {
          case "templateName":
            orderBy = direction(eventTemplates.templateName);
            break;
          case "venueName":
            orderBy = direction(venues.name);
            break;
          case "regionName":
            orderBy = direction(regions.name);
            break;
          case "isActive":
            orderBy = direction(eventTemplates.isActive);
            break;
          case "createdAt":
            orderBy = direction(eventTemplates.createdAt);
            break;
          default:
            orderBy = direction(eventTemplates.createdAt);
        }
      } else {
        // Default sort by created date
        orderBy = desc(eventTemplates.createdAt);
      }

      // Count total items for pagination
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(eventTemplates)
        .where(whereClause);

      const totalItems = countResult[0]?.count ?? 0;
      const totalPages = Math.ceil(totalItems / limit);

      // Get templates with venue and region info
      const templates = await ctx.db.query.eventTemplates.findMany({
        where: whereClause,
        limit,
        offset,
        with: {
          venue: true,
          region: true,
        },
        orderBy,
      });

      return {
        items: templates,
        meta: {
          totalItems,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      };
    }),

  // Get a single event template by ID with all related data
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.query.eventTemplates.findFirst({
        where: eq(eventTemplates.id, input.id),
        with: {
          venue: true,
          region: true,
        },
      });

      if (!template) {
        throw new Error("Event template not found");
      }

      // Get ticket types for this template
      const templateTickets = await ctx.db.query.eventTemplateTickets.findMany({
        where: eq(eventTemplateTickets.eventTemplateId, input.id),
        orderBy: asc(eventTemplateTickets.seatType),
      });

      return {
        ...template,
        templateTickets,
      };
    }),

  // Get all template IDs for navigation
  getAllIds: publicProcedure.query(async ({ ctx }) => {
    const results = await ctx.db
      .select({ id: eventTemplates.id })
      .from(eventTemplates)
      .orderBy(asc(eventTemplates.templateName));

    return results.map((r) => r.id);
  }),

  // Create a new event template
  create: publicProcedure
    .input(
      z.object({
        templateName: z.string().min(1),
        venueId: z.string().min(1),
        regionId: z.string().min(1),
        defaultTitleFormat: z.string().min(1),
        defaultDescription: z.string().optional(),
        // Recurrence fields
        recurrenceType: z.enum(["none", "weekly", "monthly"]).default("none"),
        recurringDaysOfWeek: z.array(z.number().min(0).max(6)).optional(),
        dayOfMonth: z.array(z.number().min(1).max(31)).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        // Time fields
        defaultStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        defaultEndTime: z
          .string()
          .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
        isActive: z.boolean().default(true),
        templateTickets: z
          .array(
            z.object({
              seatType: z.string().min(1),
              defaultPrice: z.number().positive(),
              defaultCapacity: z.number().positive(),
              defaultDescription: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { templateTickets, ...templateData } = input;

      // Create the event template
      const templateId = createId();

      // Helper function to ensure we have proper arrays
      const ensureNumberArray = (value: unknown): number[] => {
        if (Array.isArray(value)) {
          return value.map(Number);
        }
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(Number) : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      // Convert date strings to Date objects and prepare data for insertion
      const dataToInsert = {
        id: templateId,
        templateName: templateData.templateName,
        venueId: templateData.venueId,
        regionId: templateData.regionId,
        defaultTitleFormat: templateData.defaultTitleFormat,
        defaultDescription: templateData.defaultDescription,
        recurrenceType: templateData.recurrenceType,
        // Store recurringDaysOfWeek as an actual array, not a JSON string
        recurringDaysOfWeek: ensureNumberArray(templateData.recurringDaysOfWeek),
        // Only store a single day of month value for now
        dayOfMonth: Array.isArray(templateData.dayOfMonth) && templateData.dayOfMonth.length > 0 
          ? Number(templateData.dayOfMonth[0]) 
          : null,
        defaultStartTime: templateData.defaultStartTime,
        defaultEndTime: templateData.defaultEndTime,
        isActive: templateData.isActive,
        startDate: templateData.startDate ? new Date(templateData.startDate) : null,
        endDate: templateData.endDate ? new Date(templateData.endDate) : null,
      };

      await ctx.db.insert(eventTemplates).values(dataToInsert);

      // Create the ticket types
      for (const ticket of templateTickets) {
        await ctx.db.insert(eventTemplateTickets).values({
          id: createId(),
          eventTemplateId: templateId,
          ...ticket,
        });
      }

      return { id: templateId };
    }),

  // Update an existing event template
  // TEMPORARY: Changed from protectedProcedure to publicProcedure for development
  // TODO: Change back to protectedProcedure before deploying to production
  update: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
        templateName: z.string().min(1),
        venueId: z.string().min(1),
        regionId: z.string().min(1),
        defaultTitleFormat: z.string().min(1),
        defaultDescription: z.string().optional(),
        // Recurrence fields
        recurrenceType: z.enum(["none", "weekly", "monthly"]).default("none"),
        recurringDaysOfWeek: z.array(z.number().min(0).max(6)).optional(),
        dayOfMonth: z.array(z.number().min(1).max(31)).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        // Time fields
        defaultStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        defaultEndTime: z
          .string()
          .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
        isActive: z.boolean(),
        templateTickets: z
          .array(
            z.object({
              id: z.string().optional(),
              seatType: z.string().min(1),
              defaultPrice: z.number().positive(),
              defaultCapacity: z.number().positive(),
              defaultDescription: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, templateTickets, ...templateData } = input;

      // Helper function to ensure we have proper arrays
      const ensureNumberArray = (value: unknown): number[] => {
        if (Array.isArray(value)) {
          return value.map(Number);
        }
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(Number) : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      // Convert date strings to Date objects and prepare data for update
      const dataToUpdate = {
        templateName: templateData.templateName,
        venueId: templateData.venueId, 
        regionId: templateData.regionId,
        defaultTitleFormat: templateData.defaultTitleFormat,
        defaultDescription: templateData.defaultDescription,
        recurrenceType: templateData.recurrenceType,
        // Store recurringDaysOfWeek as an actual array, using the helper function
        recurringDaysOfWeek: ensureNumberArray(templateData.recurringDaysOfWeek),
        // Only store a single day of month value for now
        dayOfMonth: Array.isArray(templateData.dayOfMonth) && templateData.dayOfMonth.length > 0 
          ? Number(templateData.dayOfMonth[0]) 
          : null,
        defaultStartTime: templateData.defaultStartTime,
        defaultEndTime: templateData.defaultEndTime,
        isActive: templateData.isActive,
        startDate: templateData.startDate ? new Date(templateData.startDate) : null,
        endDate: templateData.endDate ? new Date(templateData.endDate) : null,
      };

      // Update the event template
      await ctx.db
        .update(eventTemplates)
        .set(dataToUpdate)
        .where(eq(eventTemplates.id, id));

      // Get existing ticket types
      const existingTickets = await ctx.db.query.eventTemplateTickets.findMany({
        where: eq(eventTemplateTickets.eventTemplateId, id),
      });

      const existingTicketIds = existingTickets.map((t) => t.id);

      // Process ticket types (update, create, delete)
      for (const ticket of templateTickets) {
        if (ticket.id) {
          // Update existing ticket
          await ctx.db
            .update(eventTemplateTickets)
            .set({
              seatType: ticket.seatType,
              defaultPrice: ticket.defaultPrice,
              defaultCapacity: ticket.defaultCapacity,
              defaultDescription: ticket.defaultDescription,
            })
            .where(eq(eventTemplateTickets.id, ticket.id));
        } else {
          // Create new ticket
          await ctx.db.insert(eventTemplateTickets).values({
            id: createId(),
            eventTemplateId: id,
            seatType: ticket.seatType,
            defaultPrice: ticket.defaultPrice,
            defaultCapacity: ticket.defaultCapacity,
            defaultDescription: ticket.defaultDescription,
          });
        }
      }

      // Find ticket IDs to keep
      const ticketIdsToKeep = templateTickets
        .filter((t) => t.id)
        .map((t) => t.id!);

      // Delete tickets that are no longer needed
      const ticketIdsToDelete = existingTicketIds.filter(
        (id) => !ticketIdsToKeep.includes(id),
      );

      if (ticketIdsToDelete.length > 0) {
        await ctx.db
          .delete(eventTemplateTickets)
          .where(inArray(eventTemplateTickets.id, ticketIdsToDelete));
      }

      return { success: true };
    }),

  // Toggle active status
  toggleActive: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(eventTemplates)
        .set({ isActive: input.isActive })
        .where(eq(eventTemplates.id, input.id));

      return { success: true };
    }),

  // Delete an event template
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Delete the event template (this will cascade delete ticket types)
      await ctx.db
        .delete(eventTemplates)
        .where(eq(eventTemplates.id, input.id));

      return { success: true };
    }),
});
