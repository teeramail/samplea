ALTER TABLE "Event" ADD COLUMN "imageUrl" text;--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "usesDefaultPoster" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "regionId" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Event" ADD CONSTRAINT "Event_regionId_Region_id_fk" FOREIGN KEY ("regionId") REFERENCES "public"."Region"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "Region" DROP COLUMN IF EXISTS "countryCode";--> statement-breakpoint
ALTER TABLE "Region" DROP COLUMN IF EXISTS "createdAt";--> statement-breakpoint
ALTER TABLE "Region" DROP COLUMN IF EXISTS "updatedAt";