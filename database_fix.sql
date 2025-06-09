-- =====================================================
-- NEON DATABASE FIX - Universal Booking System
-- Run this entire file in your Neon database console
-- =====================================================

-- 1. Create Status Enums for data integrity
DO $$ BEGIN
    CREATE TYPE course_enrollment_status AS ENUM (
        'PENDING_PAYMENT',
        'CONFIRMED', 
        'CANCELLED',
        'COMPLETED',
        'AWAITING_CONFIRMATION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM (
        'PENDING',
        'CONFIRMED',
        'CANCELLED', 
        'COMPLETED',
        'PAYMENT_FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM (
        'DRAFT',
        'SCHEDULED',
        'LIVE',
        'COMPLETED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create EventCategory table (required before adding foreign key)
CREATE TABLE IF NOT EXISTS "EventCategory" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "description" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Add the missing categoryId column to Event table
ALTER TABLE "Event" 
ADD COLUMN IF NOT EXISTS "categoryId" text REFERENCES "EventCategory"("id") ON DELETE SET NULL;

-- 4. Ensure Customer table exists with proper structure
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" text PRIMARY KEY,
    "userId" text REFERENCES "User"("id") ON DELETE SET NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Create index for faster customer lookups
CREATE INDEX IF NOT EXISTS "customer_email_idx" ON "Customer"("email");

-- 6. Ensure CourseEnrollment table exists with proper structure
CREATE TABLE IF NOT EXISTS "CourseEnrollment" (
    "id" text PRIMARY KEY,
    "customerId" text NOT NULL REFERENCES "Customer"("id") ON DELETE RESTRICT,
    "courseId" text NOT NULL REFERENCES "TrainingCourse"("id") ON DELETE CASCADE,
    "pricePaid" double precision NOT NULL,
    "status" course_enrollment_status DEFAULT 'PENDING_PAYMENT' NOT NULL,
    "enrollmentDate" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "startDate" timestamp without time zone,
    "courseTitleSnapshot" text,
    "customerNameSnapshot" text,
    "customerEmailSnapshot" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. Add metadata column to Booking table for flexible data storage
ALTER TABLE "Booking" 
ADD COLUMN IF NOT EXISTS "metadata" jsonb;

-- 8. Update status columns to use enums (handle gracefully if already correct type)
DO $$ BEGIN
    ALTER TABLE "Booking" 
    ALTER COLUMN "paymentStatus" TYPE booking_status USING "paymentStatus"::booking_status;
EXCEPTION
    WHEN others THEN 
        -- If conversion fails, try setting a default first
        UPDATE "Booking" SET "paymentStatus" = 'PENDING' WHERE "paymentStatus" IS NULL;
        ALTER TABLE "Booking" 
        ALTER COLUMN "paymentStatus" TYPE booking_status USING 
            CASE 
                WHEN "paymentStatus" = 'CONFIRMED' THEN 'CONFIRMED'::booking_status
                WHEN "paymentStatus" = 'CANCELLED' THEN 'CANCELLED'::booking_status
                WHEN "paymentStatus" = 'COMPLETED' THEN 'COMPLETED'::booking_status
                WHEN "paymentStatus" = 'PAYMENT_FAILED' THEN 'PAYMENT_FAILED'::booking_status
                ELSE 'PENDING'::booking_status
            END;
END $$;

DO $$ BEGIN
    ALTER TABLE "Event" 
    ALTER COLUMN "status" TYPE event_status USING "status"::event_status;
EXCEPTION
    WHEN others THEN 
        -- If conversion fails, try setting a default first
        UPDATE "Event" SET "status" = 'SCHEDULED' WHERE "status" IS NULL;
        ALTER TABLE "Event" 
        ALTER COLUMN "status" TYPE event_status USING 
            CASE 
                WHEN "status" = 'DRAFT' THEN 'DRAFT'::event_status
                WHEN "status" = 'LIVE' THEN 'LIVE'::event_status
                WHEN "status" = 'COMPLETED' THEN 'COMPLETED'::event_status
                WHEN "status" = 'CANCELLED' THEN 'CANCELLED'::event_status
                ELSE 'SCHEDULED'::event_status
            END;
END $$;

-- 9. Insert default event categories for universal booking system
INSERT INTO "EventCategory" ("id", "name", "description") VALUES 
('muay-thai-fights', 'Muay Thai Fights', 'Professional and amateur Muay Thai competitions'),
('tournaments', 'Tournaments', 'Multi-fighter tournament events'),
('training-events', 'Training Events', 'Special training sessions and workshops'),
('tours', 'Tours', 'Guided tours and excursions'),
('golf', 'Golf', 'Golf tournaments and games'),
('fishing', 'Fishing', 'Fishing trips and competitions'),
('restaurants', 'Restaurant Bookings', 'Restaurant reservations and dining experiences'),
('boat-trips', 'Boat Trips', 'Marine excursions and boat tours'),
('other', 'Other Events', 'Miscellaneous events and activities')
ON CONFLICT ("name") DO NOTHING;

-- 10. Create any missing indexes for performance
CREATE INDEX IF NOT EXISTS "course_enrollment_customer_idx" ON "CourseEnrollment"("customerId");
CREATE INDEX IF NOT EXISTS "course_enrollment_course_idx" ON "CourseEnrollment"("courseId");
CREATE INDEX IF NOT EXISTS "course_enrollment_status_idx" ON "CourseEnrollment"("status");
CREATE INDEX IF NOT EXISTS "event_category_idx" ON "Event"("categoryId");
CREATE INDEX IF NOT EXISTS "booking_customer_idx" ON "Booking"("customerId");

-- =====================================================
-- DATABASE FIX COMPLETE!
-- Your universal booking system is now ready to use.
-- ===================================================== 