// Script to create the Products table in the database
import { db } from "~/server/db";
import { sql } from "drizzle-orm";

async function createProductsTable() {
  console.log("Creating Products table...");
  
  try {
    // Create the Products table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "Product" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "price" DOUBLE PRECISION NOT NULL,
        "imageUrls" TEXT[],
        "isFeatured" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Products table created successfully!");
    
    // Insert some sample products
    await db.execute(sql`
      INSERT INTO "Product" ("id", "name", "description", "price", "imageUrls", "isFeatured")
      VALUES 
        ('prod_01', 'Muay Thai Gloves - Red', 'Premium leather Muay Thai gloves for training and competition', 49.99, ARRAY['https://sgp1.digitaloceanspaces.com/teerabucketone/gloves_red.jpg'], true),
        ('prod_02', 'Muay Thai Shorts - Black/Gold', 'Traditional Muay Thai shorts with gold trim', 29.99, ARRAY['https://sgp1.digitaloceanspaces.com/teerabucketone/shorts_black_gold.jpg'], true),
        ('prod_03', 'Hand Wraps - 180"', 'Professional grade hand wraps for protection and support', 12.99, ARRAY['https://sgp1.digitaloceanspaces.com/teerabucketone/hand_wraps.jpg'], true),
        ('prod_04', 'Muay Thai T-Shirt - Thailand Edition', 'Cotton t-shirt with Thailand Muay Thai design', 24.99, ARRAY['https://sgp1.digitaloceanspaces.com/teerabucketone/tshirt_thailand.jpg'], true)
      ON CONFLICT (id) DO NOTHING;
    `);
    
    console.log("Sample products inserted successfully!");
    
  } catch (error) {
    console.error("Error creating Products table:", error);
  }
}

// Run the function
void createProductsTable();
