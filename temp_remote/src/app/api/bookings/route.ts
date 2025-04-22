import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { bookings, customers, events, venues, regions, eventTickets } from '~/server/db/schema';
import { nanoid } from 'nanoid';
import { eq, type SQLWrapper } from 'drizzle-orm';

// Define types for the request body
interface ContactInfo {
  fullName: string;
  email: string;
  phone?: string | null; // Optional phone
}

interface BookingTicketInput {
  id: string; // ID of the EventTicket
  quantity: number;
}

interface BookingRequestData {
  eventId: string;
  contactInfo: ContactInfo;
  tickets: BookingTicketInput[];
  totalCost: number;
}

// Define type for the items stored in bookingItemsJson
interface BookingItemSnapshot {
  seatType: string;
  quantity: number;
  pricePaid: number | null; // Handle potential null from schema
  costAtBooking: number | null; // Handle potential null from schema
}

export async function POST(request: Request) {
  try {
    // Use type assertion for the request data
    const data = await request.json() as BookingRequestData;
    
    // Validate required fields (already typed)
    if (!data.eventId || !data.contactInfo || !data.tickets ?? data.totalCost === undefined) { // Check totalCost for undefined explicitly if needed
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Extract contact info (already typed)
    const { fullName, email, phone } = data.contactInfo;
    
    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Generate IDs
    const customerId = nanoid();
    const bookingId = nanoid();
    
    // Create a new customer record for the guest
    await db.insert(customers).values({
      id: customerId,
      name: fullName,
      email: email,
      phone: phone ?? null, // Use nullish coalescing
    });
    
    // 1. Fetch Event details (eq should be safe now)
    const eventDetails = await db.query.events.findFirst({
      where: eq(events.id, data.eventId),
      columns: {
        title: true,
        date: true,
        venueId: true,
        regionId: true
      }
    });
    
    if (!eventDetails) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // 2. Fetch Venue name if venueId exists (Should be safe)
    let venueName = 'N/A';
    if (eventDetails.venueId) {
      const venueResult = await db.query.venues.findFirst({
        where: eq(venues.id, eventDetails.venueId),
        columns: { name: true }
      });
      venueName = venueResult?.name ?? 'N/A';
    }
    
    // 3. Fetch Region name if regionId exists (Should be safe)
    let regionName = 'N/A';
    if (eventDetails.regionId) {
      const regionResult = await db.query.regions.findFirst({
        where: eq(regions.id, eventDetails.regionId),
        columns: { name: true }
      });
      regionName = regionResult?.name ?? 'N/A';
    }
    
    // 4. Process ticket data and fetch EventTicket details
    const bookingItems: BookingItemSnapshot[] = []; // Type the array
    
    // Check if data.tickets is an array (already typed)
    if (!Array.isArray(data.tickets)) {
      return NextResponse.json(
        { error: 'Invalid tickets data format' },
        { status: 400 }
      );
    }
    
    // Type the ticket variable in the loop
    for (const ticket of data.tickets) {
      if (!ticket.id || !ticket.quantity) continue;
      
      try {
        // Fetch EventTicket details (eq should be safe now)
        const ticketDetails = await db.query.eventTickets.findFirst({
          where: eq(eventTickets.id, ticket.id),
          columns: {
            seatType: true,
            price: true,
            discountedPrice: true,
            cost: true
          }
        });
        
        if (!ticketDetails) {
          console.warn(`EventTicket with ID ${ticket.id} not found`);
          continue; // Skip this ticket
        }
        
        // Add to booking items (already typed)
        bookingItems.push({
          seatType: ticketDetails.seatType,
          quantity: ticket.quantity,
          pricePaid: ticketDetails.discountedPrice ?? ticketDetails.price, // Use discount or standard price
          costAtBooking: ticketDetails.cost ?? null // Ensure cost is explicitly null if missing
        });
      } catch (error) {
        console.error(`Error processing ticket ${ticket.id}:`, error);
        // Consider how to handle this - maybe skip the ticket or fail the booking?
      }
    }
    
    // Ensure bookingItems are valid before inserting
    const validBookingItems = bookingItems.length > 0 ? bookingItems : null;
    
    // Create a new booking record with snapshot data (values should be safe now)
    await db.insert(bookings).values({
      id: bookingId,
      customerId: customerId,
      eventId: data.eventId,
      totalAmount: data.totalCost,
      paymentStatus: 'PENDING',
      // Snapshot fields - provide defaults for any potentially missing data
      customerNameSnapshot: fullName,
      customerEmailSnapshot: email,
      customerPhoneSnapshot: phone ?? null, // Use nullish coalescing
      eventTitleSnapshot: eventDetails.title ?? 'N/A', // Default title
      eventDateSnapshot: eventDetails.date, // Assumes date is always present if event is found
      venueNameSnapshot: venueName, // Already defaults to 'N/A'
      regionNameSnapshot: regionName, // Already defaults to 'N/A'
      bookingItemsJson: validBookingItems // Type should match the column type
    });
    
    return NextResponse.json({ 
      success: true, 
      bookingId,
      customerId,
      message: 'Booking created successfully'
    });
    
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
} 