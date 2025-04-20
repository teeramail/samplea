import postgres from "postgres";

// Database connection string from .env
const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/muaythai?sslmode=require";

console.log(`Attempting to connect to database: ${DATABASE_URL.replace(/:.*@/, ":*****@")}...`);

let sql: postgres.Sql | undefined = undefined;

async function verifyEventTemplateSchema(): Promise<void> {
  try {
    sql = postgres(DATABASE_URL, { 
      max: 1, // Use a single connection
      onnotice: (notice) => console.log(`DB Notice: ${notice.message}`),
      // Add more logging or connection options if needed
    });
    console.log("Database connection initiated.");
    
    // Attempt a simple query first to ensure connection
    await sql`SELECT 1`;
    console.log("Simple query successful. Proceeding with schema checks...");

    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' -- Or your specific schema if not public
      AND table_name = 'EventTemplate'
      ORDER BY ordinal_position;
    `;
    
    console.log("\n--- Columns found in 'EventTemplate' table ---");
    if (columns.length === 0) {
      console.log("Table 'EventTemplate' not found or has no columns.");
    } else {
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, Nullable: ${col.is_nullable}, Default: ${col.column_default ?? 'NULL'})`);
      });
      // Explicitly check for new columns
      const expectedColumns = ['recurrenceType', 'recurringDaysOfWeek', 'dayOfMonth', 'startDate', 'endDate'];
      // Add explicit typing to avoid 'any' return type
      const foundColumns: string[] = columns.map(c => c.column_name as string);
      expectedColumns.forEach(ec => {
         if (!foundColumns.includes(ec)) {
            console.warn(`WARNING: Expected column '${ec}' NOT FOUND in EventTemplate table!`);
         }
      });
    }

    // Check for the enum type specifically
    console.log("\n--- Checking for 'recurrence_type' enum ---");
    const enumCheck = await sql`
      SELECT typname FROM pg_type WHERE typname = 'recurrence_type';
    `;
    if (enumCheck.length > 0 && enumCheck[0]?.typname === 'recurrence_type') {
      console.log("Enum 'recurrence_type' found.");
    } else {
      console.warn("WARNING: Enum 'recurrence_type' NOT found.");
    }
    
    // Simple check on a related table (ensure migration didn't break others)
     console.log("\n--- Quick check on 'EventTemplateTicket' table ---");
     const ticketColumns = await sql`
       SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' 
       AND table_name = 'EventTemplateTicket'
     `;
      console.log(`Found ${ticketColumns.length} columns in 'EventTemplateTicket'.`);

     console.log("\nSchema verification completed.");

  } catch (error) {
    console.error("Database verification error:", error instanceof Error ? error.message : String(error));
    if (error instanceof postgres.PostgresError) {
      console.error("SQL Error Code:", error.code);
      console.error("SQL State:", error.routine);
    }
  } finally {
    if (sql) {
       await sql.end({ timeout: 5 }); // Add timeout
       console.log("Database connection closed.");
    } else {
       console.log("SQL connection was not established.");
    }
  }
}

// Run the verification
void verifyEventTemplateSchema();

setTimeout(() => {
  console.log('Closing db connection...');
  if (sql) {
    sql.end().catch((e: Error) => {
      console.error('Error during timeout cleanup:', e.message);
    });
  }
}, 5000); 