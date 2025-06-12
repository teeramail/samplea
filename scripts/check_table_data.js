// check_table_data.js - Check if tables contain data before deletion
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const tablesToCheck = [
  'Customer',
  'Post', 
  'VenueToVenueType',
  'account',
  'session',
  'verification_token'
];

async function checkTableData() {
  try {
    await client.connect();
    console.log('🔗 Connected to database\n');

    for (const table of tablesToCheck) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM "${table}"`);
        const count = parseInt(result.rows[0].count);
        
        if (count > 0) {
          console.log(`⚠️  ${table}: ${count} rows (HAS DATA)`);
          
          // Show sample data for critical tables
          if (['account', 'session', 'Customer'].includes(table)) {
            const sample = await client.query(`SELECT * FROM "${table}" LIMIT 2`);
            console.log(`   Sample: ${Object.keys(sample.rows[0] || {}).join(', ')}`);
          }
        } else {
          console.log(`✅ ${table}: ${count} rows (EMPTY)`);
        }
      } catch (error) {
        console.log(`❌ ${table}: Error checking - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await client.end();
  }
}

checkTableData(); 