-- Migration to add thumbnailUrl and imageUrls fields to Instructor table
-- This adds support for the new image upload system with thumbnail (30KB) and gallery images (120KB each)

-- Add thumbnailUrl field for 30KB compressed thumbnails
ALTER TABLE "Instructor" ADD COLUMN "thumbnailUrl" text;

-- Add imageUrls field for gallery images array (up to 8 images, 120KB each)
ALTER TABLE "Instructor" ADD COLUMN "imageUrls" text[];

-- The imageUrl field is kept for backward compatibility 