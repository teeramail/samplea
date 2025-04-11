import { db } from '~/server/db';
import { sql } from 'drizzle-orm';

const runMigration = async () => {
  try {
    console.log('Starting migration to add payment fields to Booking table...');

    // Add missing payment fields to Booking table
    await db.execute(sql`
      ALTER TABLE "Booking" 
        ADD COLUMN IF NOT EXISTS "paymentTransactionId" text,
        ADD COLUMN IF NOT EXISTS "paymentBankCode" text,
        ADD COLUMN IF NOT EXISTS "paymentBankRefCode" text,
        ADD COLUMN IF NOT EXISTS "paymentDate" text,
        ADD COLUMN IF NOT EXISTS "paymentMethod" text;
    `);
    console.log('Added payment fields to Booking table successfully');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// If this script is executed directly, run the migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed, exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default runMigration; 