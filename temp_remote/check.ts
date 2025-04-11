// check-timestamps-simple.ts
import postgres from 'postgres';

// Connect to your database
const connectionString = "postgresql://postgres:postgres@localhost:5432/thaiboxinghub";
const sql = postgres(connectionString);

async function checkTimestamps() {
  try {
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns c
          WHERE c.table_name = t.table_name
          AND c.column_name = 'createdAt'
      );
    `;
    
    console.log("Tables missing timestamp columns:");
    result.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
  } catch (error) {
    console.error("Error checking timestamps:", error);
  } finally {
    await sql.end();
  }
}

checkTimestamps();