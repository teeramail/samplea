-- Create Customer table
CREATE TABLE IF NOT EXISTS "Customer" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text REFERENCES "User"("id"),
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Update Booking table to use customerId instead of userId
ALTER TABLE "Booking" 
	ADD COLUMN "customerId" text REFERENCES "Customer"("id");

-- Update existing bookings (if any) to link to new Customer records
-- This is a placeholder; in a real migration you might need to create Customer records for existing bookings
-- INSERT INTO "Customer" (...) SELECT ... FROM "Booking" JOIN "User" ...;
-- UPDATE "Booking" SET "customerId" = ...;

-- Make customerId NOT NULL once data is migrated
ALTER TABLE "Booking" 
	ALTER COLUMN "customerId" SET NOT NULL;

-- Drop the foreign key constraint for userId
ALTER TABLE "Booking" 
	DROP CONSTRAINT "Booking_userId_User_id_fk";

-- Drop userId column from Booking table
ALTER TABLE "Booking" 
	DROP COLUMN "userId"; 