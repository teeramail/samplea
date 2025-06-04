import { db } from "~/server/db";
import { regions, events } from "~/server/db/schema";
import { eq, gte, and } from "drizzle-orm";

async function verifyKohSamuiFix() {
  console.log("🔍 Verifying Koh Samui fix...");

  try {
    // Check if Koh Samui region exists
    const kohSamuiRegion = await db.query.regions.findFirst({
      where: eq(regions.slug, "koh-samui"),
    });

    if (!kohSamuiRegion) {
      console.log("❌ Koh Samui region not found");
      return false;
    }

    console.log(`✅ Koh Samui region found: ${kohSamuiRegion.name} (ID: ${kohSamuiRegion.id})`);

    // Check upcoming events using the same logic as the region page
    const now = new Date();
    const todayAtMidnightUTC = new Date(now);
    todayAtMidnightUTC.setUTCHours(0, 0, 0, 0);

    const upcomingEvents = await db.query.events.findMany({
      columns: {
        id: true,
        title: true,
        date: true,
        status: true,
      },
      where: and(
        eq(events.regionId, kohSamuiRegion.id),
        gte(events.date, todayAtMidnightUTC),
        eq(events.status, 'SCHEDULED')
      ),
      limit: 5,
    });

    console.log(`\n📅 Found ${upcomingEvents.length} upcoming scheduled events:`);
    upcomingEvents.forEach((event, index) => {
      console.log(`${index + 1}. "${event.title}" - ${event.date.toDateString()} - Status: ${event.status}`);
    });

    // Test the API endpoint
    console.log("\n🌐 Testing API endpoint...");
    const response = await fetch("http://localhost:3000/api/regions");
    if (response.ok) {
      const apiRegions = await response.json() as Array<{name: string, slug: string}>;
      const kohSamuiInApi = apiRegions.find(r => r.slug === "koh-samui");
      
      if (kohSamuiInApi) {
        console.log(`✅ Koh Samui appears in API: ${kohSamuiInApi.name}`);
      } else {
        console.log("❌ Koh Samui not found in API response");
      }
    } else {
      console.log("❌ API request failed");
    }

    const success = upcomingEvents.length > 0;
    console.log(`\n${success ? '🎉' : '❌'} ${success ? 'SUCCESS' : 'FAILED'}: Koh Samui region page should ${success ? 'show events' : 'be empty'}`);
    
    return success;

  } catch (error) {
    console.error("❌ Error verifying fix:", error);
    return false;
  }
}

// Run the verification
verifyKohSamuiFix()
  .then((success) => {
    console.log(`\n${success ? '✅' : '❌'} Verification ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Verification failed:", error);
    process.exit(1);
  });

export { verifyKohSamuiFix }; 