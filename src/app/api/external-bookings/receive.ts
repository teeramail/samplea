import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { bookings, customers, events } from "~/server/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

// Validate incoming request data from thaiboxinghub.com
const RequestSchema = z.object({
  bookingId: z.string(), // External booking ID from thaiboxinghub.com
  amount: z.number().or(z.string().transform(val => parseFloat(val))), // Total amount
  customerName: z.string(), // Customer name
  email: z.string().email(), // Customer email
  phone: z.string().optional(), // Customer phone
  eventTitle: z.string(), // Event title
  seats: z.string().transform(val => {
    try {
      return JSON.parse(val);
    } catch (e) {
      return [];
    }
  }).or(z.array(z.object({
    quantity: z.number().optional(),
    seatType: z.string().optional(),
    pricePaid: z.number().optional(),
    costAtBooking: z.any().optional()
  }))), // Seat information
  eventId: z.string().optional(), // Optional: our internal event ID if available
  eventDate: z.string().optional(), // Optional: event date
  venueId: z.string().optional(), // Optional: venue ID
  venueName: z.string().optional(), // Optional: venue name
  regionId: z.string().optional(), // Optional: region ID
  regionName: z.string().optional(), // Optional: region name
});

// ChillPay payload interface
interface ChillPayPayload {
  MerchantCode: string;
  OrderNo: string;
  CustomerId: string;
  Amount: string;
  Description: string;
  PhoneNumber: string;
  CustEmail: string;
  ApiKey: string;
  ReturnUrl: string;
  NotifyUrl: string;
  LangCode: string;
  ChannelCode: string;
  RouteNo: string;
  Currency: string;
  IPAddress: string;
  CheckSum?: string;
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log("Received data from thaiboxinghub.com:", body);

    // Validate the request data
    const {
      bookingId: externalBookingId,
      amount,
      customerName,
      email,
      phone,
      eventTitle,
      seats,
      eventId: providedEventId,
      eventDate,
      venueName,
      regionName,
    } = RequestSchema.parse(body);

    // Check environment variables for ChillPay
    const {
      CHILLPAY_MERCHANT_CODE,
      CHILLPAY_API_KEY,
      CHILLPAY_MD5_SECRET,
      CHILLPAY_API_ENDPOINT,
    } = process.env;
    
    if (
      !CHILLPAY_MERCHANT_CODE ||
      !CHILLPAY_API_KEY ||
      !CHILLPAY_MD5_SECRET ||
      !CHILLPAY_API_ENDPOINT
    ) {
      return NextResponse.json(
        { error: "Missing ChillPay configuration" },
        { status: 500 }
      );
    }
    
    const md5Secret = CHILLPAY_MD5_SECRET.trim();

    // Find or create customer
    let customerId;
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.email, email),
    });

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update customer info
      await db
        .update(customers)
        .set({
          name: customerName,
          phone: phone ?? existingCustomer.phone,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, customerId));
    } else {
      // Create new customer
      customerId = createId();
      await db.insert(customers).values({
        id: customerId,
        name: customerName,
        email,
        phone: phone ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Find event by title if eventId not provided
    let eventId = providedEventId;
    if (!eventId && eventTitle) {
      const event = await db.query.events.findFirst({
        where: eq(events.title, eventTitle),
      });
      
      if (event) {
        eventId = event.id;
      } else {
        // If no matching event found, return an error
        return NextResponse.json(
          { 
            error: "Event not found", 
            details: `No event found with title: ${eventTitle}` 
          },
          { status: 404 }
        );
      }
    }

    // Create a unique order number for ChillPay
    const alpha = externalBookingId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
    const ts = Date.now().toString().slice(-10);
    const orderNo = `CP${alpha}${ts}`;

    // Create booking in our system
    const bookingId = createId();
    await db.insert(bookings).values({
      id: bookingId,
      customerId,
      eventId: eventId!,
      totalAmount: typeof amount === 'string' ? parseFloat(amount) : amount,
      paymentStatus: "PROCESSING", // Set to PROCESSING as we're initiating payment
      paymentOrderNo: orderNo, // Store ChillPay order number
      customerNameSnapshot: customerName,
      customerEmailSnapshot: email,
      customerPhoneSnapshot: phone ?? null,
      eventTitleSnapshot: eventTitle,
      eventDateSnapshot: eventDate ? new Date(eventDate) : null,
      venueNameSnapshot: venueName ?? null,
      regionNameSnapshot: regionName ?? null,
      bookingItemsJson: seats, // Store seat details in JSON field
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Prepare URLs for ChillPay
    const origin = new URL(request.url).origin;
    const returnUrl = `${origin}/api/checkout/chillpay/callback`;
    const notifyUrl = `${origin}/api/checkout/chillpay/webhook`;

    // Prepare ChillPay payload
    const payload: ChillPayPayload = {
      MerchantCode: CHILLPAY_MERCHANT_CODE,
      OrderNo: orderNo,
      CustomerId: customerId,
      Amount: Math.round((typeof amount === 'string' ? parseFloat(amount) : amount) * 100).toString(),
      Description: `Tickets for ${eventTitle}`,
      PhoneNumber: phone ?? "0000000000",
      CustEmail: email,
      ApiKey: CHILLPAY_API_KEY,
      ReturnUrl: returnUrl,
      NotifyUrl: notifyUrl,
      LangCode: "EN",
      ChannelCode: "creditcard", // Direct to credit card payment
      RouteNo: "1",
      Currency: "764", // THB
      IPAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
    };

    // Compute checksum for ChillPay
    const chkStr =
      payload.MerchantCode +
      payload.OrderNo +
      payload.CustomerId +
      payload.Amount +
      payload.PhoneNumber +
      payload.Description +
      payload.ChannelCode +
      payload.Currency +
      payload.LangCode +
      payload.RouteNo +
      payload.IPAddress +
      payload.ApiKey +
      payload.CustEmail +
      md5Secret;
    
    payload.CheckSum = crypto.createHash("md5").update(chkStr).digest("hex");

    // Post to ChillPay to initialize payment
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => params.append(k, v));
    
    const cpRes = await fetch(CHILLPAY_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    
    const text = await cpRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON from ChillPay: " + text);
    }

    // Handle ChillPay response
    if (data.Status === 0 && data.Code === 200 && data.PaymentUrl) {
      // Return success with payment URL
      return NextResponse.json({
        success: true,
        message: "Booking created and payment initiated",
        bookingId,
        externalBookingId,
        paymentUrl: data.PaymentUrl,
      });
    } else {
      // Update booking status back to PENDING if payment initialization failed
      await db
        .update(bookings)
        .set({ paymentStatus: "PENDING" })
        .where(eq(bookings.id, bookingId));
      
      return NextResponse.json(
        {
          error: data.Message || "ChillPay payment initialization failed",
          code: data.Code,
          status: data.Status,
          bookingId, // Still return the booking ID for reference
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[API] Error processing external booking from thaiboxinghub:", error);
    
    return NextResponse.json(
      {
        error: "Failed to process booking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
