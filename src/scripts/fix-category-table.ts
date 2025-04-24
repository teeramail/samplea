/**
 * This script directly creates the Category table and related tables in the database
 * Use this to fix production issues with category creation
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";

// Load environment variables
dotenv.config();

// Get database connection string
const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function fixCategoryTable() {
  console.log(`Connecting to database: ${DATABASE_URL.replace(/:.*@/, ":*****@")}...`);
  
  // Create a postgres connection
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client);
  
  try {
    console.log("Starting category table fix...");

    // 1. Create Category table if it doesn't exist
    console.log("Creating Category table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "Category" (
        "id" text PRIMARY KEY,
        "name" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "description" text,
        "thumbnailUrl" text,
        "imageUrls" text[],
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Create ProductToCategory junction table if it doesn't exist
    console.log("Creating ProductToCategory junction table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "ProductToCategory" (
        "id" text PRIMARY KEY,
        "productId" text NOT NULL,
        "categoryId" text NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
        FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE
      );
    `);
    
    // 3. Add categoryId column to Product table if it doesn't exist
    console.log("Adding categoryId column to Product table if needed...");
    try {
      await db.execute(sql`
        ALTER TABLE "Product" 
        ADD COLUMN IF NOT EXISTS "categoryId" text REFERENCES "Category"("id");
      `);
    } catch (error) {
      console.log("Note: categoryId column might already exist or there was an error adding it");
    }
    
    // 4. Check if tables were created successfully
    const categoryExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Category'
      );
    `;
    
    const junctionExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ProductToCategory'
      );
    `;
    
    console.log(`Category table exists: ${categoryExists[0]?.exists ? 'YES' : 'NO'}`);
    console.log(`ProductToCategory table exists: ${junctionExists[0]?.exists ? 'YES' : 'NO'}`);
    
    console.log("Category table fix completed!");
    
  } catch (error) {
    console.error("Error fixing category table:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
    console.log("Database connection closed.");
  }
}

// Run the function
fixCategoryTable().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
