import { db } from '~/server/db';
import { sql } from 'drizzle-orm';

const runMigration = async () => {
  try {
    console.log('Starting database migration for Customer table...');

    // Create the Customer table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "Customer" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text REFERENCES "User"("id"),
        "name" text NOT NULL,
        "email" text NOT NULL,
        "phone" text,
        "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('Customer table created successfully');

    // Add customerId column to Booking
    await db.execute(sql`
      ALTER TABLE "Booking" 
        ADD COLUMN IF NOT EXISTS "customerId" text REFERENCES "Customer"("id");
    `);
    console.log('Added customerId column to Booking table');

    // Make customerId NOT NULL
    await db.execute(sql`
      ALTER TABLE "Booking" 
        ALTER COLUMN "customerId" SET NOT NULL;
    `);
    console.log('Set customerId column as NOT NULL');

    // Drop the foreign key constraint for userId
    await db.execute(sql`
      ALTER TABLE "Booking" 
        DROP CONSTRAINT IF EXISTS "Booking_userId_User_id_fk";
    `);
    console.log('Dropped userId foreign key constraint');

    // Drop userId column from Booking table
    await db.execute(sql`
      ALTER TABLE "Booking" 
        DROP COLUMN IF EXISTS "userId";
    `);
    console.log('Dropped userId column from Booking table');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// If running this script directly
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