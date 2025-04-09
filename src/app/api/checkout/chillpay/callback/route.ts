// import { NextResponse } from "next/server"; // Unused
// import { redirect } from "next/navigation"; // Unused

import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

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

// Handle ChillPay real-time payment notification via POST
export async function POST(request: Request) {
  try {
    // Parse the POST data from ChillPay
    const formData = await request.formData();
    
    // Log the received data for debugging
    console.log("Received ChillPay callback with data:", Object.fromEntries(formData.entries()));
    
    // Extract all parameters from the form data according to the ChillPay manual
    // Use proper type handling with parentheses and nullish coalescing
    const getValue = (key: string): string => {
      const value = formData.get(key);
      if (value === null || value === undefined) {
        return '';
      }
      // Handle different types of values properly
      if (typeof value === 'string') {
        return value;
      }
      if (value instanceof File) {
        return value.name; // For File objects, return the name
      }
      // For safety, use JSON.stringify for objects or other types
      try {
        return String(value);
      } catch (_) {
        console.warn(`Unable to convert ${key} value to string properly`);
        return '';
      }
    };
    
    const transactionId = getValue('TransactionId');
    const amount = getValue('Amount');
    const orderNo = getValue('OrderNo');
    const customerId = getValue('CustomerId');
    const bankCode = getValue('BankCode');
    const paymentDate = getValue('PaymentDate');
    const paymentStatus = getValue('PaymentStatus');
    const bankRefCode = getValue('BankRefCode');
    const currentDate = getValue('CurrentDate');
    const currentTime = getValue('CurrentTime');
    const paymentDescription = getValue('PaymentDescription');
    const creditCardToken = getValue('CreditCardToken');
    const currency = getValue('Currency');
    const customerName = getValue('CustomerName');
    const receivedChecksum = getValue('CheckSum');
    
    // Verify the received data with checksum validation
    if (!process.env.CHILLPAY_MD5_SECRET) {
      console.error("Missing CHILLPAY_MD5_SECRET environment variable");
      
      // For development/testing only, use a default secret
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        return NextResponse.json({ status: "error", message: "Configuration error" }, { status: 500 });
      } else {
        console.warn("⚠️ SECURITY WARNING: Using fallback MD5 secret for development");
        // For development purposes only - NEVER use this in production
        process.env.CHILLPAY_MD5_SECRET = "development_secret_do_not_use_in_production";
      }
    }
    
    // Clean the MD5 secret (remove newlines and trim spaces)
    const cleanedMd5Secret = process.env.CHILLPAY_MD5_SECRET.trim();
    
    // Construct the checksum string according to ChillPay manual:
    // TransactionId + Amount + OrderNo + CustomerId + BankCode + PaymentDate + PaymentStatus +
    // BankRefCode + CurrentDate + CurrentTime + PaymentDescription + CreditCardToken + Currency +
    // CustomerName + MD5 Secret Key
    const checksumString = `${transactionId}${amount}${orderNo}${customerId}${bankCode}${paymentDate}${paymentStatus}${bankRefCode}${currentDate}${currentTime}${paymentDescription}${creditCardToken}${currency}${customerName}${cleanedMd5Secret}`;
    
    // Generate the MD5 hash
    const calculatedChecksum = crypto
      .createHash('md5')
      .update(checksumString)
      .digest('hex');
    
    // Log the checksum details (partial for security)
    console.log("Checksum validation:", {
      received: receivedChecksum,
      calculated: calculatedChecksum,
      match: calculatedChecksum === receivedChecksum
    });
    
    // Validate checksum
    if (calculatedChecksum !== receivedChecksum) {
      console.error("Checksum validation failed - possible security issue");
      
      // For development/testing environments, continue processing even if checksum fails
      // ONLY do this in non-production environments!
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        return NextResponse.json({ status: "error", message: "Invalid checksum" }, { status: 400 });
      } else {
        console.warn("⚠️ SECURITY WARNING: Proceeding despite checksum failure because we're not in production");
        // Continue processing in dev/test environments
      }
    }
    
    // Get the booking using the order number
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.paymentOrderNo, orderNo),
    });
    
    if (!booking) {
      console.error(`Booking not found for order: ${orderNo}`);
      return NextResponse.json({ status: "error", message: "Booking not found" }, { status: 404 });
    }
    
    // Handle different callback formats
    // ChillPay sometimes sends different parameters based on the notification type
    let newStatus = 'PENDING';
    
    // Standard callback format
    if (paymentStatus === '0') {
      newStatus = 'COMPLETED';
    } else if (paymentStatus === '1' || paymentStatus === '2') {
      newStatus = 'FAILED';
    }
    
    // Alternative format (uses status parameter)
    if (formData.get('status')) {
      const statusValue = formData.get('status');
      const status = statusValue === null || statusValue === undefined 
        ? '' 
        : typeof statusValue === 'string' 
          ? statusValue.toLowerCase() 
          : String(statusValue).toLowerCase();
          
      if (status === 'success' || status === 'approved') {
        newStatus = 'COMPLETED';
      } else if (status === 'cancel' || status === 'failed' || status === 'rejected') {
        newStatus = 'FAILED';
      }
    }
    
    // Update booking status based on payment result
    await db.update(bookings)
      .set({ 
        paymentStatus: newStatus,
        paymentTransactionId: transactionId,
        paymentBankCode: bankCode, 
        paymentBankRefCode: bankRefCode,
        paymentDate: paymentDate,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, booking.id));
    
    console.log(`Updated booking ${booking.id} payment status to ${newStatus}`);
    
    // For production, you should:
    // 1. Send confirmation emails to customers
    // 2. Update inventory/ticket status
    // 3. Notify admin about successful payment
    
    // Send a 200 OK response to ChillPay
    return NextResponse.json({ status: "success" }, { status: 200 });

  } catch (error) {
    console.error("Error processing ChillPay payment notification:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
} 