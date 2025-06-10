-- Fix Fighter table by truncating and adding missing columns
-- Run this in your Neon database console

-- First, truncate the Fighter table to remove all existing data
TRUNCATE TABLE "Fighter" CASCADE;

-- Add missing columns that the frontend expects
ALTER TABLE "Fighter" 
ADD COLUMN IF NOT EXISTS "thumbnailUrl" text;

ALTER TABLE "Fighter" 
ADD COLUMN IF NOT EXISTS "imageUrls" text[];

-- Optional: Check the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Fighter' 
ORDER BY column_name; 