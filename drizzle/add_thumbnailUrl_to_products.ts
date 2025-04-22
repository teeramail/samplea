import { sql } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { env } from "~/env";

const { Pool } = pg;

// Initialize Postgres connection
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool);

// Define the migration
export async function main() {
  try {
    console.log("Starting migration: Adding thumbnailUrl to Product table");
    
    // Add thumbnailUrl column to the Product table if it doesn't exist
    await db.execute(
      sql`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT`
    );
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
main()
  .then(() => {
    console.log("Migration completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
