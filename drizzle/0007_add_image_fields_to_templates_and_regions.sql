-- Migration: Add image fields to EventTemplate and thumbnailUrl to Region
-- Date: ${new Date().toISOString()}

-- Add thumbnailUrl field to Region table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Region' AND column_name = 'thumbnailUrl') THEN
        ALTER TABLE "Region" ADD COLUMN "thumbnailUrl" TEXT;
    END IF;
END $$;

-- Add image fields to EventTemplate table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'EventTemplate' AND column_name = 'thumbnailUrl') THEN
        ALTER TABLE "EventTemplate" ADD COLUMN "thumbnailUrl" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'EventTemplate' AND column_name = 'imageUrls') THEN
        ALTER TABLE "EventTemplate" ADD COLUMN "imageUrls" TEXT[];
    END IF;
END $$; 