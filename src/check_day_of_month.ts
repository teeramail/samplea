import postgres from "postgres";

// Database connection string from .env
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/muaythai?sslmode=require";

async function checkDayOfMonth() {
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log("Checking for dayOfMonth column...");

    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'EventTemplate'
      AND column_name = 'dayOfMonth';
    `;
    
    if (result.length > 0) {
      console.log(`✅ Column found: ${result[0].column_name} (${result[0].data_type})`);
    } else {
      console.log("❌ dayOfMonth column NOT found in the EventTemplate table!");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sql.end();
  }
}

checkDayOfMonth(); 