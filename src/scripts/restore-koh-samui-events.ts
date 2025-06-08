import { createId } from "@paralleldrive/cuid2";
import { db } from "~/server/db";
import { events, venues, regions } from "~/server/db/schema";
import { eq } from "drizzle-orm";

async function restoreKohSamuiEvents() {
  console.log("🔄 Restoring Koh Samui events to database...");

  try {
    // Find Koh Samui region
    const kohSamuiRegion = await db.query.regions.findFirst({
      where: eq(regions.slug, "koh-samui"),
    });

    if (!kohSamuiRegion) {
      console.log("❌ Koh Samui region not found");
      return;
    }

    console.log(`📍 Found Koh Samui region: ${kohSamuiRegion.name} (ID: ${kohSamuiRegion.id})`);

    // Find or create a venue in Koh Samui
    let kohSamuiVenue = await db.query.venues.findFirst({
      where: eq(venues.regionId, kohSamuiRegion.id),
    });

    if (!kohSamuiVenue) {
      console.log("🏟️ Creating venue in Koh Samui...");
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

    // Restore the events that were deleted
    const today = new Date();
    const eventsToRestore = [
      {
        title: "Ruampon kon Samui",
        description: "Traditional Muay Thai fight night featuring local and regional champions",
        date: new Date(2025, 3, 7), // April 7, 2025
        startTime: new Date(2025, 3, 7, 19, 0), // 7:00 PM
        endTime: new Date(2025, 3, 7, 22, 0), // 10:00 PM
        thumbnailUrl: "https://images.unsplash.com/photo-1555597673-b21d5c935865?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
      {
        title: "Thailand's Elite MuayThai Fighters!!",
        description: "Premier championship featuring Thailand's top Muay Thai fighters",
        date: new Date(2025, 3, 19), // April 19, 2025
        startTime: new Date(2025, 3, 19, 18, 0), // 6:00 PM
        endTime: new Date(2025, 3, 19, 21, 0), // 9:00 PM
        thumbnailUrl: "https://images.unsplash.com/photo-1583473848882-f9a5bc7fd2ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
      {
        title: "samui test",
        description: "Test event for Koh Samui venue operations",
        date: new Date(2025, 3, 23), // April 23, 2025
        startTime: new Date(2025, 3, 23, 19, 0), // 7:00 PM
        endTime: new Date(2025, 3, 23, 22, 0), // 10:00 PM
        thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
      {
        title: "Super Pro fight",
        description: "Professional Muay Thai championship with international fighters",
        date: new Date(2025, 4, 21), // May 21, 2025
        startTime: new Date(2025, 4, 21, 20, 0), // 8:00 PM
        endTime: new Date(2025, 4, 21, 23, 0), // 11:00 PM
        thumbnailUrl: "https://images.unsplash.com/photo-1555597673-b21d5c935865?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
      {
        title: "MUAY THAI SUPER FIGHT",
        description: "Ultimate Muay Thai showdown with top contenders",
        date: new Date(2025, 5, 8), // June 8, 2025
        startTime: new Date(2025, 5, 8, 19, 0), // 7:00 PM
        endTime: new Date(2025, 5, 8, 22, 0), // 10:00 PM
        thumbnailUrl: "https://images.unsplash.com/photo-1583473848882-f9a5bc7fd2ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
      {
        title: "Samui Fight Night Championship",
        description: "Premier Muay Thai championship featuring local and international fighters on the beautiful island of Koh Samui",
        date: new Date(2025, 5, 11), // June 11, 2025
        startTime: new Date(2025, 5, 11, 19, 0), // 7:00 PM
        endTime: new Date(2025, 5, 11, 22, 0), // 10:00 PM
        thumbnailUrl: "https://images.unsplash.com/photo-1555597673-b21d5c935865?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
      {
        title: "Island Warriors Tournament",
        description: "Traditional Muay Thai tournament showcasing the fighting spirit of Koh Samui",
        date: new Date(2025, 5, 18), // June 18, 2025
        startTime: new Date(2025, 5, 18, 18, 0), // 6:00 PM
        endTime: new Date(2025, 5, 18, 21, 0), // 9:00 PM
        thumbnailUrl: "https://images.unsplash.com/photo-1583473848882-f9a5bc7fd2ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
      {
        title: "Petchyindee x Phetbuncha",
        description: "Special match featuring legendary fighters Petchyindee and Phetbuncha",
        date: new Date(2025, 5, 23), // June 23, 2025
        startTime: new Date(2025, 5, 23, 19, 30), // 7:30 PM
        endTime: new Date(2025, 5, 23, 22, 30), // 10:30 PM
        thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
      {
        title: "Tropical Muay Thai Spectacular",
        description: "An exciting evening of Muay Thai fights with the sunset as backdrop in paradise",
        date: new Date(2025, 5, 25), // June 25, 2025
        startTime: new Date(2025, 5, 25, 17, 0), // 5:00 PM
        endTime: new Date(2025, 5, 25, 20, 0), // 8:00 PM
        thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      },
    ];

    let restoredCount = 0;

    for (const eventData of eventsToRestore) {
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

      console.log(`✅ Restored event: "${newEvent[0]?.title}"`);
      restoredCount++;
    }

    console.log(`\n🎉 Successfully restored ${restoredCount} Koh Samui events!`);
    console.log("These events will now appear in the main 'Upcoming Events' section and other pages.");

  } catch (error) {
    console.error("❌ Error restoring Koh Samui events:", error);
    throw error;
  }
}

// Run the script
restoreKohSamuiEvents().catch(console.error); 