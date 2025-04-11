-- Add countryCode column to Region table if it doesn't exist
ALTER TABLE "Region" 
ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'TH'; 