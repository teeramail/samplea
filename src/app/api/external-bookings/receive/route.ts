// src/app/api/external-bookings/receive/route.ts
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { bookings, customers, events, venues, regions, eventTickets, tickets } from "~/server/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import crypto from "crypto";
import { eq, and } from "drizzle-orm";

// CORS headers to allow cross-origin requests
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Allow requests from any origin
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// 1) Define incoming payload schema:
const RequestSchema = z.object({
  bookingId: z.string(),
  amount: z.string().or(z.number().transform(n => n)).transform(val => parseFloat(val as any)),
  customerName: z.string(),
  email: z.string().email(),
  phone: z.string().optional().or(z.string()),
  eventTitle: z.string().optional(),
  seats: z.union([
    z.string().transform(s => {
      try {
        return JSON.parse(s);
      } catch (e) {
        console.error("Error parsing seats:", e);
        return [{ quantity: 1, seatType: "Standard", pricePaid: 0 }];
      }
    }),
    z.array(z.any()),
    z.any().transform(val => {
      console.log("Converting non-string/array seats to array:", val);
      return [{ quantity: 1, seatType: "Standard", pricePaid: 0 }];
    })
  ]),
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
      eventId: providedEventId,
      eventDate,
      venueName,
      venueId: providedVenueId,
    } = RequestSchema.parse(input);
    
    console.log("Parsed data:", { bookingId, amount, customerName, email });
    
    // Create or find region (required for events)
    let regionId;
    try {
      // Try to find default region first
      const defaultRegion = await db.query.regions.findFirst({
        where: eq(regions.name, "Thailand")
      });
      
      if (defaultRegion) {
        regionId = defaultRegion.id;
        console.log("Using existing region:", regionId);
      } else {
        // Create a default region if none exists
        const newRegionId = createId();
        await db.insert(regions).values({
          id: newRegionId,
          name: "Thailand",
          slug: "thailand",
          createdAt: new Date(),
          updatedAt: new Date()
        });
        regionId = newRegionId;
        console.log("Created new region:", regionId);
      }
    } catch (regionErr) {
      console.error("Error with region:", regionErr);
      // Create a fallback ID if needed
      regionId = createId();
    }

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
    
    // Create or find venue if needed
    let venueId;
    try {
      if (providedVenueId) {
        // Check if venue exists
        const venue = await db.query.venues.findFirst({
          where: eq(venues.id, providedVenueId)
        });
        
        if (venue) {
          venueId = venue.id;
        } else {
          throw new Error("Venue not found");
        }
      } else if (venueName) {
        // Try to find venue by name
        const venue = await db.query.venues.findFirst({
          where: eq(venues.name, venueName)
        });
        
        if (venue) {
          venueId = venue.id;
        } else {
          // Create a new venue with the provided name
          const newVenueId = createId();
          await db.insert(venues).values({
            id: newVenueId,
            name: venueName,
            address: "External venue",
            regionId: regionId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          venueId = newVenueId;
        }
      } else {
        // Create a default venue for external bookings
        const defaultVenue = await db.query.venues.findFirst({
          where: eq(venues.name, "External Venue")
        });
        
        if (defaultVenue) {
          venueId = defaultVenue.id;
        } else {
          const newVenueId = createId();
          await db.insert(venues).values({
            id: newVenueId,
            name: "External Venue",
            address: "External booking",
            regionId: regionId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          venueId = newVenueId;
        }
      }
      console.log("Using venue ID:", venueId);
    } catch (venueErr) {
      console.error("Error with venue:", venueErr);
      // Create a fallback venue ID if needed - we'll handle this later
    }
    
    // Create or find event
    let realEventId;
    try {
      if (providedEventId) {
        // Check if event exists
        const event = await db.query.events.findFirst({
          where: eq(events.id, providedEventId)
        });
        
        if (event) {
          realEventId = event.id;
        } else {
          throw new Error("Event not found");
        }
      } else if (eventTitle) {
        // Try to find event by title
        const event = await db.query.events.findFirst({
          where: eq(events.title, eventTitle)
        });
        
        if (event) {
          realEventId = event.id;
        } else {
          // Create a new event with the provided title
          const newEventId = createId();
          const eventDateTime = eventDate ? new Date(eventDate) : new Date();
          eventDateTime.setHours(eventDateTime.getHours() + 1); // Default end time 1 hour later
          
          await db.insert(events).values({
            id: newEventId,
            title: eventTitle,
            description: `External booking for ${eventTitle}`,
            date: eventDate ? new Date(eventDate) : new Date(),
            startTime: eventDate ? new Date(eventDate) : new Date(),
            endTime: eventDateTime,
            venueId: venueId,
            regionId: regionId,
            status: "SCHEDULED",
            createdAt: new Date(),
            updatedAt: new Date()
          });
          realEventId = newEventId;
          
          // Create a default ticket type for this event
          let parsedSeats;
          try {
            // seats is already a string from the schema transformation
            parsedSeats = JSON.parse(typeof seats === 'string' ? seats : JSON.stringify(seats));
          } catch (parseErr) {
            console.error("Error parsing seats JSON:", parseErr);
            parsedSeats = [{ quantity: 1, seatType: "Standard", pricePaid: amount }];
          }
          
          if (Array.isArray(parsedSeats)) {
            for (const seat of parsedSeats) {
              const ticketId = createId();
              await db.insert(eventTickets).values({
                id: ticketId,
                eventId: newEventId,
                seatType: seat.seatType || "Standard",
                price: seat.pricePaid || 0,
                capacity: 100, // Default capacity
                soldCount: seat.quantity || 1,
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          }
        }
      } else {
        // Create a default event for external bookings
        const defaultEvent = await db.query.events.findFirst({
          where: eq(events.title, "External Booking Event")
        });
        
        if (defaultEvent) {
          realEventId = defaultEvent.id;
        } else {
          const newEventId = createId();
          await db.insert(events).values({
            id: newEventId,
            title: "External Booking Event",
            description: "Event created for external bookings",
            date: new Date(),
            startTime: new Date(),
            endTime: new Date(new Date().getTime() + 3600000), // 1 hour later
            venueId: venueId,
            regionId: regionId,
            status: "SCHEDULED",
            createdAt: new Date(),
            updatedAt: new Date()
          });
          realEventId = newEventId;
          
          // Create a default ticket type
          const ticketId = createId();
          await db.insert(eventTickets).values({
            id: ticketId,
            eventId: newEventId,
            seatType: "Standard",
            price: 600,
            capacity: 100,
            soldCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      console.log("Using event ID:", realEventId);
    } catch (eventErr) {
      console.error("Error with event:", eventErr);
      // If we can't create an event, we need to create a fallback event
      const fallbackEventId = createId();
      try {
        // Create a fallback event
        await db.insert(events).values({
          id: fallbackEventId,
          title: "External Booking Fallback Event",
          description: "Fallback event created for external bookings",
          date: new Date(),
          startTime: new Date(),
          endTime: new Date(new Date().getTime() + 3600000), // 1 hour later
          venueId: venueId,
          regionId: regionId,
          status: "SCHEDULED",
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Create a default ticket type
        const ticketId = createId();
        await db.insert(eventTickets).values({
          id: ticketId,
          eventId: fallbackEventId,
          seatType: "Standard",
          price: amount || 600,
          capacity: 100,
          soldCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        realEventId = fallbackEventId;
        console.log("Created fallback event:", realEventId);
      } catch (fallbackErr) {
        console.error("Error creating fallback event:", fallbackErr);
        throw new Error("Unable to create event for booking");
      }
    }
    
    console.log("Inserting booking with ID:", internalId);
    
    // Insert booking record
    await db.insert(bookings).values({
      id: internalId,
      eventId: realEventId, // Use the real event ID we created or found
      customerId: customerId, // Required field
      totalAmount: amount,
      paymentStatus: "PROCESSING",
      paymentOrderNo: bookingId,
      customerNameSnapshot: customerName,
      customerEmailSnapshot: email,
      customerPhoneSnapshot: phone || null,
      eventTitleSnapshot: eventTitle || "External Booking",
      eventDateSnapshot: eventDate ? new Date(eventDate) : new Date(),
      venueNameSnapshot: venueName || "External Venue",
      regionNameSnapshot: "Thailand", // Set a default region name
      bookingItemsJson: JSON.stringify(seats),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Create actual ticket records for this booking
    try {
      let parsedSeats;
      try {
        // seats is already a string from the schema transformation
        parsedSeats = JSON.parse(typeof seats === 'string' ? seats : JSON.stringify(seats));
      } catch (parseErr) {
        console.error("Error parsing seats JSON:", parseErr);
        parsedSeats = [{ quantity: 1, seatType: "Standard", pricePaid: amount }];
      }
      
      if (Array.isArray(parsedSeats)) {
        for (const seat of parsedSeats) {
          // Find the event ticket for this seat type
          let eventTicketId;
          try {
            const eventTicket = await db.query.eventTickets.findFirst({
              where: and(
                eq(eventTickets.eventId, realEventId),
                eq(eventTickets.seatType, seat.seatType || "Standard")
              )
            });
            
            if (eventTicket) {
              eventTicketId = eventTicket.id;
            } else {
              // Create a ticket type if it doesn't exist
              const newTicketTypeId = createId();
              await db.insert(eventTickets).values({
                id: newTicketTypeId,
                eventId: realEventId,
                seatType: seat.seatType || "Standard",
                price: seat.pricePaid || 0,
                capacity: 100,
                soldCount: seat.quantity || 1,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              eventTicketId = newTicketTypeId;
            }
            
            // Create ticket records for each quantity
            for (let i = 0; i < (seat.quantity || 1); i++) {
              const ticketId = createId();
              await db.insert(tickets).values({
                id: ticketId,
                eventId: realEventId,
                eventDetailId: eventTicketId,
                bookingId: internalId,
                status: "ACTIVE",
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          } catch (ticketErr) {
            console.error("Error creating tickets:", ticketErr);
            // Continue anyway - the booking is more important
          }
        }
      }
    } catch (seatsErr) {
      console.error("Error processing seats:", seatsErr);
      // Continue anyway - the booking is more important
    }
    
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

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204, // No content
    headers: CORS_HEADERS,
  });
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
    
    // Add CORS headers to the redirect response
    return NextResponse.redirect(paymentUrl, {
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { 
      status: 400,
      headers: CORS_HEADERS 
    });
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
    return NextResponse.json({ internalId, paymentUrl }, {
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    console.error("Error in POST handler:", err);
    return NextResponse.json({
      error: err.message,
      details: "Check server logs for more information"
    }, { 
      status: 400,
      headers: CORS_HEADERS 
    });
  }
}
