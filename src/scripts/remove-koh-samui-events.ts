import { db } from "~/server/db";
import { events, regions } from "~/server/db/schema";
import { eq } from "drizzle-orm";

async function removeKohSamuiEvents() {
  console.log("🗑️ Removing all events from Koh Samui region...");

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

    // Get all events in Koh Samui region
    const kohSamuiEvents = await db.query.events.findMany({
      where: eq(events.regionId, kohSamuiRegion.id),
      columns: {
        id: true,
        title: true,
        date: true,
        status: true,
      },
    });

    console.log(`\n📅 Found ${kohSamuiEvents.length} events in Koh Samui region:`);
    kohSamuiEvents.forEach((event, index) => {
      console.log(`${index + 1}. "${event.title}" - ${event.date.toDateString()} - Status: ${event.status}`);
    });

    if (kohSamuiEvents.length === 0) {
      console.log("✅ No events found in Koh Samui region. Nothing to remove.");
      return;
    }

    // Confirm deletion
    console.log(`\n⚠️  About to delete ${kohSamuiEvents.length} events from Koh Samui region...`);
    
    // Delete all events in Koh Samui region
    const deletedEvents = await db
      .delete(events)
      .where(eq(events.regionId, kohSamuiRegion.id))
      .returning({ id: events.id, title: events.title });

    console.log(`\n✅ Successfully deleted ${deletedEvents.length} events:`);
    deletedEvents.forEach((event, index) => {
      console.log(`${index + 1}. "${event.title}" (ID: ${event.id})`);
    });

    console.log("\n🎉 All Koh Samui events have been removed successfully!");

  } catch (error) {
    console.error("❌ Error removing Koh Samui events:", error);
    throw error;
  }
}

// Run the script
removeKohSamuiEvents().catch(console.error); 