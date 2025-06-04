import { db } from "~/server/db";
import { regions, events, venues } from "~/server/db/schema";
import { eq } from "drizzle-orm";

async function debugKohSamuiData() {
  console.log("🔍 Debugging Koh Samui data...");

  try {
    // 1. Check all regions to see what exists
    console.log("\n📍 All regions in database:");
    const allRegions = await db.query.regions.findMany();
    allRegions.forEach((region, index) => {
      console.log(`${index + 1}. ID: "${region.id}", Name: "${region.name}", Slug: "${region.slug}"`);
    });

    // 2. Look for Koh Samui specifically
    console.log("\n🏝️ Looking for Koh Samui region:");
    const kohSamuiBySlug = await db.query.regions.findFirst({
      where: eq(regions.slug, "koh-samui"),
    });
    
    if (kohSamuiBySlug) {
      console.log(`✅ Found Koh Samui by slug: ID="${kohSamuiBySlug.id}", Name="${kohSamuiBySlug.name}"`);
    } else {
      console.log("❌ No region found with slug 'koh-samui'");
    }

    // 3. Look for any region with "Samui" in the name
    const allSamuiRegions = allRegions.filter(r => 
      r.name.toLowerCase().includes('samui') || r.slug.toLowerCase().includes('samui')
    );
    
    console.log("\n🔍 All regions containing 'Samui':");
    allSamuiRegions.forEach((region, index) => {
      console.log(`${index + 1}. ID: "${region.id}", Name: "${region.name}", Slug: "${region.slug}"`);
    });

    // 4. Check all events and their regions
    console.log("\n🎪 All events in database:");
    const allEvents = await db.query.events.findMany({
      with: {
        region: true,
        venue: true,
      }
    });
    
    allEvents.forEach((event, index) => {
      console.log(`${index + 1}. "${event.title}" - Region: "${event.region?.name}" (ID: ${event.regionId}) - Status: ${event.status}`);
    });

    // 5. Check events specifically for our Koh Samui region
    if (kohSamuiBySlug) {
      console.log(`\n🎯 Events for Koh Samui region (ID: ${kohSamuiBySlug.id}):`);
      const kohSamuiEvents = await db.query.events.findMany({
        where: eq(events.regionId, kohSamuiBySlug.id),
        with: {
          region: true,
          venue: true,
        }
      });
      
      console.log(`Found ${kohSamuiEvents.length} events in Koh Samui region:`);
      kohSamuiEvents.forEach((event, index) => {
        console.log(`${index + 1}. "${event.title}" - Status: ${event.status} - Date: ${event.date}`);
      });
    }

    // 6. Check events with our sample titles
    console.log("\n🎬 Looking for our sample events:");
    const sampleTitles = [
      "Samui Fight Night Championship",
      "Island Warriors Tournament", 
      "Tropical Muay Thai Spectacular"
    ];
    
    for (const title of sampleTitles) {
      const event = await db.query.events.findFirst({
        where: eq(events.title, title),
        with: {
          region: true,
          venue: true,
        }
      });
      
      if (event) {
        console.log(`✅ "${title}" - Region: "${event.region?.name}" (ID: ${event.regionId}) - Status: ${event.status}`);
      } else {
        console.log(`❌ "${title}" - Not found`);
      }
    }

  } catch (error) {
    console.error("❌ Error debugging data:", error);
  }
}

// Run the script
debugKohSamuiData()
  .then(() => {
    console.log("\n🎉 Debug completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Debug failed:", error);
    process.exit(1);
  });

export { debugKohSamuiData }; 