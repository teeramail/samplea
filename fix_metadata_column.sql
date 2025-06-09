-- Fix missing metadata column in Booking table
-- Run this in your Neon database console

-- Add metadata column to Booking table for flexible data storage
ALTER TABLE "Booking" 
ADD COLUMN IF NOT EXISTS "metadata" jsonb; 