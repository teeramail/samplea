import { db } from "~/server/db";
import { sql } from "drizzle-orm";
import 'dotenv/config';

const runMigration = async () => {
  try {
    console.log('Starting database migration for Product table...');

    // Add thumbnailUrl column to Product table
    await db.execute(sql`
      ALTER TABLE "Product" 
      ADD COLUMN IF NOT EXISTS "thumbnailUrl" text;
    `);
    console.log('Added thumbnailUrl column to Product table');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Run the migration immediately
runMigration()
  .then(() => {
    console.log('Migration script completed, exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

export default runMigration;
