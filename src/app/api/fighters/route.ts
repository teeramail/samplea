import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "~/server/db";
import { fighters } from "~/server/db/schema";

const fighterSchema = z.object({
  name: z.string().min(2),
  nickname: z.string().optional(),
  weightClass: z.string().optional(),
});

export async function GET() {
  try {
    const allFighters = await db.query.fighters.findMany({
      orderBy: (fighters, { asc }) => [asc(fighters.name)],
    });

    return NextResponse.json(allFighters);
  } catch (error) {
    console.error("Error getting fighters:", error);
    return NextResponse.json(
      { error: "Failed to get fighters" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as z.infer<typeof fighterSchema>;

    const validation = fighterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid fighter data", details: validation.error.errors },
        { status: 400 },
      );
    }

    const newFighter = await db
      .insert(fighters)
      .values({
        id: uuidv4(),
        name: body.name,
        nickname: body.nickname ?? null,
        weightClass: body.weightClass ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newFighter[0], { status: 201 });
  } catch (error) {
    console.error("Error creating fighter:", error);

    return NextResponse.json(
      { error: "Failed to create fighter" },
      { status: 500 },
    );
  }
}
