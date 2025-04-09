import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Handle ChillPay background notifications (webhook) 
// This is meant for server-to-server communication for reliable payment status updates
export async function POST(request: Request) {
  try {
    // Parse the POST data from ChillPay
    const formData = await request.formData();
    
    // Log the received data for debugging
    console.log("Received ChillPay background notification with data:", Object.fromEntries(formData.entries()));
    
    // Extract all parameters from the form data according to the ChillPay manual
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
      console.error("[Webhook] Missing CHILLPAY_MD5_SECRET environment variable");
      return NextResponse.json({ status: "error", message: "Configuration error" }, { status: 500 });
    }
    
    // Clean the MD5 secret (remove newlines and trim spaces)
    const cleanedMd5Secret = process.env.CHILLPAY_MD5_SECRET.trim();
    
    // Construct the checksum string according to ChillPay manual
    const checksumString = `${transactionId}${amount}${orderNo}${customerId}${bankCode}${paymentDate}${paymentStatus}${bankRefCode}${currentDate}${currentTime}${paymentDescription}${creditCardToken}${currency}${customerName}${cleanedMd5Secret}`;
    
    // Generate the MD5 hash
    const calculatedChecksum = crypto
      .createHash('md5')
      .update(checksumString)
      .digest('hex');
    
    // Log the checksum details
    console.log("[Webhook] Checksum validation:", {
      received: receivedChecksum,
      calculated: calculatedChecksum,
      match: calculatedChecksum === receivedChecksum
    });
    
    // In the webhook, we must enforce strict checksum validation for security
    // Background notifications should always include the proper checksum
    if (calculatedChecksum !== receivedChecksum) {
      console.error("[Webhook] Checksum validation failed - Rejecting notification");
      return NextResponse.json({ status: "error", message: "Invalid checksum" }, { status: 400 });
    }
    
    // Get the booking using the order number
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.paymentOrderNo, orderNo),
    });
    
    if (!booking) {
      console.error(`[Webhook] Booking not found for order: ${orderNo}`);
      return NextResponse.json({ status: "error", message: "Booking not found" }, { status: 404 });
    }
    
    // For background notifications, we can rely on the standard format
    const isSuccess = paymentStatus === '0'; // 0 = Success according to ChillPay docs
    const newStatus = isSuccess ? 'COMPLETED' : 'FAILED';
    
    // Update booking status and payment details
    await db.update(bookings)
      .set({ 
        paymentStatus: newStatus,
        paymentTransactionId: transactionId,
        paymentBankCode: bankCode, 
        paymentBankRefCode: bankRefCode,
        paymentDate: paymentDate,
        paymentMethod: 'credit-card',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, booking.id));
    
    console.log(`[Webhook] Updated booking ${booking.id} payment status to ${newStatus}`);
    
    // For production application:
    // 1. Send confirmation emails to customers
    // 2. Update inventory/ticket status
    // 3. Notify admin about payment status change
    
    // Always respond with 200 OK to ChillPay to acknowledge receipt
    return NextResponse.json({ status: "success" }, { status: 200 });

  } catch (error) {
    console.error("[Webhook] Error processing ChillPay notification:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
} 