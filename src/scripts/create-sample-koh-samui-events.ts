import { createId } from "@paralleldrive/cuid2";
import { db } from "~/server/db";
import { events, venues, regions } from "~/server/db/schema";
import { eq } from "drizzle-orm";

async function createSampleKohSamuiEvents() {
  console.log("Creating sample events for Koh Samui region...");

  try {
    // Find Koh Samui region
    const kohSamuiRegion = await db.query.regions.findFirst({
      where: eq(regions.slug, "koh-samui"),
    });

    if (!kohSamuiRegion) {
      console.error("❌ Koh Samui region not found. Please run ensure-koh-samui-region.ts first.");
      return;
    }

    console.log("📍 Found Koh Samui region:", kohSamuiRegion.name);

    // Find or create a venue in Koh Samui
    let kohSamuiVenue = await db.query.venues.findFirst({
      where: eq(venues.regionId, kohSamuiRegion.id),
    });

    if (!kohSamuiVenue) {
      console.log("🏟️ Creating sample venue in Koh Samui...");
      const newVenue = await db
        .insert(venues)
        .values({
          id: createId(),
          name: "Koh Samui Boxing Stadium",
          address: "Chaweng Beach Road, Bo Put, Koh Samui District, Surat Thani",
          capacity: 1500,
          regionId: kohSamuiRegion.id,
          thumbnailUrl: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
          isFeatured: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      kohSamuiVenue = newVenue[0];
      console.log("✅ Created venue:", kohSamuiVenue?.name);
    } else {
      console.log("✅ Using existing venue:", kohSamuiVenue.name);
    }

    // Create sample events
    const today = new Date();
    const eventsToCreate = [
      {
        title: "Samui Fight Night Championship",
        description: "Premier Muay Thai championship featuring local and international fighters on the beautiful island of Koh Samui",
        date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        startTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), // 7pm
        endTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000), // 10pm
        thumbnailUrl: "https://images.unsplash.com/photo-1555597673-b21d5c935865?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
      {
        title: "Island Warriors Tournament",
        description: "Traditional Muay Thai tournament showcasing the fighting spirit of Koh Samui",
        date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        startTime: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), // 6pm
        endTime: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000), // 9pm
        thumbnailUrl: "https://images.unsplash.com/photo-1583473848882-f9a5bc7fd2ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
      {
        title: "Tropical Muay Thai Spectacular",
        description: "An exciting evening of Muay Thai fights with the sunset as backdrop in paradise",
        date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        startTime: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // 5pm
        endTime: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000), // 8pm
        thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
    ];

    for (const eventData of eventsToCreate) {
      // Check if event with similar title already exists
      const existingEvent = await db.query.events.findFirst({
        where: eq(events.title, eventData.title),
      });

      if (existingEvent) {
        console.log(`⏭️  Event "${eventData.title}" already exists, skipping...`);
        continue;
      }

      const newEvent = await db
        .insert(events)
        .values({
          id: createId(),
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          thumbnailUrl: eventData.thumbnailUrl,
          status: 'SCHEDULED',
          venueId: kohSamuiVenue!.id,
          regionId: kohSamuiRegion.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log(`✅ Created event: "${newEvent[0]?.title}"`);
    }

    console.log("🎉 Sample Koh Samui events created successfully!");

  } catch (error) {
    console.error("❌ Error creating sample events:", error);
    throw error;
  }
}

// Run the script
createSampleKohSamuiEvents()
  .then(() => {
    console.log("🎉 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });

export { createSampleKohSamuiEvents }; 