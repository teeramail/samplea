-- Add biography field to Fighter table
-- Run this in your Neon database console

-- Add biography column for detailed fighter information
ALTER TABLE "Fighter" 
ADD COLUMN IF NOT EXISTS "biography" text;

-- Optional: Check the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Fighter' 
ORDER BY column_name; 