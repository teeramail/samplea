// simple_schema_compare.js - Reliable PostgreSQL vs Drizzle comparison
// Using manual table definitions instead of fragile regex parsing
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Expected Drizzle schema based on actual code inspection
const drizzleSchema = {
  Region: ['id', 'name', 'slug', 'description', 'thumbnailUrl', 'imageUrls', 'primaryImageIndex', 'metaTitle', 'metaDescription', 'keywords', 'createdAt', 'updatedAt'],
  Venue: ['id', 'name', 'address', 'capacity', 'regionId', 'latitude', 'longitude', 'thumbnailUrl', 'imageUrls', 'isFeatured', 'googleMapsUrl', 'remarks', 'socialMediaLinks', 'metaTitle', 'metaDescription', 'keywords', 'createdAt', 'updatedAt'],
  VenueType: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
  EventCategory: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
  Event: ['id', 'title', 'description', 'date', 'startTime', 'endTime', 'thumbnailUrl', 'imageUrls', 'venueId', 'regionId', 'status', 'categoryId', 'isDeleted', 'createdAt', 'updatedAt'],
  EventTicket: ['id', 'eventId', 'seatType', 'price', 'discountedPrice', 'cost', 'capacity', 'description', 'soldCount', 'createdAt', 'updatedAt'],
  Fighter: ['id', 'name', 'nickname', 'weightClass', 'record', 'biography', 'thumbnailUrl', 'imageUrl', 'imageUrls', 'country', 'isFeatured', 'createdAt', 'updatedAt'],
  User: ['id', 'email', 'name', 'emailVerified', 'image', 'role', 'createdAt', 'updatedAt'],
  Instructor: ['id', 'name', 'bio', 'imageUrl', 'thumbnailUrl', 'imageUrls', 'expertise', 'userId', 'createdAt', 'updatedAt'],
  TrainingCourse: ['id', 'title', 'slug', 'description', 'skillLevel', 'duration', 'scheduleDetails', 'price', 'capacity', 'venueId', 'regionId', 'instructorId', 'thumbnailUrl', 'imageUrls', 'primaryImageIndex', 'isActive', 'isFeatured', 'metaTitle', 'metaDescription', 'keywords', 'createdAt', 'updatedAt'],
  Category: ['id', 'name', 'slug', 'description', 'thumbnailUrl', 'imageUrls', 'createdAt', 'updatedAt'],
  ProductToCategory: ['id', 'productId', 'categoryId', 'createdAt'],
  Product: ['id', 'name', 'description', 'price', 'thumbnailUrl', 'imageUrls', 'categoryId', 'isFeatured', 'stock', 'createdAt', 'updatedAt'],
  Booking: ['id', 'customerId', 'eventId', 'totalAmount', 'paymentStatus', 'metadata', 'paymentOrderNo', 'paymentTransactionId', 'paymentBankCode', 'paymentBankRefCode', 'paymentDate', 'paymentMethod', 'createdAt', 'updatedAt', 'customerNameSnapshot', 'customerEmailSnapshot', 'customerPhoneSnapshot', 'eventTitleSnapshot', 'eventDateSnapshot', 'venueNameSnapshot', 'regionNameSnapshot', 'bookingItemsJson'],
  Ticket: ['id', 'eventId', 'eventDetailId', 'bookingId', 'status', 'createdAt', 'updatedAt'],
  CourseEnrollment: ['id', 'customerId', 'courseId', 'pricePaid', 'status', 'enrollmentDate', 'startDate', 'courseTitleSnapshot', 'customerNameSnapshot', 'customerEmailSnapshot', 'createdAt', 'updatedAt'],
  EventTemplate: ['id', 'templateName', 'venueId', 'regionId', 'defaultTitleFormat', 'defaultDescription', 'thumbnailUrl', 'imageUrls', 'recurrenceType', 'recurringDaysOfWeek', 'dayOfMonth', 'defaultStartTime', 'defaultEndTime', 'isActive', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
  EventTemplateTicket: ['id', 'eventTemplateId', 'seatType', 'defaultPrice', 'defaultCapacity', 'defaultDescription', 'createdAt', 'updatedAt']
};

async function getPostgresColumns() {
  await client.connect();
  
  const query = `
    SELECT table_name, column_name 
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `;
  
  const res = await client.query(query);
  await client.end();
  
  const tables = {};
  for (const row of res.rows) {
    if (!tables[row.table_name]) {
      tables[row.table_name] = [];
    }
    tables[row.table_name].push(row.column_name);
  }
  
  return tables;
}

async function compareSchemas() {
  console.log('🔍 Comparing PostgreSQL vs Drizzle schemas...\\n');
  
  const pgTables = await getPostgresColumns();
  const pgTableNames = Object.keys(pgTables);
  const drizzleTableNames = Object.keys(drizzleSchema);
  
  // Find table differences
  const onlyInPg = pgTableNames.filter(t => !drizzleTableNames.includes(t));
  const onlyInDrizzle = drizzleTableNames.filter(t => !pgTableNames.includes(t));
  
  console.log('📊 SUMMARY:');
  console.log(`PostgreSQL: ${pgTableNames.length} tables`);
  console.log(`Drizzle: ${drizzleTableNames.length} tables\\n`);
  
  if (onlyInPg.length > 0) {
    console.log('❌ Tables only in PostgreSQL:');
    onlyInPg.forEach(table => console.log(`   - ${table}`));
    console.log();
  }
  
  if (onlyInDrizzle.length > 0) {
    console.log('❌ Tables only in Drizzle:');
    onlyInDrizzle.forEach(table => console.log(`   - ${table}`));
    console.log();
  }
  
  // Compare common tables
  const commonTables = pgTableNames.filter(t => drizzleTableNames.includes(t));
  let hasColumnDifferences = false;
  
  for (const tableName of commonTables) {
    const pgCols = pgTables[tableName];
    const drizzleCols = drizzleSchema[tableName];
    
    const missingFromDrizzle = pgCols.filter(col => !drizzleCols.includes(col));
    const missingFromPg = drizzleCols.filter(col => !pgCols.includes(col));
    
    if (missingFromDrizzle.length > 0 || missingFromPg.length > 0) {
      if (!hasColumnDifferences) {
        console.log('🔄 Column differences:');
        hasColumnDifferences = true;
      }
      
      console.log(`\\n📋 ${tableName}:`);
      console.log(`   PostgreSQL: ${pgCols.length} columns`);
      console.log(`   Drizzle: ${drizzleCols.length} columns`);
      
      if (missingFromDrizzle.length > 0) {
        console.log(`   ❌ Missing from Drizzle: ${missingFromDrizzle.join(', ')}`);
      }
      if (missingFromPg.length > 0) {
        console.log(`   ❌ Missing from PostgreSQL: ${missingFromPg.join(', ')}`);
      }
    }
  }
  
  if (!hasColumnDifferences && onlyInPg.length === 0 && onlyInDrizzle.length === 0) {
    console.log('✅ Schemas are perfectly synchronized!');
  }
  
  console.log('\\n✅ Comparison complete!');
}

compareSchemas().catch(console.error); 