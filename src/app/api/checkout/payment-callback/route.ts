import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// POST /api/checkout/payment-callback
// This endpoint handles payment callbacks from various payment providers
// Currently supports: ModernPay
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Get URL parameters
    const url = new URL(request.url);
    const params = url.searchParams;
    const source = params.get('source'); // Payment source (modernpay, etc.)
    const bookingId = params.get('bookingId');
    
    console.log(`[Payment Callback] Received callback from ${source}:`, {
      bookingId,
      body
    });
    
    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId parameter" },
        { status: 400 }
      );
    }
    
    // Handle different payment providers
    if (source === 'modernpay') {
      // Extract ModernPay specific data
      const {
        status,
        transactionId,
        amount,
        paymentMethod,
        bankCode,
        bankRefCode,
        paymentDate
      } = body;
      
      // Determine if payment was successful
      const isSuccess = status === 'success' || status === '0';
      
      // Update booking status
      await db.update(bookings)
        .set({
          paymentStatus: isSuccess ? "COMPLETED" : "FAILED",
          paymentTransactionId: transactionId,
          paymentMethod: paymentMethod || 'modernpay',
          paymentBankCode: bankCode,
          paymentBankRefCode: bankRefCode,
          paymentDate: paymentDate,
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId));
      
      console.log(`[Payment Callback] Updated booking ${bookingId} status to ${isSuccess ? 'COMPLETED' : 'FAILED'}`);
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: `Payment ${isSuccess ? 'completed' : 'failed'} and booking updated`,
        bookingId
      });
    } else {
      // Unknown payment source
      return NextResponse.json(
        { error: `Unknown payment source: ${source}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[Payment Callback] Error processing payment callback:", error);
    return NextResponse.json(
      { error: "Failed to process payment callback" },
      { status: 500 }
    );
  }
}

// GET handler for testing and redirect purposes
export async function GET(request: Request) {
  // Get URL parameters
  const url = new URL(request.url);
  const params = url.searchParams;
  const source = params.get('source');
  const bookingId = params.get('bookingId');
  const status = params.get('status') || 'success'; // Default to success for testing
  
  console.log(`[Payment Callback] Received GET request from ${source}:`, {
    bookingId,
    status
  });
  
  if (!bookingId) {
    return NextResponse.json(
      { error: "Missing bookingId parameter" },
      { status: 400 }
    );
  }
  
  try {
    // Update booking status (for testing purposes)
    const isSuccess = status === 'success';
    
    await db.update(bookings)
      .set({
        paymentStatus: isSuccess ? "COMPLETED" : "FAILED",
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId));
    
    console.log(`[Payment Callback] Updated booking ${bookingId} status to ${isSuccess ? 'COMPLETED' : 'FAILED'}`);
    
    // Redirect to a success or failure page
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${url.origin}/checkout/payment-${isSuccess ? 'success' : 'failed'}?bookingId=${bookingId}`
      }
    });
  } catch (error) {
    console.error("[Payment Callback] Error processing payment callback:", error);
    return NextResponse.json(
      { error: "Failed to process payment callback" },
      { status: 500 }
    );
  }
}
