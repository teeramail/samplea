// final_corrected_compare.js - Most accurate schema comparison
import fs from 'fs';

function extractColumns(content, tableType) {
  const tables = {};
  const lines = content.split('\n');
  const tableRegex = new RegExp(`export const (\\w+) = ${tableType}\\("([^"]+)"`);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const tableMatch = line.match(tableRegex);

    if (tableMatch) {
      const [, variableName, tableName] = tableMatch;
      const columns = [];
      let j = i;

      // Find the opening brace of the table definition
      while (j < lines.length) {
        if (lines[j].includes('{')) break;
        j++;
      }
      if (j === lines.length) { i++; continue; }

      let braceCount = 0;
      let inTableObject = false;

      // Start parsing from the opening brace
      while (j < lines.length) {
        const currentLine = lines[j];
        const openBraces = (currentLine.match(/{/g) || []).length;
        const closeBraces = (currentLine.match(/}/g) || []).length;
        
        // Before updating the count, check for columns at the current level
        if (inTableObject && braceCount === 1) {
          const columnMatch = currentLine.trim().match(/^([a-zA-Z0-9_]+)\s*:/);
          if (columnMatch) {
            columns.push(columnMatch[1]);
          }
        }
        
        if (!inTableObject) {
          braceCount += openBraces;
          if (braceCount > 0) inTableObject = true;
        } else {
          braceCount += openBraces - closeBraces;
        }
        
        if (inTableObject && braceCount <= 0) break;
        
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
  const introspectedTables = extractColumns(introspectedContent, 'pgTable');
  const currentTables = extractColumns(currentContent, 'createTable');
  
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