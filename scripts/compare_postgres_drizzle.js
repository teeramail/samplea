// final_corrected_compare.js - Most accurate schema comparison
import fs from 'fs';

function extractTablesFromIntrospected(content) {
  const tables = {};
  const lines = content.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Look for table definition start
    const tableMatch = line.match(/export const (\w+) = pgTable\("([^"]+)"/);
    if (tableMatch) {
      const [, variableName, tableName] = tableMatch;
      const columns = [];
      
      // Find the opening brace of the table definition
      let foundOpenBrace = false;
      let j = i;
      
      // Look for the opening brace (might be on same line or next line)
      while (j < lines.length && !foundOpenBrace) {
        if (lines[j].includes('{')) {
          foundOpenBrace = true;
          j++; // Start looking for columns from next line
          break;
        }
        j++;
      }
      
      if (!foundOpenBrace) {
        i++;
        continue;
      }
      
      // Now parse columns until we find the closing brace
      let braceCount = 1;
      while (j < lines.length && braceCount > 0) {
        const currentLine = lines[j].trim();
        
        // Count braces
        const openBraces = (currentLine.match(/{/g) || []).length;
        const closeBraces = (currentLine.match(/}/g) || []).length;
        braceCount += openBraces - closeBraces;
        
        // Look for column definitions (only when we're in the main table object)
        if (braceCount === 1 && currentLine.includes(':') && !currentLine.startsWith('//')) {
          const columnMatch = currentLine.match(/^(\w+):/);
          if (columnMatch) {
            columns.push(columnMatch[1]);
          }
        }
        
        j++;
      }
      
      tables[tableName] = { variable: variableName, columns };
      i = j; // Continue from where we left off
    } else {
      i++;
    }
  }
  
  return tables;
}

function extractTablesFromCurrent(content) {
  const tables = {};
  const lines = content.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Look for table definition start
    const tableMatch = line.match(/export const (\w+) = createTable\("([^"]+)"/);
    if (tableMatch) {
      const [, variableName, tableName] = tableMatch;
      const columns = [];
      
      // Find the opening brace of the table definition
      let foundOpenBrace = false;
      let j = i;
      
      // Look for the opening brace (might be on same line or next line)
      while (j < lines.length && !foundOpenBrace) {
        if (lines[j].includes('{')) {
          foundOpenBrace = true;
          j++; // Start looking for columns from next line
          break;
        }
        j++;
      }
      
      if (!foundOpenBrace) {
        i++;
        continue;
      }
      
      // Now parse columns until we find the closing brace
      let braceCount = 1;
      while (j < lines.length && braceCount > 0) {
        const currentLine = lines[j].trim();
        
        // Count braces
        const openBraces = (currentLine.match(/{/g) || []).length;
        const closeBraces = (currentLine.match(/}/g) || []).length;
        braceCount += openBraces - closeBraces;
        
        // Look for column definitions (only when we're in the main table object)
        if (braceCount === 1 && currentLine.includes(':') && !currentLine.startsWith('//')) {
          const columnMatch = currentLine.match(/^(\w+):/);
          if (columnMatch && !currentLine.includes('onDelete') && !currentLine.includes('references')) {
            columns.push(columnMatch[1]);
          }
        }
        
        j++;
      }
      
      tables[tableName] = { variable: variableName, columns };
      i = j; // Continue from where we left off
    } else {
      i++;
    }
  }
  
  return tables;
}

function main() {
  console.log('🔍 FINAL CORRECTED SCHEMA COMPARISON\n');
  
  // Read both schema files
  const introspectedContent = fs.readFileSync('drizzle/schema.ts', 'utf8');
  const currentContent = fs.readFileSync('src/server/db/schema.ts', 'utf8');
  
  // Extract tables and columns
  const introspectedTables = extractTablesFromIntrospected(introspectedContent);
  const currentTables = extractTablesFromCurrent(currentContent);
  
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
      console.log(`   Introspected: ${introspectedCols.length} columns [${introspectedCols.join(', ')}]`);
      console.log(`   Current: ${currentCols.length} columns [${currentCols.join(', ')}]`);
      
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
  console.log(`\n✅ Final corrected comparison complete!`);
}

main(); 