// check_event_data.js - Check Event table data to see if fields actually exist and contain data
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkEventData() {
  try {
    await client.connect();
    console.log('🔗 Connected to database\n');

    // Check Event table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Event' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Event table columns in PostgreSQL:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check if Event table has any data
    const count = await client.query(`SELECT COUNT(*) FROM "Event"`);
    console.log(`\n📊 Event table has ${count.rows[0].count} rows`);

    if (parseInt(count.rows[0].count) > 0) {
      // Check specific fields that Drizzle comparison says are "missing"
      const sample = await client.query(`
        SELECT 
          id, title, description, date, startTime, endTime, 
          venueId, regionId, status, thumbnailUrl, isDeleted,
          createdAt, updatedAt
        FROM "Event" 
        LIMIT 3
      `);
      
      console.log('\n📝 Sample Event data:');
      sample.rows.forEach((row, i) => {
        console.log(`\n  Event ${i + 1}:`);
        console.log(`    id: ${row.id}`);
        console.log(`    title: ${row.title}`);
        console.log(`    startTime: ${row.starttime}`);
        console.log(`    endTime: ${row.endtime}`);
        console.log(`    venueId: ${row.venueid}`);
        console.log(`    regionId: ${row.regionid}`);
        console.log(`    status: ${row.status}`);
        console.log(`    isDeleted: ${row.isdeleted}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkEventData(); 