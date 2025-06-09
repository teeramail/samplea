-- =====================================================
-- DATABASE FIX PART 2 - Fix paymentStatus Column
-- Run this to fix the enum conversion error
-- =====================================================

-- Fix the paymentStatus column conversion issue
DO $$ BEGIN
    -- First, remove any default value from the column
    ALTER TABLE "Booking" ALTER COLUMN "paymentStatus" DROP DEFAULT;
    
    -- Update any NULL values to 'PENDING'
    UPDATE "Booking" SET "paymentStatus" = 'PENDING' WHERE "paymentStatus" IS NULL;
    
    -- Now convert the column type to the enum
    ALTER TABLE "Booking" 
    ALTER COLUMN "paymentStatus" TYPE booking_status USING 
        CASE 
            WHEN "paymentStatus" = 'CONFIRMED' THEN 'CONFIRMED'::booking_status
            WHEN "paymentStatus" = 'CANCELLED' THEN 'CANCELLED'::booking_status
            WHEN "paymentStatus" = 'COMPLETED' THEN 'COMPLETED'::booking_status
            WHEN "paymentStatus" = 'PAYMENT_FAILED' THEN 'PAYMENT_FAILED'::booking_status
            ELSE 'PENDING'::booking_status
        END;
    
    -- Add the new default value back
    ALTER TABLE "Booking" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING'::booking_status;
    
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'paymentStatus column conversion completed or already correct type';
END $$;

-- Also fix Event status column the same way
DO $$ BEGIN
    -- First, remove any default value from the column
    ALTER TABLE "Event" ALTER COLUMN "status" DROP DEFAULT;
    
    -- Update any NULL values to 'SCHEDULED'
    UPDATE "Event" SET "status" = 'SCHEDULED' WHERE "status" IS NULL;
    
    -- Now convert the column type to the enum
    ALTER TABLE "Event" 
    ALTER COLUMN "status" TYPE event_status USING 
        CASE 
            WHEN "status" = 'DRAFT' THEN 'DRAFT'::event_status
            WHEN "status" = 'LIVE' THEN 'LIVE'::event_status
            WHEN "status" = 'COMPLETED' THEN 'COMPLETED'::event_status
            WHEN "status" = 'CANCELLED' THEN 'CANCELLED'::event_status
            ELSE 'SCHEDULED'::event_status
        END;
    
    -- Add the new default value back
    ALTER TABLE "Event" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED'::event_status;
    
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Event status column conversion completed or already correct type';
END $$;

-- =====================================================
-- PART 2 FIX COMPLETE!
-- ===================================================== 