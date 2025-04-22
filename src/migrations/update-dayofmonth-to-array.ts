import postgres from "postgres";
import { config } from "dotenv";

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/muaythai?sslmode=require";

async function migrateDayOfMonthToArray() {
  console.log("Starting migration: Converting dayOfMonth from integer to integer[]");
  
  // Connect to database
  const sql = postgres(DATABASE_URL);
  
  try {
    // 1. First check if the column exists and what type it is
    const columnCheck = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'EventTemplate' 
      AND column_name = 'dayOfMonth';
    `;
    
    if (columnCheck.length === 0) {
      console.log("dayOfMonth column not found in EventTemplate table. No migration needed.");
      return;
    }
    
    console.log(`Found column: ${columnCheck[0]?.column_name ?? 'unnamed'} (${columnCheck[0]?.data_type ?? 'unknown'})`);
    
    // 2. Create a temporary backup of existing values
    console.log("Creating backup of existing dayOfMonth values...");
    await sql`
      ALTER TABLE "EventTemplate" 
      ADD COLUMN "dayOfMonthBackup" INTEGER;
    `;
    
    await sql`
      UPDATE "EventTemplate" 
      SET "dayOfMonthBackup" = "dayOfMonth" 
      WHERE "dayOfMonth" IS NOT NULL;
    `;
    
    console.log("Backup created.");
    
    // 3. Alter the column type from integer to integer[]
    console.log("Altering dayOfMonth column to integer[]...");
    
    // First drop the original column
    await sql`
      ALTER TABLE "EventTemplate" 
      DROP COLUMN "dayOfMonth";
    `;
    
    // Then add it back as an array type
    await sql`
      ALTER TABLE "EventTemplate" 
      ADD COLUMN "dayOfMonth" INTEGER[];
    `;
    
    console.log("Column type changed.");
    
    // 4. Migrate existing data - convert single integers to arrays
    console.log("Migrating existing data to arrays...");
    await sql`
      UPDATE "EventTemplate" 
      SET "dayOfMonth" = ARRAY["dayOfMonthBackup"] 
      WHERE "dayOfMonthBackup" IS NOT NULL;
    `;
    
    console.log("Data migration complete.");
    
    // 5. Clean up the backup column
    console.log("Removing backup column...");
    await sql`
      ALTER TABLE "EventTemplate" 
      DROP COLUMN "dayOfMonthBackup";
    `;
    
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await sql.end();
  }
}

// Run the migration
migrateDayOfMonthToArray().catch(console.error); 