CREATE TABLE IF NOT EXISTS "Booking" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"eventId" text NOT NULL,
	"totalAmount" double precision NOT NULL,
	"paymentStatus" text DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "EventTicket" (
	"id" text PRIMARY KEY NOT NULL,
	"eventId" text NOT NULL,
	"seatType" text NOT NULL,
	"price" double precision NOT NULL,
	"capacity" integer NOT NULL,
	"description" text,
	"soldCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Ticket" (
	"id" text PRIMARY KEY NOT NULL,
	"eventId" text NOT NULL,
	"eventDetailId" text NOT NULL,
	"bookingId" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Event" ALTER COLUMN "date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "Event" ALTER COLUMN "startTime" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "Event" ALTER COLUMN "endTime" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "Event" ALTER COLUMN "createdAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "Event" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "Fighter" ALTER COLUMN "createdAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "Fighter" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "Venue" ALTER COLUMN "regionId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Venue" ALTER COLUMN "createdAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "Venue" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "Fighter" ADD COLUMN "record" text;--> statement-breakpoint
ALTER TABLE "Fighter" ADD COLUMN "imageUrl" text;--> statement-breakpoint
ALTER TABLE "Fighter" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "Region" ADD COLUMN "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "Region" ADD COLUMN "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "emailVerified" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "image" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Booking" ADD CONSTRAINT "Booking_eventId_Event_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_eventId_Event_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_Event_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventDetailId_EventTicket_id_fk" FOREIGN KEY ("eventDetailId") REFERENCES "public"."EventTicket"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_bookingId_Booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
