/**
 * This script updates specific regions with known IDs to add slugs.
 */

import { config } from 'dotenv';
config();

import postgres from 'postgres';

async function updateSpecificRegions() {
  console.log("Updating specific regions with slugs...");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  // Create a Postgres client
  const sql = postgres(databaseUrl);

  try {
    // First, let's check what regions we have
    const regions = await sql`SELECT id, name FROM "Region"`;
    console.log("Found regions:", regions);

    // Update specific regions from the screenshot
    await sql`UPDATE "Region" SET slug = 'bangkok' WHERE id = 'cac158c-3d56-4e23-81c4-c60951ae33a0'`;
    await sql`UPDATE "Region" SET slug = 'phuket' WHERE id = '514395c7-21ca-4863-b8cf-68161b3ee260'`;
    await sql`UPDATE "Region" SET slug = 'region-vv' WHERE id = '428c74d7-e628-4745-aba3-b29b251d047'`;
    await sql`UPDATE "Region" SET slug = 'test' WHERE id = '167dcf98-3909-4d62-8bd2-a05caf36c8e4'`;

    console.log("Successfully updated specific regions");

    // Verify the updates
    const updatedRegions = await sql`SELECT id, name, slug FROM "Region"`;
    console.log("Updated regions:", updatedRegions);

  } catch (error) {
    console.error("Error updating regions:", error);
  } finally {
    // Close the client connection
    await sql.end();
  }
}

void updateSpecificRegions().then(() => {
  console.log("Script completed");
  process.exit(0);
}); 