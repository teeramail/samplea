// simple_manual_compare.js - Manual verification of key table differences
import fs from 'fs';

function analyzeEventCategoryTable() {
  console.log('🔍 Analyzing EventCategory table specifically...\n');
  
  // Read introspected schema
  const introspectedContent = fs.readFileSync('drizzle/schema.ts', 'utf8');
  const currentContent = fs.readFileSync('src/server/db/schema.ts', 'utf8');
  
  // Find EventCategory in introspected schema
  const introspectedMatch = introspectedContent.match(/export const eventCategory = pgTable\("EventCategory",\s*{([^}]+)}/s);
  if (introspectedMatch) {
    console.log('📋 EventCategory in REAL DATABASE (introspected):');
    const columns = introspectedMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes(':') && !line.startsWith('//'))
      .map(line => line.split(':')[0].trim())
      .filter(col => col && !col.includes('('));
    
    console.log(`   Columns (${columns.length}): ${columns.join(', ')}`);
  }
  
  // Find EventCategory in current schema
  const currentMatch = currentContent.match(/export const eventCategories = createTable\("EventCategory",\s*{([^}]+(?:{[^}]*}[^}]*)*?)}/s);
  if (currentMatch) {
    console.log('\n📋 EventCategory in YOUR CURRENT SCHEMA:');
    const columns = currentMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes(':') && !line.startsWith('//'))
      .map(line => line.split(':')[0].trim())
      .filter(col => col && !col.includes('(') && !col.includes('.'));
    
    console.log(`   Columns (${columns.length}): ${columns.join(', ')}`);
  }
  
  console.log('\n' + '='.repeat(60));
}

function analyzeEventTable() {
  console.log('\n🔍 Analyzing Event table specifically...\n');
  
  const introspectedContent = fs.readFileSync('drizzle/schema.ts', 'utf8');
  const currentContent = fs.readFileSync('src/server/db/schema.ts', 'utf8');
  
  // Find Event in introspected schema - need to handle multi-line better
  const introspectedLines = introspectedContent.split('\n');
  let eventStart = -1;
  let eventEnd = -1;
  let braceCount = 0;
  
  for (let i = 0; i < introspectedLines.length; i++) {
    const line = introspectedLines[i];
    if (line.includes('export const event = pgTable("Event"')) {
      eventStart = i;
      braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    } else if (eventStart !== -1) {
      braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      if (braceCount === 0) {
        eventEnd = i;
        break;
      }
    }
  }
  
  if (eventStart !== -1 && eventEnd !== -1) {
    console.log('📋 Event in REAL DATABASE (introspected):');
    const eventBlock = introspectedLines.slice(eventStart, eventEnd + 1).join('\n');
    const columns = eventBlock
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes(':') && !line.startsWith('//') && !line.includes('export') && !line.includes('pgTable'))
      .map(line => line.split(':')[0].trim())
      .filter(col => col && !col.includes('(') && !col.includes('return') && !col.includes('foreignKey'));
    
    console.log(`   Columns (${columns.length}): ${columns.join(', ')}`);
  }
  
  // Find Event in current schema
  const currentLines = currentContent.split('\n');
  eventStart = -1;
  eventEnd = -1;
  braceCount = 0;
  
  for (let i = 0; i < currentLines.length; i++) {
    const line = currentLines[i];
    if (line.includes('export const events = createTable("Event"')) {
      eventStart = i;
      braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    } else if (eventStart !== -1) {
      braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      if (braceCount === 0) {
        eventEnd = i;
        break;
      }
    }
  }
  
  if (eventStart !== -1 && eventEnd !== -1) {
    console.log('\n📋 Event in YOUR CURRENT SCHEMA:');
    const eventBlock = currentLines.slice(eventStart, eventEnd + 1).join('\n');
    const columns = eventBlock
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes(':') && !line.startsWith('//') && !line.includes('export') && !line.includes('createTable'))
      .map(line => line.split(':')[0].trim())
      .filter(col => col && !col.includes('(') && !col.includes('return') && !col.includes('onDelete'));
    
    console.log(`   Columns (${columns.length}): ${columns.join(', ')}`);
  }
}

function main() {
  console.log('🔍 MANUAL SCHEMA COMPARISON\n');
  console.log('Focusing on tables we know have differences...\n');
  
  analyzeEventCategoryTable();
  analyzeEventTable();
  
  console.log('\n✅ Manual comparison complete!');
  console.log('\nThis gives us the exact column lists to verify our automated script.');
}

main(); 