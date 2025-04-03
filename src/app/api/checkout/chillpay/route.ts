import { NextResponse } from "next/server";
// Remove problematic database imports for now
// import { db } from "@/server/db";
// import { bookings } from "@/server/db/schema";
// import { eq } from "drizzle-orm";
// import CryptoJS from 'crypto-js';
import { z } from "zod";
import crypto from 'crypto';

const chillpayRequestSchema = z.object({
  bookingId: z.string(),
  amount: z.number(),
  email: z.string().email(),
  phone: z.string().optional(),
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


export async function POST(request: Request) {
  const {
    CHILLPAY_MERCHANT_CODE,
    CHILLPAY_API_KEY,
    CHILLPAY_MD5_SECRET,
    CHILLPAY_API_ENDPOINT_SANDBOX, // Use sandbox for testing
    // CHILLPAY_API_ENDPOINT_PRODUCTION, // Use production when ready
  } = process.env;

  if (!CHILLPAY_MERCHANT_CODE || !CHILLPAY_API_KEY || !CHILLPAY_MD5_SECRET || !CHILLPAY_API_ENDPOINT_SANDBOX) {
    console.error("ChillPay environment variables are not set");
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  let validatedData;
  try {
    const body = await request.json();
    // Update validation to match the fields we send from frontend
    validatedData = chillpayRequestSchema.parse(body);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body", details: error }, { status: 400 });
  }

  const { bookingId, amount, email, phone } = validatedData;

  try {
    // Instead of fetching from DB, we'll use the data passed from frontend
    // 2. Prepare ChillPay Request Data
    const merchantCode = CHILLPAY_MERCHANT_CODE;
    const orderNo = bookingId;
    // ChillPay requires amount without decimals (e.g., ฿250.00 becomes 25000)
    const amountFormatted = Math.round(amount * 100);
    const custEmail = email;
    const phoneNumber = phone ?? '';
    const apiKey = CHILLPAY_API_KEY;
    const langCode = "EN"; // Or "TH"
    const description = `Booking ${orderNo}`; // Optional description
    
    // ReturnUrl is where ChillPay will redirect the user after payment
    const returnUrl = `${request.headers.get('origin')}/api/checkout/chillpay/callback?bookingId=${bookingId}`;

    // 3. Calculate CheckSum with MD5
    // Use native crypto module instead of crypto-js
    const checksumString = `${merchantCode}${orderNo}${amountFormatted}${apiKey}${CHILLPAY_MD5_SECRET}`;
    const checkSum = crypto.createHash('md5').update(checksumString).digest('hex');

    // 4. Construct Form Data Payload
    const formData = new URLSearchParams();
    formData.append("MerchantCode", merchantCode);
    formData.append("OrderNo", orderNo);
    formData.append("Amount", amountFormatted.toString());
    formData.append("CustEmail", custEmail);
    formData.append("PhoneNumber", phoneNumber); // Optional
    formData.append("Description", description); // Optional
    formData.append("LangCode", langCode);
    formData.append("ApiKey", apiKey);
    formData.append("CheckSum", checkSum);
    formData.append("ReturnUrl", returnUrl); // Add return URL
    // Add other optional fields as needed (e.g., RouteNo, IPAddress, CustomerId)

    // 5. Call ChillPay API
    const chillpayEndpoint = CHILLPAY_API_ENDPOINT_SANDBOX; // Switch to PRODUCTION later
    const response = await fetch(chillpayEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ChillPay API Error Response:", errorText);
      throw new Error(`ChillPay API request failed with status ${response.status}`);
    }

    const result = (await response.json()) as ChillPayResponse;
    console.log("ChillPay API Success Response:", result);

    // 6. Process Response
    if (result.Status === 1 && result.Code === 200 && result.PaymentUrl) {
       // Here we would update booking status to PENDING_PAYMENT in a real implementation
       
      // Return the Payment URL to the frontend
      return NextResponse.json({ paymentUrl: result.PaymentUrl });
    } else {
      console.error("ChillPay payment initiation failed:", result);
      return NextResponse.json({ error: "Failed to initiate payment.", details: result.Message ?? "Unknown ChillPay error" }, { status: 500 });
    }

  } catch (error) {
    console.error("Error processing ChillPay request:", error);
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: "Failed to process ChillPay payment.", details: errorMessage }, { status: 500 });
  }
} 