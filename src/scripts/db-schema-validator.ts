import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import * as schema from "../server/db/schema";

// Load environment variables from .env file
dotenv.config();

// Get database connection string from environment
const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

console.log(`Connecting to database: ${DATABASE_URL.replace(/:.*@/, ":*****@")}...`);

type ColumnInfo = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

type RelationshipInfo = {
  constraint_name: string;
  table_name: string;
  column_name: string;
  referenced_table: string;
  referenced_column: string;
  delete_rule: string;
};

type EnumInfo = {
  typname: string;
  enumlabels: string[];
};

type SchemaInfo = {
  tables: string[];
  columns: ColumnInfo[];
  relationships: RelationshipInfo[];
  enumTypes: EnumInfo[];
  generatedAt: string;
};

async function validateSchema() {
  // Create a postgres connection
  const client = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log("Starting schema validation process...");

    // 1. Get all tables in the database
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tableNames = tables.map(t => t.table_name as string);
    console.log(`Found ${tableNames.length} tables in database`);

    // 2. Get all columns for all tables
    const columnsQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ANY($1)
      ORDER BY table_name, ordinal_position;
    `;
    
    const columns = await client.unsafe(columnsQuery, [tableNames]);
    
    console.log(`Found ${columns.length} columns across all tables`);

    // 3. Get all foreign key relationships
    const relationships = await client`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    console.log(`Found ${relationships.length} foreign key relationships`);

    // 4. Get all enum types
    const enumTypes = await client`
      SELECT 
        t.typname,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as enumlabels
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname;
    `;
    
    console.log(`Found ${enumTypes.length} enum types`);

    // 5. Process the data to handle ARRAY types correctly
    const processedColumns: ColumnInfo[] = columns.map(col => {
      const colInfo: ColumnInfo = {
        table_name: col.table_name as string,
        column_name: col.column_name as string,
        data_type: col.data_type as string,
        is_nullable: col.is_nullable as string,
        column_default: col.column_default as string | null
      };
      
      // Check if it's an array type
      if (colInfo.data_type.endsWith('[]')) {
        return {
          ...colInfo,
          data_type: 'ARRAY'
        };
      }
      
      // Check if it's a user-defined type (enum)
      if (colInfo.data_type === 'USER-DEFINED') {
        return {
          ...colInfo,
          data_type: 'USER-DEFINED'
        };
      }
      
      return colInfo;
    });

    // 6. Create the schema object
    const processedRelationships: RelationshipInfo[] = relationships.map(rel => ({
      constraint_name: rel.constraint_name as string,
      table_name: rel.table_name as string,
      column_name: rel.column_name as string,
      referenced_table: rel.referenced_table as string,
      referenced_column: rel.referenced_column as string,
      delete_rule: rel.delete_rule as string
    }));
    
    const dbSchemaInfo: SchemaInfo = {
      tables: tableNames,
      columns: processedColumns,
      relationships: processedRelationships,
      enumTypes: enumTypes.map(et => ({
        typname: et.typname as string,
        enumlabels: et.enumlabels as string[]
      })),
      generatedAt: new Date().toISOString()
    };

    // 7. Read the schema.json file
    const schemaFilePath = path.join(process.cwd(), 'docs', 'database', 'schema.json');
    let schemaJsonInfo: SchemaInfo;
    try {
      const schemaJsonContent = fs.readFileSync(schemaFilePath, 'utf8');
      schemaJsonInfo = JSON.parse(schemaJsonContent);
      console.log(`Successfully read schema.json file`);
    } catch (error) {
      console.error(`Error reading schema.json file: ${error instanceof Error ? error.message : String(error)}`);
      schemaJsonInfo = {
        tables: [],
        columns: [],
        relationships: [],
        enumTypes: [],
        generatedAt: ""
      };
    }

    // 8. Compare database schema with schema.json
    console.log("\n--- Comparing database schema with schema.json ---");
    
    // Compare tables
    const dbTables = new Set(dbSchemaInfo.tables);
    const jsonTables = new Set(schemaJsonInfo.tables);
    
    const missingTablesInJson = [...dbTables].filter(t => !jsonTables.has(t));
    const extraTablesInJson = [...jsonTables].filter(t => !dbTables.has(t));
    
    if (missingTablesInJson.length > 0) {
      console.log(`Tables in database but missing in schema.json: ${missingTablesInJson.join(', ')}`);
    }
    
    if (extraTablesInJson.length > 0) {
      console.log(`Tables in schema.json but not in database: ${extraTablesInJson.join(', ')}`);
    }

    // Compare columns
    const dbColumnMap = new Map<string, ColumnInfo>();
    dbSchemaInfo.columns.forEach(col => {
      const key = `${col.table_name}.${col.column_name}`;
      dbColumnMap.set(key, col);
    });
    
    const jsonColumnMap = new Map<string, ColumnInfo>();
    schemaJsonInfo.columns.forEach(col => {
      const key = `${col.table_name}.${col.column_name}`;
      jsonColumnMap.set(key, col);
    });
    
    const missingColumnsInJson: string[] = [];
    const extraColumnsInJson: string[] = [];
    const mismatchedColumns: string[] = [];
    
    // Check for missing or mismatched columns
    dbColumnMap.forEach((dbCol, key) => {
      const jsonCol = jsonColumnMap.get(key);
      if (!jsonCol) {
        missingColumnsInJson.push(key);
      } else {
        // Compare column properties
        if (
          dbCol.data_type !== jsonCol.data_type || dbCol.is_nullable !== jsonCol.is_nullable ||
          (dbCol.column_default !== jsonCol.column_default && 
           !(dbCol.column_default === null && jsonCol.column_default === null))
        ) {
          mismatchedColumns.push(key);
        }
      }
    });
    
    // Check for extra columns in schema.json
    jsonColumnMap.forEach((jsonCol, key) => {
      if (!dbColumnMap.has(key)) {
        extraColumnsInJson.push(key);
      }
    });
    
    if (missingColumnsInJson.length > 0) {
      console.log(`\nColumns in database but missing in schema.json (${missingColumnsInJson.length}):`);
      missingColumnsInJson.forEach(col => console.log(`- ${col}`));
    }
    
    if (extraColumnsInJson.length > 0) {
      console.log(`\nColumns in schema.json but not in database (${extraColumnsInJson.length}):`);
      extraColumnsInJson.forEach(col => console.log(`- ${col}`));
    }
    
    if (mismatchedColumns.length > 0) {
      console.log(`\nColumns with mismatched properties (${mismatchedColumns.length}):`);
      mismatchedColumns.forEach(key => {
        const dbCol = dbColumnMap.get(key)!;
        const jsonCol = jsonColumnMap.get(key)!;
        console.log(`- ${key}:`);
        if (dbCol.data_type !== jsonCol.data_type) {
          console.log(`  - Data type: DB=${dbCol.data_type}, JSON=${jsonCol.data_type}`);
        }
        if (dbCol.is_nullable !== jsonCol.is_nullable) {
          console.log(`  - Nullable: DB=${dbCol.is_nullable}, JSON=${jsonCol.is_nullable}`);
        }
        if (dbCol.column_default !== jsonCol.column_default) {
          console.log(`  - Default: DB=${dbCol.column_default}, JSON=${jsonCol.column_default}`);
        }
      });
    }

    // Compare enum types
    const dbEnumMap = new Map<string, string[]>();
    dbSchemaInfo.enumTypes.forEach(et => {
      dbEnumMap.set(et.typname, et.enumlabels);
    });
    
    const jsonEnumMap = new Map<string, string[]>();
    schemaJsonInfo.enumTypes.forEach(et => {
      jsonEnumMap.set(et.typname, et.enumlabels);
    });
    
    const missingEnumsInJson: string[] = [];
    const extraEnumsInJson: string[] = [];
    const mismatchedEnums: string[] = [];
    
    // Check for missing or mismatched enums
    dbEnumMap.forEach((dbLabels, typname) => {
      const jsonLabels = jsonEnumMap.get(typname);
      if (!jsonLabels) {
        missingEnumsInJson.push(typname);
      } else {
        // Compare enum labels
        if (dbLabels.length !== jsonLabels.length || 
            !dbLabels.every((label, i) => label === jsonLabels[i])) {
          mismatchedEnums.push(typname);
        }
      }
    });
    
    // Check for extra enums in schema.json
    jsonEnumMap.forEach((jsonLabels, typname) => {
      if (!dbEnumMap.has(typname)) {
        extraEnumsInJson.push(typname);
      }
    });
    
    if (missingEnumsInJson.length > 0) {
      console.log(`\nEnum types in database but missing in schema.json: ${missingEnumsInJson.join(', ')}`);
    }
    
    if (extraEnumsInJson.length > 0) {
      console.log(`\nEnum types in schema.json but not in database: ${extraEnumsInJson.join(', ')}`);
    }
    
    if (mismatchedEnums.length > 0) {
      console.log(`\nEnum types with mismatched labels:`);
      mismatchedEnums.forEach(typname => {
        const dbLabels = dbEnumMap.get(typname)!;
        const jsonLabels = jsonEnumMap.get(typname)!;
        console.log(`- ${typname}:`);
        console.log(`  - DB: ${dbLabels.join(', ')}`);
        console.log(`  - JSON: ${jsonLabels.join(', ')}`);
      });
    }

    // 9. Check Drizzle schema against database
    console.log("\n--- Comparing Drizzle schema with database ---");
    
    // Extract table names from Drizzle schema
    const drizzleTables: string[] = [];
    
    // Iterate through all exported items in the schema
    for (const key of Object.keys(schema)) {
      // Skip relation definitions and enums
      if (key.endsWith('Relations') || key.endsWith('Enum')) {
        continue;
      }
      
      const tableObj = schema[key as keyof typeof schema];
      
      // Check if it's a table object
      if (tableObj && typeof tableObj === 'object' && 'name' in tableObj) {
        const tableName = (tableObj as any).name;
        if (tableName && typeof tableName === 'string') {
          drizzleTables.push(tableName);
        }
      }
    }
    
    console.log(`Found ${drizzleTables.length} tables in Drizzle schema`);
    
    // Compare tables
    const drizzleTableSet = new Set(drizzleTables);
    
    const missingTablesInDrizzle = [...dbTables].filter(t => !drizzleTableSet.has(t));
    const extraTablesInDrizzle = [...drizzleTableSet].filter(t => !dbTables.has(t));
    
    if (missingTablesInDrizzle.length > 0) {
      console.log(`Tables in database but missing in Drizzle schema: ${missingTablesInDrizzle.join(', ')}`);
    }
    
    if (extraTablesInDrizzle.length > 0) {
      console.log(`Tables in Drizzle schema but not in database: ${extraTablesInDrizzle.join(', ')}`);
    }

    // 10. Summary
    console.log("\n=== SUMMARY ===");
    
    const schemaJsonUpToDate = 
      missingTablesInJson.length === 0 && 
      extraTablesInJson.length === 0 && 
      missingColumnsInJson.length === 0 && 
      extraColumnsInJson.length === 0 && 
      mismatchedColumns.length === 0 &&
      missingEnumsInJson.length === 0 && 
      extraEnumsInJson.length === 0 && 
      mismatchedEnums.length === 0;
    
    const drizzleSchemaUpToDate = 
      missingTablesInDrizzle.length === 0 && 
      extraTablesInDrizzle.length === 0;
    
    console.log(`\n1. SCHEMA.JSON STATUS:`);
    console.log(`   Up to date with database: ${schemaJsonUpToDate ? 'YES ✓' : 'NO ✗'}`);
    
    if (!schemaJsonUpToDate) {
      console.log("\n   Issues found:");
      if (missingTablesInJson.length > 0) {
        console.log(`   - Tables in database but missing in schema.json: ${missingTablesInJson.join(', ')}`);
      }
      if (extraTablesInJson.length > 0) {
        console.log(`   - Tables in schema.json but not in database: ${extraTablesInJson.join(', ')}`);
      }
      if (missingColumnsInJson.length > 0) {
        console.log(`   - ${missingColumnsInJson.length} columns in database but missing in schema.json`);
      }
      if (extraColumnsInJson.length > 0) {
        console.log(`   - ${extraColumnsInJson.length} columns in schema.json but not in database`);
      }
      if (mismatchedColumns.length > 0) {
        console.log(`   - ${mismatchedColumns.length} columns with mismatched properties`);
      }
      if (missingEnumsInJson.length > 0 || extraEnumsInJson.length > 0 || mismatchedEnums.length > 0) {
        console.log(`   - Enum type issues found`);
      }
      
      console.log("\n   To update schema.json, run: npm run db:update-schema-json");
    }
    
    console.log(`\n2. DRIZZLE SCHEMA STATUS:`);
    console.log(`   Up to date with database: ${drizzleSchemaUpToDate ? 'YES ✓' : 'NO ✗'}`);
    
    if (!drizzleSchemaUpToDate) {
      console.log("\n   Issues found:");
      if (missingTablesInDrizzle.length > 0) {
        console.log(`   - Tables in database but missing in Drizzle schema: ${missingTablesInDrizzle.join(', ')}`);
      }
      if (extraTablesInDrizzle.length > 0) {
        console.log(`   - Tables in Drizzle schema but not in database: ${extraTablesInDrizzle.join(', ')}`);
      }
      
      console.log("\n   To update Drizzle schema, you need to modify src/server/db/schema.ts");
    }

    console.log("\nSchema validation completed!");

  } catch (error) {
    console.error("Schema validation error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
    console.log("Database connection closed.");
  }
}

// Run the validation function
validateSchema().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
