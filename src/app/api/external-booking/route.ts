import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { bookings, customers } from "~/server/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

// POST /api/external-booking
// This endpoint handles booking data from external applications
// and prepares it for payment processing (supports both ChillPay and ModernPay)
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Extract data from the request
    const {
      externalReservationId, // ID from the external system
      preReservationId, // Alternative name for reservation ID
      eventId,
      name,
      email,
      mobile,
      phone, // Alternative field for mobile
      eventName,
      eventDate,
      tickets,
      totalAmount,
      returnUrl, // URL to return to after payment
      notifyUrl,  // URL to notify on payment status changes (optional)
      paymentMethod // 'chillpay' or 'modernpay'
    } = body;
    
    // Normalize data
    const reservationId = externalReservationId || preReservationId || createId();
    const phoneNumber = mobile || phone || null;
    
    // Validate required fields
    if (!eventId || !name || !email || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields", details: "eventId, name, email, and totalAmount are required" },
        { status: 400 }
      );
    }
    
    console.log("Received external booking data:", {
      reservationId,
      eventId,
      name,
      email,
      totalAmount,
      paymentMethod: paymentMethod || 'not specified',
      ticketCount: Array.isArray(tickets) ? tickets.length : 'unknown'
    });
    
    // Check if customer already exists with this email
    let customerId;
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.email, email)
    });
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update customer info if needed
      await db.update(customers)
        .set({
          name, // Update name in case it changed
          phone: mobile || existingCustomer.phone, // Keep existing phone if not provided
          updatedAt: new Date()
        })
        .where(eq(customers.id, customerId));
    } else {
      // Create new customer
      customerId = createId();
      await db.insert(customers).values({
        id: customerId,
        name,
        email,
        phone: phoneNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Extract venue and region info if available
    const venueNameSnapshot = body.venueName || body.venue?.name || null;
    const regionNameSnapshot = body.regionName || body.region?.name || null;
    
    // Create booking in our system
    const bookingId = createId();
    await db.insert(bookings).values({
      id: bookingId,
      customerId,
      eventId,
      totalAmount,
      paymentStatus: "PENDING",
      paymentOrderNo: reservationId, // Store external ID
      customerNameSnapshot: name,
      customerEmailSnapshot: email,
      customerPhoneSnapshot: phoneNumber,
      eventTitleSnapshot: eventName,
      eventDateSnapshot: eventDate ? new Date(eventDate) : null,
      venueNameSnapshot,
      regionNameSnapshot,
      bookingItemsJson: tickets, // Store all ticket details directly in JSON field
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Determine payment method and generate appropriate response
    const baseUrl = new URL(request.url).origin;
    const paymentMethodToUse = paymentMethod?.toLowerCase() || 'chillpay';
    
    if (paymentMethodToUse === 'modernpay') {
      // For ModernPay integration
      // Return the booking ID and necessary data for the external app to use with ModernPay widget
      return NextResponse.json({
        success: true,
        message: "Booking created successfully",
        bookingId,
        externalId: reservationId,
        // ModernPay requires the following data to be passed to its widget
        paymentData: {
          bookingId,
          amount: totalAmount,
          customerName: name,
          customerEmail: email,
          customerPhone: phoneNumber || '',
          description: `Tickets for ${eventName || 'Event'}`,
          // Callback URL for ModernPay to notify your system
          callbackUrl: `${baseUrl}/api/checkout/payment-callback?source=modernpay&bookingId=${bookingId}`
        }
      }, { status: 200 });
    } else {
      // Default to ChillPay integration
      // Prepare ChillPay payment data
      const paymentData = {
        bookingId,
        amount: totalAmount,
        customerName: name,
        customerEmail: email,
        customerPhone: phoneNumber || '',
        description: `Tickets for ${eventName || 'Event'}`,
        // Use our callback endpoints but include the external system's returnUrl
        // so we can redirect back to them after processing
        returnUrl: returnUrl ? 
          `${baseUrl}/api/checkout/chillpay/callback?externalReturnUrl=${encodeURIComponent(returnUrl)}` : 
          `${baseUrl}/checkout/chillpay-callback`,
        notifyUrl: notifyUrl ? 
          `${baseUrl}/api/checkout/chillpay/webhook?externalNotifyUrl=${encodeURIComponent(notifyUrl)}` : 
          undefined
      };
      
      // Return the booking ID and payment URL
      return NextResponse.json({
        success: true,
        message: "Booking created successfully",
        bookingId,
        externalId: reservationId,
        // In a real implementation, this would generate an actual ChillPay payment URL
        // For now, we'll return the URL to your existing credit-card payment page
        paymentUrl: `${baseUrl}/checkout/credit-card?bookingId=${bookingId}&amount=${totalAmount}&customerName=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phoneNumber || '')}&eventTitle=${encodeURIComponent(eventName || '')}`,
        // Include the data that would be sent to ChillPay for reference
        paymentData
      }, { status: 200 });
    }
    
  } catch (error) {
    console.error("[API] Error processing external booking:", error);
    return NextResponse.json(
      { error: "Failed to process booking", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
