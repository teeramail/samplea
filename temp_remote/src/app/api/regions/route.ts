import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { regions } from "~/server/db/schema";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

// Helper function to generate a URL-friendly slug from a name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .trim();
};

// Match the actual database structure with imageUrls and primaryImageIndex
const regionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  slug: z.string().min(2, "Slug must be at least 2 characters long").optional(),
  description: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  primaryImageIndex: z.number().int().min(0).optional(),
});

export async function GET() {
  try {
    const allRegions = await db.query.regions.findMany({
      orderBy: (regions, { asc }) => [asc(regions.name)],
    });
    
    return NextResponse.json(allRegions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log("Received POST request to /api/regions");
  
  try {
    let body: {
      name: string;
      slug?: string;
      description?: string;
      imageUrls?: string[];
      primaryImageIndex?: number;
    };
    
    try {
      body = await req.json();
      console.log("Request body:", body);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    // Validate the request body
    const validation = regionSchema.safeParse(body);
    
    if (!validation.success) {
      console.error("Validation error:", validation.error.format());
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    const regionId = uuidv4();
    
    // Generate slug if not provided
    const slug = data.slug ?? generateSlug(data.name);
    
    console.log("Creating region with data:", {
      id: regionId,
      name: data.name,
      slug,
      description: data.description,
      imageUrls: data.imageUrls,
      primaryImageIndex: data.primaryImageIndex,
    });
    
    try {
      // Insert region with all fields including slug
      await db.insert(regions).values({
        id: regionId,
        name: data.name,
        slug,
        description: data.description ?? null,
        imageUrls: data.imageUrls ?? [],
        primaryImageIndex: data.primaryImageIndex ?? 0,
      });
      
      console.log("Insert successful, now querying to verify");
      
      // Verify the region was created
      const newRegion = await db.query.regions.findFirst({
        where: eq(regions.id, regionId),
      });
      
      console.log("Query result:", newRegion);
      
      if (!newRegion) {
        console.error("Region not found after insert");
        throw new Error("Region was not created successfully");
      }
      
      // Return the newly created region
      return NextResponse.json(newRegion, { status: 201 });
      
    } catch (dbError) {
      console.error("Database error when creating region:", dbError);
      console.error("Error stack:", dbError instanceof Error ? dbError.stack : "No stack available");
      
      // Check what kind of database error it is
      const errorMessage = dbError instanceof Error ? dbError.message : "Unknown database error";
      
      return NextResponse.json(
        { error: "Database error", details: errorMessage },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Unhandled error creating region:", error);
    
    // Return more detailed error
    return NextResponse.json(
      { 
        error: "Failed to create region", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 