import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Define a schema for the request body
const RequestSchema = z.object({
  bookingId: z.string(),
  status: z.string(),
  orderNo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    console.log("Received request to update booking status:", body);
    
    const validatedData = RequestSchema.parse(body);
    const { bookingId, status, orderNo } = validatedData;

    // Update booking status
    const updateResult = await db
      .update(bookings)
      .set({ 
        paymentStatus: status,
        ...(orderNo ? { paymentOrderNo: orderNo } : {})  // Only add orderNo if provided
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    
    console.log(`Updated booking ${bookingId} status to ${status}:`, updateResult);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating booking status:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update booking status" },
      { status: 500 }
    );
  }
} 