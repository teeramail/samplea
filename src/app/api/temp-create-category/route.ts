import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { categories } from "~/server/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { eq } from "drizzle-orm";

// Define the schema for category validation
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
  thumbnailUrl: z.union([
    z.string().url(),
    z.string().length(0),
    z.null(),
    z.undefined()
  ]),
  imageUrls: z.array(z.string().url()).max(8).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate input data using Zod
    const validationResult = categorySchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.message },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Check if slug is unique
    const existingWithSlug = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, validatedData.slug))
      .limit(1);

    if (existingWithSlug.length > 0) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 400 }
      );
    }
    
    // Create the category
    const newCategory = {
      id: createId(),
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description || null,
      thumbnailUrl: validatedData.thumbnailUrl || null,
      imageUrls: validatedData.imageUrls || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(categories).values(newCategory);
    
    return NextResponse.json({ success: true, category: newCategory });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
