import postgres from "postgres";

// Database connection string from .env
const DATABASE_URL = "postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/muaythai?sslmode=require";

const sql = postgres(DATABASE_URL);

async function checkDatabase() {
  try {
    console.log("Connected to database successfully!");
    
    // 1. Check all regions
    console.log("\n--- All Regions ---");
    const regions = await sql`
      SELECT id, name, slug, "createdAt", "updatedAt"
      FROM "Region"
      ORDER BY name
    `;
    
    console.log(`Found ${regions.length} regions:`);
    regions.forEach(r => {
      console.log(`- ${r.name} (${r.slug}), ID: ${r.id}`);
    });
    
    // 2. Check if Chiang Mai region exists
    console.log("\n--- Checking for Chiang Mai region ---");
    const chiangMaiRegions = await sql`
      SELECT * FROM "Region" 
      WHERE slug = 'chiang-mai' OR name ILIKE ${'%chiang mai%'}
    `;
    
    if (chiangMaiRegions.length > 0) {
      console.log(`Found Chiang Mai region: ID = ${chiangMaiRegions[0]?.id || 'unknown'}`);
    } else {
      console.log("Chiang Mai region NOT found in database!");
    }
    
    // 3. Count events per region
    console.log("\n--- Events per Region ---");
    const eventsPerRegion = await sql`
      SELECT r.name, r.slug, COUNT(e.id) as event_count
      FROM "Region" r
      LEFT JOIN "Event" e ON r.id = e."regionId"
      GROUP BY r.id, r.name, r.slug
      ORDER BY event_count DESC
    `;
    
    eventsPerRegion.forEach(r => {
      console.log(`- ${r.name}: ${r.event_count} events`);
    });
    
    // 4. Check upcoming events
    console.log("\n--- Upcoming Events ---");
    const upcomingEvents = await sql`
      SELECT 
        e.id, 
        e.title, 
        e.date, 
        r.name as region_name, 
        r.slug as region_slug,
        v.name as venue_name
      FROM "Event" e
      JOIN "Region" r ON e."regionId" = r.id
      LEFT JOIN "Venue" v ON e."venueId" = v.id
      WHERE e.date >= CURRENT_TIMESTAMP
      ORDER BY e.date ASC
      LIMIT 10
    `;
    
    console.log(`Found ${upcomingEvents.length} upcoming events:`);
    upcomingEvents.forEach(e => {
      const date = new Date(e.date).toLocaleDateString();
      console.log(`- [${date}] ${e.title} in ${e.region_name} at ${e.venue_name || 'Unknown venue'}`);
    });
    
    // 5. If specified region has events, show them
    if (chiangMaiRegions.length > 0) {
      const regionId = chiangMaiRegions[0]?.id;
      if (regionId) {
        console.log(`\n--- Chiang Mai Events (Region ID: ${regionId}) ---`);
        
        const regionEvents = await sql`
          SELECT e.id, e.title, e.date, v.name as venue_name
          FROM "Event" e
          LEFT JOIN "Venue" v ON e."venueId" = v.id
          WHERE e."regionId" = ${regionId}
          ORDER BY e.date
        `;
        
        if (regionEvents.length > 0) {
          console.log(`Found ${regionEvents.length} events in Chiang Mai:`);
          regionEvents.forEach(e => {
            const date = new Date(e.date).toLocaleDateString();
            console.log(`- [${date}] ${e.title} at ${e.venue_name || 'Unknown venue'}`);
          });
        } else {
          console.log("No events found for Chiang Mai.");
        }
      }
    }
    
  } catch (error) {
    console.error("Database error:", error);
  } finally {
    await sql.end();
    console.log("\nDatabase connection closed.");
  }
}

// Run the check
checkDatabase().catch(console.error); 