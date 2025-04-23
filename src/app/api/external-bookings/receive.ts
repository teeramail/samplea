// src/app/api/external-bookings/receive.ts
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { bookings, customers } from "~/server/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import crypto from "crypto";
import { eq } from "drizzle-orm";

// 1) Define incoming payload schema:
const RequestSchema = z.object({
  bookingId: z.string(),
  amount: z.string().or(z.number().transform(n => n)).transform(val => parseFloat(val as any)),
  customerName: z.string(),
  email: z.string().email(),
  phone: z.string().optional().or(z.string()),
  eventTitle: z.string().optional(),
  seats: z.string().transform(s => JSON.parse(s as string)),
  eventId: z.string().optional(),
  eventDate: z.string().optional(),
  venueName: z.string().optional(),
  venueId: z.string().optional(),
});

// 2) ChillPay config from env:
const {
  CHILLPAY_MERCHANT_CODE,
  CHILLPAY_API_KEY,
  CHILLPAY_API_ENDPOINT,
  CHILLPAY_MD5_SECRET,
} = process.env;

// 3) Shared handler:
async function handleBooking(input: unknown) {
  try {
    console.log("Processing booking request:", input);
    
    const {
      bookingId,
      amount,
      customerName,
      email,
      phone,
      eventTitle,
      seats,
      eventId,
      eventDate,
      venueName,
      venueId,
    } = RequestSchema.parse(input);
    
    console.log("Parsed data:", { bookingId, amount, customerName, email });

    // Create internal booking row
    const internalId = createId();
    
    // Create a customer record first
    const customerId = createId();
    console.log("Creating customer with ID:", customerId);
    
    try {
      await db.insert(customers).values({
        id: customerId,
        name: customerName,
        email: email,
        phone: phone || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (customerErr) {
      console.error("Error creating customer:", customerErr);
      // Continue anyway - the booking is more important
    }
    
    console.log("Inserting booking with ID:", internalId);
    
    // Insert booking record
    await db.insert(bookings).values({
      id: internalId,
      eventId: eventId || "default-event-id", // Required field, provide default if missing
      customerId: customerId, // Required field
      totalAmount: amount,
      paymentStatus: "PROCESSING",
      paymentOrderNo: bookingId,
      customerNameSnapshot: customerName,
      customerEmailSnapshot: email,
      customerPhoneSnapshot: phone || null,
      eventTitleSnapshot: eventTitle || null,
      eventDateSnapshot: eventDate ? new Date(eventDate) : null,
      venueNameSnapshot: venueName || null,
      regionNameSnapshot: null, // Add this required field with null value
      bookingItemsJson: JSON.stringify(seats),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log("Booking inserted successfully");

    // Prepare ChillPay payload
    // Use a fixed origin since we don't have access to the request object here
    const origin = new URL("https://teeonedwinsurf.com").origin;
    const payload: Record<string, string> = {
      MerchantCode: CHILLPAY_MERCHANT_CODE!,
      OrderNo: bookingId,
      CustomerId: bookingId,
      Amount: Math.round(amount * 100).toString(),
      Description: `Tickets for ${eventTitle || 'Event Tickets'}`,
      PhoneNumber: phone || "0000000000",
      CustEmail: email,
      ApiKey: CHILLPAY_API_KEY!,
      ReturnUrl: `${origin}/checkout/payment-result?bookingId=${internalId}`,
      NotifyUrl: `${origin}/api/checkout/chillpay/webhook`,
      LangCode: "EN",
      ChannelCode: "creditcard",
      RouteNo: "1",
      Currency: "764",
      IPAddress: "127.0.0.1",
    };

    // Compute MD5 checksum
    const chkStr = [
      payload.MerchantCode,
      payload.OrderNo,
      payload.CustomerId,
      payload.Amount,
      payload.PhoneNumber,
      payload.Description,
      payload.ChannelCode,
      payload.Currency,
      payload.LangCode,
      payload.RouteNo,
      payload.IPAddress,
      payload.ApiKey,
      payload.CustEmail,
      CHILLPAY_MD5_SECRET,
    ].join("");
    payload.CheckSum = crypto.createHash("md5").update(chkStr).digest("hex");

    // Call ChillPay
    console.log("Calling ChillPay API with payload:", payload);
    const form = new URLSearchParams(payload);
    const cpRes = await fetch(CHILLPAY_API_ENDPOINT!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const text = await cpRes.text();
    console.log("ChillPay API response text:", text);
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse ChillPay response:", e);
      throw new Error("Invalid response from payment gateway");
    }

    if (data.Status === 0 && data.Code === 200 && data.PaymentUrl) {
      console.log("ChillPay payment URL generated:", data.PaymentUrl);
      return { internalId, paymentUrl: data.PaymentUrl };
    } else {
      console.error("ChillPay API error:", data);
      await db
        .update(bookings)
        .set({ paymentStatus: "PENDING" })
        .where(eq(bookings.id, internalId));
      throw new Error(data.Message || "ChillPay init failed");
    }
  } catch (error) {
    console.error("Error in handleBooking:", error);
    throw error;
  }
}

// 4) GET handler for simple-URL callers:
export async function GET(request: Request) {
  try {
    console.log("GET request received");
    const url = new URL(request.url);
    const input = Object.fromEntries(url.searchParams.entries());
    console.log("GET params:", input);
    const { internalId, paymentUrl } = await handleBooking(input);
    console.log("Redirecting to:", paymentUrl);
    return NextResponse.redirect(paymentUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// 5) POST handler for JSON callers:
export async function POST(request: Request) {
  try {
    console.log("POST request received");
    const body = await request.json();
    console.log("POST body:", body);
    const { internalId, paymentUrl } = await handleBooking(body);
    console.log("Returning JSON with paymentUrl:", paymentUrl);
    return NextResponse.json({ internalId, paymentUrl });
  } catch (err: any) {
    console.error("Error in POST handler:", err);
    return NextResponse.json({
      error: err.message,
      details: "Check server logs for more information"
    }, { status: 400 });
  }
}