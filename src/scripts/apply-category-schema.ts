import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import { categories, productToCategories, products } from "../server/db/schema";
import { sql } from "drizzle-orm";

// Load environment variables
dotenv.config();

// Get database connection string
const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function applySchema() {
  console.log(`Connecting to database: ${DATABASE_URL.replace(/:.*@/, ":*****@")}...`);
  
  // Create a postgres connection
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client);
  
  try {
    console.log("Starting schema update...");

    // Check if Category table exists
    const checkCategoryTable = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Category'
      );
    `;
    
    const categoryExists = checkCategoryTable[0]?.exists || false;
    
    if (!categoryExists) {
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
      console.log("Category table created successfully!");
    } else {
      console.log("Category table already exists.");
    }
    
    // Check if ProductToCategory table exists
    const checkJunctionTable = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ProductToCategory'
      );
    `;
    
    const junctionExists = checkJunctionTable[0]?.exists || false;
    
    if (!junctionExists) {
      console.log("Creating ProductToCategory junction table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "ProductToCategory" (
          "id" text PRIMARY KEY,
          "productId" text NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
          "categoryId" text NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
          "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("ProductToCategory table created successfully!");
    } else {
      console.log("ProductToCategory table already exists.");
    }
    
    // Check if categoryId column exists in Product table
    const checkCategoryIdColumn = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Product'
        AND column_name = 'categoryId'
      );
    `;
    
    const categoryIdExists = checkCategoryIdColumn[0]?.exists || false;
    
    if (!categoryIdExists) {
      console.log("Adding categoryId column to Product table...");
      await db.execute(sql`
        ALTER TABLE "Product" 
        ADD COLUMN IF NOT EXISTS "categoryId" text REFERENCES "Category"("id");
      `);
      console.log("categoryId column added to Product table successfully!");
    } else {
      console.log("categoryId column already exists in Product table.");
    }

    console.log("Schema update completed successfully!");
    
  } catch (error) {
    console.error("Error updating schema:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
    console.log("Database connection closed.");
  }
}

// Run the function
applySchema().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
