-- Simple fix for missing categoryId column
-- Run this in your Neon database console

-- First check if EventCategory table exists, if not create it
CREATE TABLE IF NOT EXISTS "EventCategory" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "description" text
);

-- Add the missing categoryId column to Event table
ALTER TABLE "Event" 
ADD COLUMN IF NOT EXISTS "categoryId" text;

-- Add the foreign key constraint (this might fail if data doesn't match, so we'll be gentle)
DO $$ 
BEGIN
    -- Try to add the foreign key constraint
    ALTER TABLE "Event" 
    ADD CONSTRAINT "Event_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE SET NULL;
EXCEPTION 
    WHEN others THEN 
        RAISE NOTICE 'Foreign key constraint already exists or could not be added';
END $$;

-- Insert a default category if none exist
INSERT INTO "EventCategory" ("id", "name", "description") 
VALUES ('default', 'General Events', 'Default category for events')
ON CONFLICT ("name") DO NOTHING; 