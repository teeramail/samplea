// compare_with_introspected.js - Compare current schema with introspected schema
import fs from 'fs';

function extractTablesFromSchema(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tables = {};

  // Find table definitions more precisely
  const lines = content.split('\n');
  let currentTable = null;
  let inTableDefinition = false;
  let braceCount = 0;
  let tableStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for table definition start
    const tableMatch = line.match(/export const (\w+) = (?:createTable|pgTable)\("([^"]+)",\s*{/);
    if (tableMatch) {
      currentTable = tableMatch[2]; // Use actual table name
      tables[currentTable] = { variable: tableMatch[1], columns: [] };
      inTableDefinition = true;
      braceCount = 1;
      tableStartLine = i;
      continue;
    }
    
    if (!inTableDefinition || !currentTable) continue;
    
    // Count braces to find end of table definition
    for (const char of line) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
    }
    
    // If we're still inside the table definition (braceCount > 0)
    if (braceCount > 0) {
      // Look for column definitions: word followed by colon at start of line (ignoring whitespace)
      const columnMatch = line.match(/^(\w+):\s/);
      if (columnMatch) {
        const columnName = columnMatch[1];
        
        // Skip non-column definitions
        if (columnName !== 'return' && 
            !line.includes('foreignKey') && 
            !line.includes('unique') && 
            !line.includes('index') &&
            !line.includes('primaryKey') &&
            !columnName.includes('Fk') &&
            !columnName.includes('Key') &&
            !columnName.includes('Idx') &&
            !columnName.includes('Unique')) {
          tables[currentTable].columns.push(columnName);
        }
      }
    }
    
    // End of table definition
    if (braceCount === 0) {
      inTableDefinition = false;
      currentTable = null;
      tableStartLine = -1;
    }
  }
  
  return tables;
}

function compareSchemas() {
  console.log('🔍 Comparing current schema with introspected schema...\\n');
  
  // Read both schemas
  const currentSchema = extractTablesFromSchema('src/server/db/schema.ts');
  const introspectedSchema = extractTablesFromSchema('drizzle/schema.ts');
  
  const currentTables = Object.keys(currentSchema);
  const introspectedTables = Object.keys(introspectedSchema);
  
  console.log('📊 SUMMARY:');
  console.log(`Current schema: ${currentTables.length} tables`);
  console.log(`Introspected schema: ${introspectedTables.length} tables\\n`);
  
  // Find table differences
  const missingFromCurrent = introspectedTables.filter(t => !currentTables.includes(t));
  const extraInCurrent = currentTables.filter(t => !introspectedTables.includes(t));
  
  if (missingFromCurrent.length > 0) {
    console.log('❌ Tables missing from current schema:');
    missingFromCurrent.forEach(table => {
      const cols = introspectedSchema[table].columns.length;
      console.log(`   - ${table} (${cols} columns)`);
    });
    console.log();
  }
  
  if (extraInCurrent.length > 0) {
    console.log('❌ Extra tables in current schema:');
    extraInCurrent.forEach(table => {
      const cols = currentSchema[table].columns.length;
      console.log(`   - ${table} (${cols} columns)`);
    });
    console.log();
  }
  
  // Compare common tables
  const commonTables = currentTables.filter(t => introspectedTables.includes(t));
  let hasColumnDifferences = false;
  
  for (const tableName of commonTables) {
    const currentCols = currentSchema[tableName].columns;
    const introspectedCols = introspectedSchema[tableName].columns;
    
    const missingFromCurrent = introspectedCols.filter(col => !currentCols.includes(col));
    const extraInCurrent = currentCols.filter(col => !introspectedCols.includes(col));
    
    if (missingFromCurrent.length > 0 || extraInCurrent.length > 0) {
      if (!hasColumnDifferences) {
        console.log('🔄 Column differences in common tables:');
        hasColumnDifferences = true;
      }
      
      console.log(`\\n📋 ${tableName}:`);
      console.log(`   Current: ${currentCols.length} columns`);
      console.log(`   Introspected: ${introspectedCols.length} columns`);
      
      if (missingFromCurrent.length > 0) {
        console.log(`   ❌ Missing from current: ${missingFromCurrent.join(', ')}`);
      }
      if (extraInCurrent.length > 0) {
        console.log(`   ❌ Extra in current: ${extraInCurrent.join(', ')}`);
      }
    } else {
      console.log(`✅ ${tableName}: Perfect match (${currentCols.length} columns)`);
    }
  }
  
  const totalDifferences = missingFromCurrent.length + extraInCurrent.length + 
    (hasColumnDifferences ? 1 : 0);
  
  if (totalDifferences === 0) {
    console.log('\\n🎉 Perfect match! Current schema matches database exactly!');
  } else {
    console.log(`\\n📊 Total differences: ${totalDifferences} issues found`);
    console.log('\\n💡 Suggestion: Consider updating your current schema to match the introspected one');
  }
  
  console.log('\\n✅ Comparison complete!');
}

compareSchemas(); 