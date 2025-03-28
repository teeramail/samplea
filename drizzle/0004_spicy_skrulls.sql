ALTER TABLE "Region" ADD COLUMN "imageUrls" text[];--> statement-breakpoint
ALTER TABLE "Region" ADD COLUMN "primaryImageIndex" integer DEFAULT 0;