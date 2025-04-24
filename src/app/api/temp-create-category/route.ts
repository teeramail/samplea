import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { categories } from "~/server/db/schema";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Basic validation
    if (!data.name || !data.slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }
    
    // Check if slug is unique
    const existingWithSlug = await db
      .select({ id: categories.id })
      .from(categories)
      .where(categories.slug === data.slug)
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
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      thumbnailUrl: data.thumbnailUrl || null,
      imageUrls: data.imageUrls || [],
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
