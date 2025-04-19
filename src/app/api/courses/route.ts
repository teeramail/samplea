import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import {
  trainingCourses,
  regions,
  venues,
  instructors,
} from "~/server/db/schema";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { eq, desc, and, like } from "drizzle-orm";
import slugify from "slugify";

// Helper function to generate a URL-friendly slug from a title
const generateSlug = (title: string): string => {
  return slugify(title, {
    lower: true, // Convert to lowercase
    strict: true, // Strip special characters
    trim: true, // Trim leading and trailing whitespace
  });
};

// Validation schema for course creation
const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().nullable().optional(),
  skillLevel: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  scheduleDetails: z.string().nullable().optional(),
  price: z.number().positive("Price must be positive"),
  capacity: z
    .number()
    .int()
    .positive("Capacity must be a positive integer")
    .nullable()
    .optional(),
  venueId: z.string().nullable().optional(),
  regionId: z.string().min(1, "Region is required"),
  instructorId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  primaryImageIndex: z.number().int().min(0).default(0),
  imageUrls: z.array(z.string().url()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const regionId = url.searchParams.get("regionId");
    const instructorId = url.searchParams.get("instructorId");
    const featured = url.searchParams.get("featured") === "true";
    const limit = Number(url.searchParams.get("limit") || 100);

    // Build filter conditions
    const conditions = [];

    if (regionId) {
      conditions.push(eq(trainingCourses.regionId, regionId));
    }

    if (instructorId) {
      conditions.push(eq(trainingCourses.instructorId, instructorId));
    }

    if (featured) {
      conditions.push(eq(trainingCourses.isFeatured, true));
    }

    // Query the database
    const courses = await db.query.trainingCourses.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(trainingCourses.createdAt)],
      limit: limit,
      with: {
        region: true,
        venue: true,
        instructor: true,
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();

    // Validate the request body
    const validation = courseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 },
      );
    }

    const data = validation.data;
    const courseId = createId();

    // Generate slug from title
    const slug = generateSlug(data.title);

    try {
      // Verify that the region exists
      const region = await db.query.regions.findFirst({
        where: eq(regions.id, data.regionId),
      });

      if (!region) {
        return NextResponse.json(
          { error: "Region not found" },
          { status: 400 },
        );
      }

      // Verify venue if provided
      if (data.venueId && data.venueId !== "") {
        const venue = await db.query.venues.findFirst({
          where: eq(venues.id, data.venueId),
        });

        if (!venue) {
          return NextResponse.json(
            { error: "Venue not found" },
            { status: 400 },
          );
        }
      }

      // Verify instructor if provided
      if (data.instructorId && data.instructorId !== "") {
        const instructor = await db.query.instructors.findFirst({
          where: eq(instructors.id, data.instructorId),
        });

        if (!instructor) {
          return NextResponse.json(
            { error: "Instructor not found" },
            { status: 400 },
          );
        }
      }

      // Insert the course
      await db.insert(trainingCourses).values({
        id: courseId,
        title: data.title,
        slug: slug,
        description: data.description,
        skillLevel: data.skillLevel,
        duration: data.duration,
        scheduleDetails: data.scheduleDetails,
        price: data.price,
        capacity: data.capacity,
        venueId: data.venueId === "" ? null : data.venueId,
        regionId: data.regionId,
        instructorId: data.instructorId === "" ? null : data.instructorId,
        isActive: data.isActive,
        imageUrls: data.imageUrls,
        primaryImageIndex: data.primaryImageIndex,
        isFeatured: false, // Default to not featured
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Retrieve the newly created course
      const newCourse = await db.query.trainingCourses.findFirst({
        where: eq(trainingCourses.id, courseId),
        with: {
          region: true,
          venue: true,
          instructor: true,
        },
      });

      return NextResponse.json(newCourse, { status: 201 });
    } catch (dbError) {
      console.error("Database error when creating course:", dbError);

      return NextResponse.json(
        {
          error: "Database error",
          details:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error creating course:", error);

    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 },
    );
  }
}
