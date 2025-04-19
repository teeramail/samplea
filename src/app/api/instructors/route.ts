import { db } from "~/server/db";
import { instructors } from "~/server/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allInstructors = await db.query.instructors.findMany({
      orderBy: [desc(instructors.createdAt)],
    });

    return NextResponse.json(allInstructors);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructors" },
      { status: 500 },
    );
  }
}
