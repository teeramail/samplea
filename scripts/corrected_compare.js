// corrected_compare.js - Accurate schema comparison
import fs from 'fs';

function extractColumnsFromIntrospected(content) {
  const tables = {};
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for pgTable definitions in introspected schema
    const tableMatch = line.match(/export const (\w+) = pgTable\("([^"]+)",\s*{/);
    if (tableMatch) {
      const [, variableName, tableName] = tableMatch;
      const columns = [];
      
      // Find the closing brace for this table
      let braceCount = 1;
      let j = i + 1;
      
      while (j < lines.length && braceCount > 0) {
        const currentLine = lines[j].trim();
        
        // Count braces
        for (const char of currentLine) {
          if (char === '{') braceCount++;
          else if (char === '}') braceCount--;
        }
        
        // If we're still inside the table definition and this looks like a column
        if (braceCount > 0 && currentLine.includes(':') && !currentLine.startsWith('//')) {
          const columnMatch = currentLine.match(/^(\w+):/);
          if (columnMatch) {
            columns.push(columnMatch[1]);
          }
        }
        
        j++;
      }
      
      tables[tableName] = { variable: variableName, columns };
    }
  }
  
  return tables;
}

function extractColumnsFromCurrent(content) {
  const tables = {};
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for createTable definitions in current schema
    const tableMatch = line.match(/export const (\w+) = createTable\("([^"]+)",\s*{/);
    if (tableMatch) {
      const [, variableName, tableName] = tableMatch;
      const columns = [];
      
      // Find the closing brace for this table
      let braceCount = 1;
      let j = i + 1;
      
      while (j < lines.length && braceCount > 0) {
        const currentLine = lines[j].trim();
        
        // Count braces
        for (const char of currentLine) {
          if (char === '{') braceCount++;
          else if (char === '}') braceCount--;
        }
        
        // If we're still inside the table definition and this looks like a column
        if (braceCount > 0 && currentLine.includes(':') && !currentLine.startsWith('//')) {
          const columnMatch = currentLine.match(/^(\w+):/);
          if (columnMatch && !currentLine.includes('onDelete') && !currentLine.includes('references')) {
            columns.push(columnMatch[1]);
          }
        }
        
        j++;
      }
      
      tables[tableName] = { variable: variableName, columns };
    }
  }
  
  return tables;
}

function main() {
  console.log('🔍 CORRECTED SCHEMA COMPARISON\n');
  
  // Read both schema files
  const introspectedContent = fs.readFileSync('drizzle/schema.ts', 'utf8');
  const currentContent = fs.readFileSync('src/server/db/schema.ts', 'utf8');
  
  // Extract tables and columns
  const introspectedTables = extractColumnsFromIntrospected(introspectedContent);
  const currentTables = extractColumnsFromCurrent(currentContent);
  
  console.log(`📊 SUMMARY:`);
  console.log(`Introspected schema: ${Object.keys(introspectedTables).length} tables`);
  console.log(`Current schema: ${Object.keys(currentTables).length} tables\n`);
  
  // Find missing tables
  const missingTables = Object.keys(introspectedTables).filter(
    table => !currentTables[table]
  );
  
  if (missingTables.length > 0) {
    console.log(`❌ Tables missing from current schema:`);
    missingTables.forEach(table => {
      console.log(`   - ${table} (${introspectedTables[table].columns.length} columns)`);
    });
    console.log('');
  }
  
  // Compare common tables
  const commonTables = Object.keys(introspectedTables).filter(
    table => currentTables[table]
  );
  
  console.log(`🔄 Column differences in common tables:\n`);
  
  let perfectMatches = 0;
  let issuesFound = 0;
  
  commonTables.forEach(tableName => {
    const introspectedCols = introspectedTables[tableName].columns.sort();
    const currentCols = currentTables[tableName].columns.sort();
    
    const missing = introspectedCols.filter(col => !currentCols.includes(col));
    const extra = currentCols.filter(col => !introspectedCols.includes(col));
    
    if (missing.length === 0 && extra.length === 0) {
      console.log(`✅ ${tableName}: Perfect match (${introspectedCols.length} columns)`);
      perfectMatches++;
    } else {
      console.log(`📋 ${tableName}:`);
      console.log(`   Introspected: ${introspectedCols.length} columns`);
      console.log(`   Current: ${currentCols.length} columns`);
      
      if (missing.length > 0) {
        console.log(`   ❌ Missing from current: ${missing.join(', ')}`);
      }
      if (extra.length > 0) {
        console.log(`   ❌ Extra in current: ${extra.join(', ')}`);
      }
      issuesFound++;
    }
    console.log('');
  });
  
  console.log(`📊 Results: ${perfectMatches} perfect matches, ${issuesFound} tables with differences`);
  console.log(`\n✅ Corrected comparison complete!`);
}

main(); 