// import { NextResponse } from "next/server"; // Unused
// import { redirect } from "next/navigation"; // Unused

import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// ChillPay Customer Redirect Endpoint
// This endpoint handles when customers are redirected from ChillPay back to our site
export async function GET(request: Request) {
  // Get URL parameters from ChillPay redirect
  const url = new URL(request.url);
  const params = url.searchParams;
  
  // Extract payment result parameters
  const status = params.get('Status'); // 0 for success, non-zero for failure
  const code = params.get('Code');
  const message = params.get('Message');
  const transactionId = params.get('TransactionId');
  const amount = params.get('Amount');
  const orderNo = params.get('OrderNo'); // This is our bookingId
  const customerId = params.get('CustomerId');
  const bookingId = params.get('bookingId') ?? orderNo; 
  
  console.log("ChillPay Payment Redirect:", { 
    status, code, message, transactionId, amount, orderNo, customerId, bookingId 
  });
  
  // Validate the payment was successful
  const isSuccess = status === '0' && code === '200';

  try {
    // Note: We update the status here, but the webhook should be considered authoritative
    // This is just for user experience so they don't have to wait for the webhook
    if (bookingId) {
      await db.update(bookings)
        .set({ 
          paymentStatus: isSuccess ? 'COMPLETED' : 'FAILED',
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId));
      
      console.log(`[Redirect] Updated booking ${bookingId} status to ${isSuccess ? 'COMPLETED' : 'FAILED'}`);
    }
    
    // Redirect to the confirmation page with success or failure status
    const redirectBase = `${url.origin}/checkout/confirmation`;
    const redirectUrl = isSuccess 
      ? `${redirectBase}?paymentMethod=credit-card&bookingId=${bookingId}&status=success` 
      : `${redirectBase}?paymentMethod=credit-card&bookingId=${bookingId}&status=failed&message=${encodeURIComponent(message ?? 'Payment failed')}`;

    // Return a redirect response
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl
      }
    });
    
  } catch (error) {
    console.error("[Redirect] Error processing ChillPay redirect:", error);
    
    // Even if we have an error processing the result, redirect to confirmation
    // with error status so the user sees something
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${url.origin}/checkout/confirmation?paymentMethod=credit-card&bookingId=${bookingId}&status=error&message=Internal+server+error`
      }
    });
  }
}

// For backward compatibility: handle simple status notifications
// This should not be used for background notifications; use webhook endpoint instead
export async function POST(request: Request) {
  console.warn("⚠️ Received POST to /callback endpoint - should use /webhook endpoint instead");
  
  try {
    // Parse the POST data 
    const formData = await request.formData();
    console.log("Received POST to callback endpoint:", Object.fromEntries(formData.entries()));
    
    // Extract status and orderNo with safe type handling
    const statusValue = formData.get('status');
    const status = statusValue === null || statusValue === undefined 
      ? undefined 
      : typeof statusValue === 'string' 
        ? statusValue 
        : typeof statusValue === 'object'
          ? JSON.stringify(statusValue)
          : String(statusValue);
        
    const orderNoValue = formData.get('orderNo');
    const orderNo = orderNoValue === null || orderNoValue === undefined 
      ? undefined 
      : typeof orderNoValue === 'string' 
        ? orderNoValue 
        : typeof orderNoValue === 'object'
          ? JSON.stringify(orderNoValue)
          : String(orderNoValue);
    
    if (!orderNo) {
      return NextResponse.json({ 
        status: "error", 
        message: "Missing orderNo parameter" 
      }, { status: 400 });
    }
    
    if (status === 'cancel') {
      // If customer cancelled, update booking status
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.paymentOrderNo, orderNo),
      });
      
      if (booking) {
        await db.update(bookings)
          .set({ 
            paymentStatus: 'CANCELLED',
            updatedAt: new Date()
          })
          .where(eq(bookings.id, booking.id));
        
        console.log(`[Callback] Updated booking ${booking.id} status to CANCELLED`);
      }
    }
    
    // Return 200 to acknowledge receipt
    return NextResponse.json({ status: "success" }, { status: 200 });
    
  } catch (error) {
    console.error("[Callback] Error handling fallback notification:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
} 