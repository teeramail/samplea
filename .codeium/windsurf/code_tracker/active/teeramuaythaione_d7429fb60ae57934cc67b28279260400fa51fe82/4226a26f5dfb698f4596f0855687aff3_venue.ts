�^import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  // adminProcedure, // TODO
} from "~/server/api/trpc";
import { venues, venueToVenueTypes, venueTypes } from "~/server/db/schema";
import { eq, desc, and, like, asc, inArray, or, count } from "drizzle-orm";

// TODO: Add input schemas for create/update if not already present

export const venueRouter = createTRPCRouter({
  // Add list procedure to fetch all venues
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      page: z.number().min(1).default(1),
      query: z.string().optional(),
      sortField: z.enum(['name', 'region', 'address', 'featured', 'updatedAt']).default('updatedAt'),
      sortDirection: z.enum(['asc', 'desc']).default('desc'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const page = input?.page ?? 1;
      const offset = (page - 1) * limit;
      const query = input?.query;
      const sortField = input?.sortField ?? 'updatedAt';
      const sortDirection = input?.sortDirection ?? 'desc';
      
      try {
        let whereClause = undefined;
        
        if (query) {
          whereClause = like(venues.name, `%${query}%`);
        }
        
        // Count total venues for pagination
        const totalCount = await ctx.db
          .select({ count: count() })
          .from(venues)
          .where(whereClause ?? undefined)
          .then(result => result[0]?.count ?? 0);
        
        // Determine sort order
        let orderBy;
        switch (sortField) {
          case 'name':
            orderBy = sortDirection === 'asc' ? asc(venues.name) : desc(venues.name);
            break;
          case 'featured':
            orderBy = sortDirection === 'asc' ? asc(venues.isFeatured) : desc(venues.isFeatured);
            break;
          case 'updatedAt':
            orderBy = sortDirection === 'asc' ? asc(venues.updatedAt) : desc(venues.updatedAt);
            break;
          default:
            orderBy = desc(venues.updatedAt);
        }
        
        const venuesList = await ctx.db.query.venues.findMany({
          where: whereClause,
          orderBy: [orderBy],
          limit: limit,
          offset: offset,
          with: {
            region: true,
          },
        });
        
        return {
          items: venuesList,
          totalCount,
          pageCount: Math.ceil(totalCount / limit),
          currentPage: page,
        };
      } catch (error) {
        console.error("Failed to fetch venues:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch venues' });
      }
    }),

  // ... existing procedures like list, getById ...

  // Add this new procedure
  getFeatured: publicProcedure
    .input(z.object({
        limit: z.number().min(1).max(10).default(4),
        regionId: z.string().optional()
    }).optional())
    .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 4;
        const whereConditions = [eq(venues.isFeatured, true)];

        if (input?.regionId) {
            whereConditions.push(eq(venues.regionId, input.regionId));
        }

        try {
            const featuredVenues = await ctx.db.query.venues.findMany({
                where: and(...whereConditions),
                limit: limit,
                orderBy: [desc(venues.createdAt)], // Or other order like name
                with: {
                    region: { columns: { name: true, slug: true } }
                }
            });
            return featuredVenues;
        } catch (error) {
            console.error("Failed to fetch featured venues:", error);
            // Ensure isFeatured exists in your schema.ts for venues
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch featured venues' });
        }
    }),

  // Add toggleFeatured mutation
  toggleFeatured: publicProcedure // TODO: Change to adminProcedure
    .input(z.object({
      id: z.string(),
      isFeatured: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .update(venues)
          .set({ isFeatured: input.isFeatured, updatedAt: new Date() })
          .where(eq(venues.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("Failed to toggle venue featured status:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update venue' });
      }
    }),

  // TODO: Add create, update procedures (marked for admin)
  // Delete procedure for venues
  delete: publicProcedure // TODO: Change to adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // First check if venue exists
        const venue = await ctx.db.query.venues.findFirst({
          where: eq(venues.id, input.id),
        });
        
        if (!venue) {
          throw new TRPCError({ 
            code: 'NOT_FOUND', 
            message: 'Venue not found' 
          });
        }
        
        // Delete venue type relationships first
        await ctx.db
          .delete(venueToVenueTypes)
          .where(eq(venueToVenueTypes.venueId, input.id));
          
        // Then delete the venue
        await ctx.db
          .delete(venues)
          .where(eq(venues.id, input.id));
          
        return { success: true };
      } catch (error) {
        console.error("Failed to delete venue:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to delete venue' 
        });
      }
    }),

  // Add a procedure to get venues by venue type
  getByVenueType: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().nullish(),
      venueTypeIds: z.array(z.string()).optional(),
      regionId: z.string().optional(),
      featured: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const limit = input.limit;
      const whereConditions = [];
      
      try {
        // First, get venue types if not provided
        let typeIds = input.venueTypeIds;
        if (!typeIds ?? typeIds.length === 0) {
          // Get all venue types related to Muay Thai and Kickboxing
          const allVenueTypes = await ctx.db.query.venueTypes.findMany({
            where: or(
              like(venueTypes.name, '%muay thai%'),
              like(venueTypes.name, '%kickboxing%'),
              like(venueTypes.name, '%boxing%'),
              like(venueTypes.name, '%gym%'),
              like(venueTypes.name, '%stadium%')
            ),
          });
          typeIds = allVenueTypes.map(type => type.id);
        }
        
        // Get venue IDs that match the venue types
        const venueTypeLinks = await ctx.db.query.venueToVenueTypes.findMany({
          where: inArray(venueToVenueTypes.venueTypeId, typeIds),
        });
        
        const venueIds = venueTypeLinks.map(link => link.venueId);
        
        // If no venues found with these types, return empty array
        if (venueIds.length === 0) {
          return {
            venues: [],
            groupedVenues: {},
          };
        }
        
        // Add venue ID filter
        whereConditions.push(inArray(venues.id, venueIds));
        
        // Add region filter if provided
        if (input.regionId) {
          whereConditions.push(eq(venues.regionId, input.regionId));
        }
        
        // Add featured filter if provided
        if (input.featured !== undefined) {
          whereConditions.push(eq(venues.isFeatured, input.featured));
        }
        
        // Get the venues
        const venuesList = await ctx.db.query.venues.findMany({
          where: and(...whereConditions),
          limit: limit,
          orderBy: [desc(venues.isFeatured), asc(venues.name)], // Sort featured venues first
          with: {
            region: true,
          },
        });
        
        // For each venue, get its venue types
        const venuesWithTypes = await Promise.all(
          venuesList.map(async (venue) => {
            const venueTypeLinks = await ctx.db.query.venueToVenueTypes.findMany({
              where: eq(venueToVenueTypes.venueId, venue.id),
              with: {
                venueType: true,
              },
              orderBy: [desc(venueToVenueTypes.isPrimary)], // Get primary types first
            });
            
            return {
              ...venue,
              venueTypes: venueTypeLinks.map(link => link.venueType),
              primaryType: venueTypeLinks.find(link => link.isPrimary)?.venueType ?? venueTypeLinks[0]?.venueType,
            };
          })
        );
        
        // Group venues by venue type - prioritize primary types
        const groupedVenues: Record<string, typeof venuesWithTypes> = {};
        
        // First pass: add venues to their primary type groups
        venuesWithTypes.forEach(venue => {
          if (venue.primaryType) {
            const typeName = venue.primaryType.name ?? 'Unknown';
            if (!groupedVenues[typeName]) {
              groupedVenues[typeName] = [];
            }
            groupedVenues[typeName].push(venue);
          }
        });
        
        // Second pass: add venues to their secondary type groups if they have multiple types
        venuesWithTypes.forEach(venue => {
          venue.venueTypes.forEach(type => {
            // Skip if this is the primary type (already added)
            if (venue.primaryType && type.id === venue.primaryType.id) {
              return;
            }
            
            const typeName = type.name ?? 'Unknown';
            if (!groupedVenues[typeName]) {
              groupedVenues[typeName] = [];
            }
            // Only add the venue if it's not already in this group
            if (!groupedVenues[typeName].some((v) => v.id === venue.id)) {
              groupedVenues[typeName].push(venue);
            }
          });
        });
        
        // Third pass: add venues with no types to an "Other" category
        const venuesWithNoTypes = venuesWithTypes.filter(venue => !venue.venueTypes.length);
        if (venuesWithNoTypes.length > 0) {
          groupedVenues.Other = venuesWithNoTypes;
        }
        
        return {
          venues: venuesWithTypes,
          groupedVenues: groupedVenues,
        };
      } catch (error) {
        console.error("Failed to fetch venues by type:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch venues by type' });
      }
    }),
  // Get venue by ID procedure
  getById: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const venue = await ctx.db.query.venues.findFirst({
          where: eq(venues.id, input.id),
          with: {
            region: true
          }
        });
        
        if (!venue) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue not found' });
        }
        
        return venue;
      } catch (error) {
        console.error("Failed to fetch venue:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch venue' });
      }
    }),
    
  // Get all venue IDs for navigation
  getAllIds: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const allVenues = await ctx.db
          .select({ id: venues.id })
          .from(venues)
          .orderBy(desc(venues.updatedAt));
        
        return allVenues.map(venue => venue.id);
      } catch (error) {
        console.error("Failed to fetch venue IDs:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch venue IDs' });
      }
    })
}); �^"(d7429fb60ae57934cc67b28279260400fa51fe822_file:///c:/work/projects/newpro/teeonedWinsurf/teeramuaythaione/src/server/api/routers/venue.ts:?file:///c:/work/projects/newpro/teeonedWinsurf/teeramuaythaione