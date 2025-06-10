-- Fix missing Fighter table columns
-- Run this in your Neon database console

-- Add missing thumbnailUrl column to Fighter table
ALTER TABLE "Fighter" 
ADD COLUMN IF NOT EXISTS "thumbnailUrl" text;

-- Add missing imageUrls array column to Fighter table
ALTER TABLE "Fighter" 
ADD COLUMN IF NOT EXISTS "imageUrls" text[]; 