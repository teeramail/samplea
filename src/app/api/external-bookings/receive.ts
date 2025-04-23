// src/app/api/external-bookings/receive.ts
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
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

  // Create internal booking row
  const internalId = createId();
  await db.insert(bookings).values({
    id: internalId,
    eventId: eventId || null,
    totalAmount: amount,
    paymentStatus: "PROCESSING",
    paymentOrderNo: bookingId,
    customerNameSnapshot: customerName,
    customerEmailSnapshot: email,
    customerPhoneSnapshot: phone || null,
    eventTitleSnapshot: eventTitle || null,
    eventDateSnapshot: eventDate ? new Date(eventDate) : null,
    venueNameSnapshot: venueName || null,
    bookingItemsJson: JSON.stringify(seats),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Prepare ChillPay payload
  const origin = new URL(`https://dummy`).origin; // unused for server->server
  const payload: Record<string, string> = {
    MerchantCode: CHILLPAY_MERCHANT_CODE!,
    OrderNo: bookingId,
    CustomerId: bookingId,
    Amount: Math.round(amount * 100).toString(),
    Description: `Tickets for ${eventTitle}`,
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
  const form = new URLSearchParams(payload);
  const cpRes = await fetch(CHILLPAY_API_ENDPOINT!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const text = await cpRes.text();
  const data = JSON.parse(text);

  if (data.Status === 0 && data.Code === 200 && data.PaymentUrl) {
    return { internalId, paymentUrl: data.PaymentUrl };
  } else {
    // rollback or mark PENDING
    await db
      .update(bookings)
      .set({ paymentStatus: "PENDING" })
      .where(eq(bookings.id, internalId));
    throw new Error(data.Message || "ChillPay init failed");
  }
}

// 4) GET handler for simple-URL callers:
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = Object.fromEntries(url.searchParams.entries());
    const { internalId, paymentUrl } = await handleBooking(input);
    return NextResponse.redirect(paymentUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// 5) POST handler for JSON callers:
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { internalId, paymentUrl } = await handleBooking(body);
    return NextResponse.json({ internalId, paymentUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}