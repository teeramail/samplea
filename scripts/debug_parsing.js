// debug_parsing.js - Debug what columns are being parsed
import fs from 'fs';

function debugRegionParsing() {
  console.log('🔍 DEBUG: Region table parsing\n');
  
  // Read introspected schema
  const introspectedContent = fs.readFileSync('drizzle/schema.ts', 'utf8');
  const lines = introspectedContent.split('\n');
  
  console.log('📋 INTROSPECTED SCHEMA - Region table:');
  
  let inRegionTable = false;
  let braceCount = 0;
  let columns = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('export const region = pgTable("Region"')) {
      console.log(`Line ${i + 1}: ${line}`);
      inRegionTable = true;
      braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      continue;
    }
    
    if (inRegionTable) {
      console.log(`Line ${i + 1}: ${line}`);
      
      // Count braces
      braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      
      // Look for column definitions
      if (braceCount > 0 && line.includes(':') && !line.startsWith('//')) {
        const columnMatch = line.match(/^(\w+):/);
        if (columnMatch) {
          columns.push(columnMatch[1]);
          console.log(`   -> Found column: ${columnMatch[1]}`);
        }
      }
      
      if (braceCount === 0) {
        console.log(`   -> End of table (braceCount = 0)`);
        break;
      }
    }
  }
  
  console.log(`\nIntrospected Region columns (${columns.length}): ${columns.join(', ')}\n`);
  
  // Now check current schema
  const currentContent = fs.readFileSync('src/server/db/schema.ts', 'utf8');
  const currentLines = currentContent.split('\n');
  
  console.log('📋 CURRENT SCHEMA - Region table:');
  
  let inCurrentRegionTable = false;
  let currentBraceCount = 0;
  let currentColumns = [];
  
  for (let i = 0; i < currentLines.length; i++) {
    const line = currentLines[i].trim();
    
    if (line.includes('export const regions = createTable("Region"')) {
      console.log(`Line ${i + 1}: ${line}`);
      inCurrentRegionTable = true;
      currentBraceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      continue;
    }
    
    if (inCurrentRegionTable) {
      console.log(`Line ${i + 1}: ${line}`);
      
      // Count braces
      currentBraceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      
      // Look for column definitions
      if (currentBraceCount > 0 && line.includes(':') && !line.startsWith('//')) {
        const columnMatch = line.match(/^(\w+):/);
        if (columnMatch && !line.includes('onDelete') && !line.includes('references')) {
          currentColumns.push(columnMatch[1]);
          console.log(`   -> Found column: ${columnMatch[1]}`);
        }
      }
      
      if (currentBraceCount === 0) {
        console.log(`   -> End of table (braceCount = 0)`);
        break;
      }
    }
  }
  
  console.log(`\nCurrent Region columns (${currentColumns.length}): ${currentColumns.join(', ')}\n`);
  
  // Compare
  const missing = columns.filter(col => !currentColumns.includes(col));
  const extra = currentColumns.filter(col => !columns.includes(col));
  
  console.log('🔄 COMPARISON:');
  if (missing.length === 0 && extra.length === 0) {
    console.log('✅ Perfect match!');
  } else {
    if (missing.length > 0) {
      console.log(`❌ Missing from current: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
      console.log(`❌ Extra in current: ${extra.join(', ')}`);
    }
  }
}

debugRegionParsing(); 