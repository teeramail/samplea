/**
 * This script adds a slug to all existing regions in the database.
 * Run it once to migrate data after adding the slug column.
 */

// Load environment variables directly from .env file
import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { regions } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// Helper function to generate a URL-friendly slug from a name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .trim();
};

async function updateRegionSlugs() {
  console.log("Updating slugs for all regions...");

  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    console.log("Connecting to database...");

    // Create a Postgres client
    const client = postgres(databaseUrl);
    // Create a Drizzle client
    const db = drizzle(client);

    // Get all regions
    const allRegions = await db.select().from(regions);
    console.log(`Found ${allRegions.length} regions to update`);

    // Update each region with a slug based on its name
    for (const region of allRegions) {
      const slug = generateSlug(region.name);
      console.log(`Updating region "${region.name}" with slug "${slug}"`);

      await db.update(regions).set({ slug }).where(eq(regions.id, region.id));
    }

    console.log("Successfully updated all region slugs");

    // Close the client connection
    await client.end();
  } catch (error) {
    console.error("Error updating region slugs:", error);
    process.exit(1);
  }
}

// Run the function
void updateRegionSlugs().then(() => {
  console.log("Script completed");
  process.exit(0);
});
