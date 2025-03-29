import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { bookings, customers } from '~/server/db/schema';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.eventId || !data.contactInfo || !data.tickets || !data.totalCost) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Extract contact info
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
      phone: phone || null,
      // Note: userId is not included, which makes it null (for guest customers)
    });
    
    // Create a new booking record
    await db.insert(bookings).values({
      id: bookingId,
      customerId: customerId, // Link to the customer we just created
      eventId: data.eventId,
      totalAmount: data.totalCost,
      paymentStatus: 'PENDING',
    });
    
    // In a real app you would also:
    // 1. Store the selected tickets in the tickets table
    // 2. Process payment or redirect to payment gateway
    
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