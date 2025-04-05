import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// Function to get PayPal access token
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const apiUrl = process.env.PAYPAL_API_URL;

  if (!clientId || !secret || !apiUrl) {
    throw new Error("Missing PayPal configuration");
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  
  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PayPal auth error:", errorText);
    throw new Error(`Failed to get PayPal access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Function to capture a PayPal payment
async function capturePayPalPayment(accessToken: string, orderId: string) {
  const apiUrl = process.env.PAYPAL_API_URL;
  
  if (!apiUrl) {
    throw new Error("Missing PayPal API URL");
  }

  const response = await fetch(`${apiUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "Prefer": "return=representation",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PayPal capture error:", errorText);
    throw new Error(`Failed to capture PayPal payment: ${response.status}`);
  }

  return await response.json();
}

// Handler for PayPal callbacks
export async function GET(request: Request) {
  // Get URL parameters from PayPal redirect
  const url = new URL(request.url);
  const params = url.searchParams;
  
  // Extract parameters
  const paypalOrderId = params.get('token');
  const paymentId = params.get('paymentId');
  const payerId = params.get('PayerID');
  
  // Log the callback parameters
  console.log("PayPal Callback Received:", { paypalOrderId, paymentId, payerId });
  
  if (!paypalOrderId) {
    console.error("Missing PayPal order ID in callback");
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${url.origin}/checkout/confirmation?paymentMethod=paypal&status=error&message=Missing+payment+information`
      }
    });
  }

  try {
    // Find the booking associated with this PayPal order
    // For this to work, we need to use reference_id from createPayPalOrder to match with our bookingId
    // For now, we'll assume bookings have the PayPal order ID stored in paymentOrderNo
    // In a real-world scenario, you might need a more robust way to link PayPal orders to your bookings
    
    // Get the access token
    const accessToken = await getPayPalAccessToken();
    
    // Capture the payment
    const captureResult = await capturePayPalPayment(accessToken, paypalOrderId);
    console.log("PayPal capture result:", captureResult);
    
    // Check if payment was successful
    const isSuccess = captureResult.status === "COMPLETED";
    
    // Extract booking reference (this depends on how you structured the PayPal order)
    // In this example, we assume the reference_id in the purchase unit is the booking ID
    const bookingId = captureResult.purchase_units[0]?.reference_id;
    
    if (bookingId) {
      // Update the booking status in the database
      await db.update(bookings)
        .set({ 
          paymentStatus: isSuccess ? 'COMPLETED' : 'FAILED',
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId));
      
      console.log(`Updated booking ${bookingId} status to ${isSuccess ? 'COMPLETED' : 'FAILED'}`);
    } else {
      console.error("Could not find booking ID in PayPal response");
    }
    
    // Redirect to the confirmation page
    const redirectBase = `${url.origin}/checkout/confirmation`;
    const redirectUrl = isSuccess 
      ? `${redirectBase}?paymentMethod=paypal&bookingId=${bookingId}&status=success` 
      : `${redirectBase}?paymentMethod=paypal&bookingId=${bookingId}&status=failed&message=Payment+processing+failed`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl
      }
    });
    
  } catch (error) {
    console.error("Error processing PayPal callback:", error);
    
    // Redirect to confirmation with error status
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${url.origin}/checkout/confirmation?paymentMethod=paypal&status=error&message=Payment+processing+error`
      }
    });
  }
} 