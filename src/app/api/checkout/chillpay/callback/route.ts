// import { NextResponse } from "next/server"; // Unused
// import { redirect } from "next/navigation"; // Unused

import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// ChillPay sends various parameters back to the merchant's server
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
  
  console.log("ChillPay Payment Result:", { 
    status, code, message, transactionId, amount, orderNo, customerId, bookingId 
  });
  
  // Validate the payment was successful
  const isSuccess = status === '0' && code === '200';

  try {
    // Update the booking status in database
    if (bookingId) {
      await db.update(bookings)
        .set({ 
          paymentStatus: isSuccess ? 'COMPLETED' : 'FAILED',
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId));
      
      console.log(`Updated booking ${bookingId} status to ${isSuccess ? 'COMPLETED' : 'FAILED'}`);
    }
    
    // For a production application, you should:
    // 1. Send confirmation emails to the customer
    // 2. Update ticket status
    // 3. Log detailed payment information
    
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
    console.error("Error processing ChillPay callback:", error);
    
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