import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { bookings, customers } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Define schema for the request body
const RequestSchema = z.object({
  bookingId: z.string(),
  amount: z.number(),
  customerName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  eventTitle: z.string().optional(),
});

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

// Function to create PayPal order
async function createPayPalOrder(accessToken: string, amount: number, orderId: string, description: string) {
  const apiUrl = process.env.PAYPAL_API_URL;
  
  if (!apiUrl) {
    throw new Error("Missing PayPal API URL");
  }

  // Format amount for PayPal (2 decimal places)
  const formattedAmount = amount.toFixed(2);
  
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: orderId,
        description: description,
        amount: {
          currency_code: "THB",
          value: formattedAmount,
        },
      },
    ],
    application_context: {
      return_url: `${process.env.NEXTAUTH_URL}/api/checkout/paypal/callback`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout?canceled=true`,
      brand_name: "ThaiBoxingHub",
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
    },
  };

  const response = await fetch(`${apiUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PayPal create order error:", errorText);
    throw new Error(`Failed to create PayPal order: ${response.status}`);
  }

  return await response.json();
}

export async function POST(request: NextRequest) {
  try {
    // Check required environment variables
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET || !process.env.PAYPAL_API_URL) {
      console.error("Missing PayPal configuration. Please check environment variables.");
      return NextResponse.json(
        { error: "Missing payment gateway configuration" },
        { status: 500 }
      );
    }

    // Parse and validate the request body
    const body = await request.json() as Record<string, unknown>;
    console.log("Received request to initiate PayPal payment:", body);
    
    const validatedData = RequestSchema.parse(body);
    const { bookingId, amount, customerName, email, phone, eventTitle } = validatedData;

    // Fetch the booking to ensure it exists
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // STEP 1: Ensure customer information is saved/updated
    console.log(`Ensuring customer information is saved for booking ${bookingId}`);
    
    // Check if customer exists and update information
    const customerExists = await db.query.customers.findFirst({
      where: eq(customers.id, booking.customerId)
    });
    
    if (customerExists) {
      // Update customer information
      await db
        .update(customers)
        .set({ 
          name: customerName,
          email: email,
          phone: phone || null,
          updatedAt: new Date()
        })
        .where(eq(customers.id, booking.customerId));
      
      console.log(`Updated customer information for ${booking.customerId}`);
    } else {
      console.error(`Customer ${booking.customerId} not found for booking ${bookingId}`);
      return NextResponse.json(
        { error: "Customer record not found" },
        { status: 404 }
      );
    }
    
    // Update booking snapshot information
    await db
      .update(bookings)
      .set({ 
        customerNameSnapshot: customerName,
        customerEmailSnapshot: email,
        customerPhoneSnapshot: phone || null
      })
      .where(eq(bookings.id, bookingId));
    
    console.log(`Updated booking snapshot information for ${bookingId}`);

    // STEP 2: Now update booking status to 'processing'
    await db
      .update(bookings)
      .set({ 
        paymentStatus: "PROCESSING",
      })
      .where(eq(bookings.id, bookingId));
    
    console.log(`Updated booking ${bookingId} status to PROCESSING`);

    // STEP 3: Generate order ID
    const alphaNumericId = bookingId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6);
    const timestamp = Date.now().toString().slice(-10);
    const orderId = `PP${alphaNumericId}${timestamp}`;
    
    // Update payment order number in booking
    await db
      .update(bookings)
      .set({ paymentOrderNo: orderId })
      .where(eq(bookings.id, bookingId));
    
    console.log(`Set PayPal order ID ${orderId} for booking ${bookingId}`);

    // STEP 4: Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    console.log("Obtained PayPal access token");

    // STEP 5: Create PayPal order
    const description = eventTitle || `Booking for event ${booking.eventId}`;
    const paypalOrder = await createPayPalOrder(accessToken, amount, orderId, description);
    console.log("Created PayPal order:", paypalOrder.id);

    // STEP 6: Find the approval URL
    const approvalLink = paypalOrder.links.find((link: { rel: string }) => link.rel === "approve");
    if (!approvalLink) {
      throw new Error("No approval URL found in PayPal response");
    }

    // Return the approval URL
    return NextResponse.json({
      paymentUrl: approvalLink.href,
    });
  } catch (error) {
    console.error("Error processing PayPal payment request:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process payment request", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 