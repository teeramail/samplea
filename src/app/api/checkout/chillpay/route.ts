import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { bookings, customers } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

// 1) Validate incoming JSON
const RequestSchema = z.object({
  bookingId: z.string(),
  amount: z.number(),
  customerName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  eventTitle: z.string().optional(),
});

// 2) Define payload shape for ChillPay
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

export async function POST(request: NextRequest) {
  try {
    // a) Check env
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
        { error: "Missing ChillPay config" },
        { status: 500 }
      );
    }
    const md5Secret = CHILLPAY_MD5_SECRET.trim();

    // b) Parse + validate
    const body = (await request.json()) as unknown;
    const { bookingId, amount, customerName, email, phone, eventTitle } =
      RequestSchema.parse(body);

    // c) Load booking & customer
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });
    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // d) Update snapshots & status
    await db
      .update(bookings)
      .set({
        customerNameSnapshot: customerName,
        customerEmailSnapshot: email,
        customerPhoneSnapshot: phone ?? null,
        paymentStatus: "PROCESSING",
      })
      .where(eq(bookings.id, bookingId));

    // e) Build OrderNo
    const alpha = bookingId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
    const ts = Date.now().toString().slice(-10);
    const orderNo = `CP${alpha}${ts}`;
    await db
      .update(bookings)
      .set({ paymentOrderNo: orderNo })
      .where(eq(bookings.id, bookingId));

    // f) Prepare URLs
    const origin = request.headers.get("origin") ?? "https://thaiboxinghub.com";
    const returnUrl = `${origin}/api/checkout/chillpay/callback`;
    const notifyUrl = `${origin}/api/checkout/chillpay/webhook`;

    // g) Assemble ChillPay payload
    const payload: ChillPayPayload = {
      MerchantCode: CHILLPAY_MERCHANT_CODE,
      OrderNo: orderNo,
      CustomerId: booking.customerId,
      Amount: Math.round(amount * 100).toString(),
      Description: eventTitle ?? `Booking ${bookingId}`,
      PhoneNumber: "0815350971",
      CustEmail: email,
      ApiKey: CHILLPAY_API_KEY,
      ReturnUrl: returnUrl,
      NotifyUrl: notifyUrl,
      LangCode: "EN",
      ChannelCode: "creditcard",
      RouteNo: "1",
      Currency: "764",
      IPAddress: "127.0.0.1",
    };

    // h) Compute checksum
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

    // i) Post to ChillPay
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

    // j) Return paymentUrl or error
    if (data.Status === 0 && data.Code === 200 && data.PaymentUrl) {
      return NextResponse.json({ paymentUrl: data.PaymentUrl });
    } else {
      await db
        .update(bookings)
        .set({ paymentStatus: "PENDING" })
        .where(eq(bookings.id, bookingId));
      return NextResponse.json(
        {
          error: data.Message || "ChillPay init failed",
          code: data.Code,
          status: data.Status,
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Checkout/chillpay error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
