// Seed script for venue types and venues
import { createId } from "@paralleldrive/cuid2";
import { db } from "./index";
import { regions, venueTypes, venues, venueToVenueTypes } from "./schema";

async function main() {
  console.log("Starting venue and venue type seeding...");

  // First, check if we already have venue types to avoid duplicates
  const existingTypes = await db.query.venueTypes.findMany();
  if (existingTypes.length > 0) {
    console.log(`Found ${existingTypes.length} existing venue types. Skipping venue type creation.`);
  } else {
    // Create venue types
    const venueTypeData = [
      {
        id: "vtype_muaythai",
        name: "Muay Thai",
        description: "Traditional Thai boxing gyms offering authentic Muay Thai training",
      },
      {
        id: "vtype_kickboxing",
        name: "Kickboxing",
        description: "Gyms specializing in kickboxing techniques and training",
      },
      {
        id: "vtype_mma",
        name: "MMA",
        description: "Mixed Martial Arts training facilities",
      },
      {
        id: "vtype_boxing",
        name: "Boxing",
        description: "Traditional boxing gyms",
      },
    ];

    console.log("Creating venue types...");
    for (const type of venueTypeData) {
      await db.insert(venueTypes).values({
        ...type,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`Created ${venueTypeData.length} venue types.`);
  }

  // Check if we have regions, we need at least one
  const existingRegions = await db.query.regions.findMany();
  let defaultRegionId: string;

  if (existingRegions.length > 0 && existingRegions[0]?.id) {
    defaultRegionId = existingRegions[0].id;
    console.log(`Using existing region: ${existingRegions[0].name ?? 'Unknown'}`);
  } else {
    // Create a default region
    const bangkokRegion = {
      id: createId(),
      name: "Bangkok",
      slug: "bangkok",
      description: "Thailand's capital city",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(regions).values(bangkokRegion);
    defaultRegionId = bangkokRegion.id;
    console.log(`Created default region: Bangkok`);
  }

  // Check if we already have venues to avoid duplicates
  const existingVenues = await db.query.venues.findMany();
  if (existingVenues.length > 0) {
    console.log(`Found ${existingVenues.length} existing venues. Skipping venue creation.`);
  } else {
    // Sample venue data
    const venueData = [
      {
        id: createId(),
        name: "Elite Fight Club",
        address: "123 Sukhumvit Rd, Bangkok",
        regionId: defaultRegionId,
        capacity: 100,
        thumbnailUrl: "https://images.unsplash.com/photo-1517438476312-10d79c077509?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bXVheSUyMHRoYWl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
        isFeatured: true,
        types: ["vtype_muaythai", "vtype_kickboxing"],
        primaryType: "vtype_muaythai",
      },
      {
        id: createId(),
        name: "Tiger Muay Thai",
        address: "456 Phuket Rd, Phuket",
        regionId: defaultRegionId,
        capacity: 200,
        thumbnailUrl: "https://images.unsplash.com/photo-1562771379-eafdca7a02f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bXVheSUyMHRoYWl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
        isFeatured: true,
        types: ["vtype_muaythai"],
        primaryType: "vtype_muaythai",
      },
      {
        id: createId(),
        name: "Bangkok Fight Lab",
        address: "789 Silom Rd, Bangkok",
        regionId: defaultRegionId,
        capacity: 150,
        thumbnailUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bXVheSUyMHRoYWl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
        isFeatured: true,
        types: ["vtype_mma", "vtype_muaythai"],
        primaryType: "vtype_mma",
      },
      {
        id: createId(),
        name: "Kickbox Central",
        address: "101 Ratchada Rd, Bangkok",
        regionId: defaultRegionId,
        capacity: 80,
        thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8a2lja2JveGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60",
        isFeatured: true,
        types: ["vtype_kickboxing"],
        primaryType: "vtype_kickboxing",
      },
      {
        id: createId(),
        name: "Champion Boxing Gym",
        address: "202 Thonglor Rd, Bangkok",
        regionId: defaultRegionId,
        capacity: 60,
        thumbnailUrl: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Ym94aW5nfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
        isFeatured: true,
        types: ["vtype_boxing"],
        primaryType: "vtype_boxing",
      },
      {
        id: createId(),
        name: "Warrior Muay Thai",
        address: "303 Asoke Rd, Bangkok",
        regionId: defaultRegionId,
        capacity: 120,
        thumbnailUrl: "https://images.unsplash.com/photo-1544117519-31a4a39cb2bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8dGhhaSUyMGJveGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60",
        isFeatured: true,
        types: ["vtype_muaythai"],
        primaryType: "vtype_muaythai",
      },
    ];

    console.log("Creating venues and venue type associations...");
    for (const venueInfo of venueData) {
      const { id, name, address, regionId, capacity, thumbnailUrl, isFeatured, types, primaryType } = venueInfo;
      
      // Insert venue
      await db.insert(venues).values({
        id,
        name,
        address,
        regionId,
        capacity,
        thumbnailUrl,
        isFeatured,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Insert venue type associations
      for (const typeId of types) {
        await db.insert(venueToVenueTypes).values({
          id: createId(),
          venueId: id,
          venueTypeId: typeId,
          isPrimary: typeId === primaryType,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    console.log(`Created ${venueData.length} venues with type associations.`);
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(() => {
    console.log("Seed script execution completed.");
    process.exit(0);
  });
