-- Manual Migration: Add image fields to EventTemplate and thumbnailUrl to Region
-- Run these commands in pgAdmin

-- Add thumbnailUrl field to Region table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Region' AND column_name = 'thumbnailUrl') THEN
        ALTER TABLE "Region" ADD COLUMN "thumbnailUrl" TEXT;
        RAISE NOTICE 'Added thumbnailUrl column to Region table';
    ELSE
        RAISE NOTICE 'thumbnailUrl column already exists in Region table';
    END IF;
END $$;

-- Add image fields to EventTemplate table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'EventTemplate' AND column_name = 'thumbnailUrl') THEN
        ALTER TABLE "EventTemplate" ADD COLUMN "thumbnailUrl" TEXT;
        RAISE NOTICE 'Added thumbnailUrl column to EventTemplate table';
    ELSE
        RAISE NOTICE 'thumbnailUrl column already exists in EventTemplate table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'EventTemplate' AND column_name = 'imageUrls') THEN
        ALTER TABLE "EventTemplate" ADD COLUMN "imageUrls" TEXT[];
        RAISE NOTICE 'Added imageUrls column to EventTemplate table';
    ELSE
        RAISE NOTICE 'imageUrls column already exists in EventTemplate table';
    END IF;
END $$; 