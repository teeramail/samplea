import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { bookings, customers } from "~/server/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

// POST /api/external-booking
// This endpoint handles booking data from external applications
// and prepares it for ChillPay payment
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Extract data from the request
    const {
      externalReservationId, // ID from the external system
      eventId,
      name,
      email,
      mobile,
      eventName,
      eventDate,
      tickets,
      totalAmount,
      returnUrl, // URL to return to after payment
      notifyUrl   // URL to notify on payment status changes (optional)
    } = body;
    
    // Validate required fields
    if (!eventId || !name || !email || !totalAmount || !returnUrl) {
      return NextResponse.json(
        { error: "Missing required fields", details: "eventId, name, email, totalAmount, and returnUrl are required" },
        { status: 400 }
      );
    }
    
    console.log("Received external booking data:", {
      externalReservationId,
      eventId,
      name,
      email,
      totalAmount,
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
        phone: mobile || null,
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
      paymentOrderNo: externalReservationId || createId(), // Store external ID or generate one
      customerNameSnapshot: name,
      customerEmailSnapshot: email,
      customerPhoneSnapshot: mobile || null,
      eventTitleSnapshot: eventName,
      eventDateSnapshot: eventDate ? new Date(eventDate) : null,
      venueNameSnapshot,
      regionNameSnapshot,
      bookingItemsJson: tickets, // Store all ticket details directly in JSON field
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Generate ChillPay payment URL
    // This will use the same logic as your existing ChillPay integration
    const baseUrl = new URL(request.url).origin;
    
    // Prepare ChillPay payment data
    const paymentData = {
      bookingId,
      amount: totalAmount,
      customerName: name,
      customerEmail: email,
      customerPhone: mobile || '',
      description: `Tickets for ${eventName}`,
      // Use our callback endpoints but include the external system's returnUrl
      // so we can redirect back to them after processing
      returnUrl: `${baseUrl}/api/checkout/chillpay/callback?externalReturnUrl=${encodeURIComponent(returnUrl)}`,
      notifyUrl: notifyUrl ? `${baseUrl}/api/checkout/chillpay/webhook?externalNotifyUrl=${encodeURIComponent(notifyUrl)}` : undefined
    };
    
    // Return the booking ID and payment URL
    return NextResponse.json({
      success: true,
      message: "Booking created successfully",
      bookingId,
      externalId: externalReservationId,
      // In a real implementation, this would generate an actual ChillPay payment URL
      // For now, we'll return the URL to your existing credit-card payment page
      paymentUrl: `${baseUrl}/checkout/credit-card?bookingId=${bookingId}&amount=${totalAmount}&customerName=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(mobile || '')}&eventTitle=${encodeURIComponent(eventName || '')}`,
      // Include the data that would be sent to ChillPay for reference
      paymentData
    }, { status: 200 });
    
  } catch (error) {
    console.error("[API] Error processing external booking:", error);
    return NextResponse.json(
      { error: "Failed to process booking", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
