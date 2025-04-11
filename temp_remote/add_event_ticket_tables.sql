-- Add EventTicket table for seat types and pricing
CREATE TABLE IF NOT EXISTS "EventTicket" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "seatType" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "capacity" INTEGER NOT NULL,
  "description" TEXT,
  "soldCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add Booking table to track ticket purchases
CREATE TABLE IF NOT EXISTS "Booking" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add Ticket table to track individual tickets
CREATE TABLE IF NOT EXISTS "Ticket" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "eventDetailId" TEXT NOT NULL REFERENCES "EventTicket"("id") ON DELETE CASCADE,
  "bookingId" TEXT NOT NULL REFERENCES "Booking"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_event_ticket_event_id" ON "EventTicket"("eventId");
CREATE INDEX IF NOT EXISTS "idx_booking_user_id" ON "Booking"("userId");
CREATE INDEX IF NOT EXISTS "idx_booking_event_id" ON "Booking"("eventId");
CREATE INDEX IF NOT EXISTS "idx_ticket_booking_id" ON "Ticket"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_ticket_event_id" ON "Ticket"("eventId");
CREATE INDEX IF NOT EXISTS "idx_ticket_event_detail_id" ON "Ticket"("eventDetailId");

-- Add missing fields to Fighter table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'Fighter' AND column_name = 'record') THEN
        ALTER TABLE "Fighter" ADD COLUMN "record" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'Fighter' AND column_name = 'imageUrl') THEN
        ALTER TABLE "Fighter" ADD COLUMN "imageUrl" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'Fighter' AND column_name = 'country') THEN
        ALTER TABLE "Fighter" ADD COLUMN "country" TEXT;
    END IF;
END $$;

-- Add missing timestamp fields to Region table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'Region' AND column_name = 'createdAt') THEN
        ALTER TABLE "Region" 
        ADD COLUMN "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        ADD COLUMN "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
    END IF;
END $$;

-- Update timestamp types to be consistent (without timezone)
DO $$ 
BEGIN
    -- Event table
    ALTER TABLE "Event" 
    ALTER COLUMN "date" TYPE TIMESTAMP WITHOUT TIME ZONE,
    ALTER COLUMN "startTime" TYPE TIMESTAMP WITHOUT TIME ZONE,
    ALTER COLUMN "endTime" TYPE TIMESTAMP WITHOUT TIME ZONE,
    ALTER COLUMN "createdAt" TYPE TIMESTAMP WITHOUT TIME ZONE,
    ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITHOUT TIME ZONE;
    
    -- Fighter table
    ALTER TABLE "Fighter" 
    ALTER COLUMN "createdAt" TYPE TIMESTAMP WITHOUT TIME ZONE,
    ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITHOUT TIME ZONE;
    
    -- User table
    ALTER TABLE "User" 
    ALTER COLUMN "createdAt" TYPE TIMESTAMP WITHOUT TIME ZONE,
    ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITHOUT TIME ZONE;
    
    -- Fix Region table if it has WITH TIME ZONE
    ALTER TABLE "Region" 
    ALTER COLUMN "createdAt" TYPE TIMESTAMP WITHOUT TIME ZONE,
    ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITHOUT TIME ZONE;
    
    -- Fix _EventToFighter table if it exists and has WITH TIME ZONE
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = '_EventToFighter') THEN
        ALTER TABLE "_EventToFighter" 
        ALTER COLUMN "createdAt" TYPE TIMESTAMP WITHOUT TIME ZONE,
        ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITHOUT TIME ZONE;
    END IF;
END $$; 