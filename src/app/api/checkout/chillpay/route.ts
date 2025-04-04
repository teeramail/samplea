import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
// import CryptoJS from 'crypto-js';
import { z } from "zod";
import crypto from 'crypto';

// Define a schema for the request body
const RequestSchema = z.object({
  bookingId: z.string(),
  amount: z.number(),
  email: z.string().email(),
  phone: z.string().optional(),
  eventTitle: z.string().optional(),
});

// Define the expected structure of the ChillPay API response
interface ChillPayResponse {
  Status: number; // Transaction result code (Order No. 1)
  Code: number;   // Explanation for transaction result (Order No. 2)
  Message: string; // Explanation for transaction result
  TransactionId?: number; // ChillPay Transaction Reference
  Amount?: number; // Payment Amount
  OrderNo?: string; // Merchant's Order number
  CustomerId?: string; // Customer Reference code
  ChannelCode?: string; // Response code for the bank that received payment
  ReturnUrl?: string; // URL displayed when the user completes the transaction
  PaymentUrl?: string; // URL to redirect the user to the bank's payment page
  IPAddress?: string; // IP Address of the customer
  Token?: string; // Token code for reference list
  CreatedDate?: string; // Transaction date YYYYMMDDHHMMSS
  ExpiredDate?: string; // Expiration date YYYYMMDDHHMMSS
  // Add other potential fields if needed
}

// Define ChillPay payload interface to help with typing
interface ChillPayPayload {
  MerchantCode: string;
  OrderNo: string;
  CustomerId: string;
  Amount: string; // Changed to string to fix type error
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
  IPAddress: string; // Add IP Address field
  CheckSum?: string; // Optional as we'll add it later
}

export async function POST(request: NextRequest) {
  try {
    // Log environment variables for debugging
    console.log("ChillPay Configuration:", {
      merchantCode: process.env.CHILLPAY_MERCHANT_CODE ? "Set" : "Not set",
      apiKey: process.env.CHILLPAY_API_KEY ? "Set" : "Not set",
      md5Secret: process.env.CHILLPAY_MD5_SECRET ? "Set (length: " + process.env.CHILLPAY_MD5_SECRET?.length + ")" : "Not set",
      apiEndpoint: process.env.CHILLPAY_API_ENDPOINT ?? "Not set",
    });

    // Check required environment variables
    if (!process.env.CHILLPAY_MERCHANT_CODE || !process.env.CHILLPAY_API_KEY || !process.env.CHILLPAY_MD5_SECRET || !process.env.CHILLPAY_API_ENDPOINT) {
      console.error("Missing ChillPay configuration. Please check environment variables.");
      return NextResponse.json(
        { error: "Missing payment gateway configuration" },
        { status: 500 }
      );
    }

    // Clean the MD5 secret by removing newlines and spaces
    const cleanedMd5Secret = process.env.CHILLPAY_MD5_SECRET.trim();

    // Parse and validate the request body
    const body = await request.json() as Record<string, unknown>;
    console.log("Received request to initiate ChillPay payment:", body);
    
    const validatedData = RequestSchema.parse(body);
    const { bookingId, amount, email, phone, eventTitle } = validatedData;

    // Always use the company phone number for ChillPay to avoid format issues
    const companyPhoneNumber = "0815350971";
    console.log("Using company phone number for ChillPay:", companyPhoneNumber);

    // Fetch the booking to ensure it exists and get more details if needed
    const booking = await db.query.bookings.findFirst({
      where: and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "PENDING")),
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or already processed" },
        { status: 404 }
      );
    }

    // Update booking status to 'processing'
    const updateResult = await db
      .update(bookings)
      .set({ paymentStatus: "PROCESSING" })
      .where(eq(bookings.id, bookingId))
      .returning();
    
    console.log("Updated booking status to processing:", updateResult);

    // Get the origin to use for return URL
    const origin = request.headers.get("origin") ?? "http://localhost:3000";
    
    // Prepare return and callback URLs
    const returnUrl = `${origin}/events/${booking.eventId}?payment=success`;
    const callbackUrl = `${origin}/api/checkout/chillpay/callback`;

    // Format amount properly (cents/satang)
    const formattedAmount = Math.round(amount * 100);
    
    // Generate a unique order ID using the booking ID and timestamp
    // Format: CP + first 6 chars of alphanumeric booking ID + timestamp slice (20 chars max)
    const alphaNumericId = bookingId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6);
    const timestamp = Date.now().toString().slice(-10);
    const orderId = `CP${alphaNumericId}${timestamp}`;
    console.log("Generated OrderNo:", orderId, "Length:", orderId.length);
    
    // Get client IP address
    const clientIP = request.headers.get('x-forwarded-for') ?? 
                    request.headers.get('x-real-ip') ?? 
                    '127.0.0.1';
                    
    console.log("Client IP address:", clientIP);

    // Prepare the payload for ChillPay
    const payload: ChillPayPayload = {
      MerchantCode: process.env.CHILLPAY_MERCHANT_CODE,
      OrderNo: orderId,
      CustomerId: booking.customerId,
      Amount: formattedAmount.toString(),
      Description: eventTitle ?? `Booking for event ${booking.eventId}`,
      PhoneNumber: companyPhoneNumber,
      CustEmail: email,
      ApiKey: process.env.CHILLPAY_API_KEY,
      ReturnUrl: returnUrl,
      NotifyUrl: callbackUrl,
      LangCode: "EN",
      ChannelCode: "creditcard",
      RouteNo: "1",
      Currency: "764",
      IPAddress: clientIP,
    };

    // Calculate checksum
    // According to ChillPay docs, the checksum should include ALL these fields in this exact order:
    // MerchantCode + OrderNo + CustomerId + Amount + PhoneNumber + Description + ChannelCode + 
    // Currency + LangCode + RouteNo + IPAddress + ApiKey + TokenFlag + CreditToken + CreditMonth + 
    // ShopID + ProductImageUrl + CustEmail + CardType + MD5 Secret Key
    
    // Include empty strings for optional fields we're not using
    const tokenFlag = "N"; // N means pay without token (default)
    const creditToken = "";
    const creditMonth = "";
    const shopID = "";
    const productImageUrl = "";
    const cardType = "";
    
    const checksumString = `${payload.MerchantCode}${payload.OrderNo}${payload.CustomerId}${payload.Amount}${payload.PhoneNumber}${payload.Description}${payload.ChannelCode}${payload.Currency}${payload.LangCode}${payload.RouteNo}${payload.IPAddress}${payload.ApiKey}${tokenFlag}${creditToken}${creditMonth}${shopID}${productImageUrl}${payload.CustEmail}${cardType}${cleanedMd5Secret}`;
    
    console.log("Checksum string components:", {
      merchantCode: payload.MerchantCode,
      orderNo: payload.OrderNo,
      customerId: payload.CustomerId,
      amount: payload.Amount,
      phoneNumber: payload.PhoneNumber,
      description: payload.Description.substring(0, 10) + "...", // Show part of description
      channelCode: payload.ChannelCode,
      currency: payload.Currency,
      langCode: payload.LangCode,
      routeNo: payload.RouteNo,
      ipAddress: payload.IPAddress,
      tokenFlag,
      email: payload.CustEmail,
      apiKey: payload.ApiKey.substring(0, 10) + "...", // Only show part of API key
      md5Secret: cleanedMd5Secret.substring(0, 10) + "..." // Only log first few chars for security
    });
    
    console.log("Checksum string:", checksumString.substring(0, 50) + "..."); // Only log beginning for security
    
    const checksum = crypto
      .createHash("md5")
      .update(checksumString)
      .digest("hex");
    
    console.log("Calculated checksum:", checksum);
    
    // Add checksum to payload
    payload.CheckSum = checksum;
    
    console.log("Sending request to ChillPay API with payload:", payload);

    // Create URLSearchParams manually to avoid type issues
    const params = new URLSearchParams();
    // Add all payload properties to params
    Object.entries(payload).forEach(([key, value]) => {
      params.append(key, value);
    });
    
    const chillPayResponse = await fetch(process.env.CHILLPAY_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: params.toString(),
    });

    // Get the raw response for logging
    const responseText = await chillPayResponse.text();
    console.log("ChillPay API raw response:", responseText);

    // Parse the response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error("Error parsing ChillPay response:", error);
      return NextResponse.json(
        { 
          error: "Error processing payment gateway response",
          details: "Invalid JSON response from payment gateway"
        },
        { status: 500 }
      );
    }

    // Check if the response indicates success
    if (responseData.Status === 0 && responseData.Code === 200) {
      // Payment initiated successfully
      return NextResponse.json({
        paymentUrl: responseData.PaymentUrl,
      });
    } else {
      // Payment initiation failed
      // Update booking status back to pending
      await db
        .update(bookings)
        .set({ paymentStatus: "PENDING" })
        .where(eq(bookings.id, bookingId));
      
      // Return detailed error information
      return NextResponse.json(
        { 
          error: "Failed to initiate payment",
          details: responseData.Message || "Unknown error from payment gateway",
          code: responseData.Code,
          status: responseData.Status
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing ChillPay payment request:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process payment request" },
      { status: 500 }
    );
  }
} 