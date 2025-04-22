import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Get database connection string from environment
const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

console.log(`Connecting to database: ${DATABASE_URL.replace(/:.*@/, ":*****@")}...`);

async function analyzeDatabase() {
  // Create a postgres connection
  const client = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log("Starting database analysis...");

    // 1. Get all tables in the database
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tableNames = tables.map(t => t.table_name as string);
    console.log(`\nFound ${tableNames.length} tables in database:`);
    console.log(tableNames.join(', '));

    // 2. Get all enum types
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
    
    console.log(`\nFound ${enumTypes.length} enum types:`);
    for (const enumType of enumTypes) {
      console.log(`- ${enumType.typname}: ${(enumType.enumlabels as string[]).join(', ')}`);
    }

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
    
    console.log(`\nFound ${relationships.length} foreign key relationships:`);
    
    // Define type for relationship data
    type RelationshipInfo = {
      column: string;
      referencedTable: string;
      referencedColumn: string;
      deleteRule: string;
    };
    
    type TableRelationships = Record<string, Array<RelationshipInfo>>;
    
    const relationshipsByTable: TableRelationships = {};
    
    for (const rel of relationships) {
      const tableName = rel.table_name as string;
      if (!relationshipsByTable[tableName]) {
        relationshipsByTable[tableName] = [];
      }
      relationshipsByTable[tableName].push({
        column: rel.column_name as string,
        referencedTable: rel.referenced_table as string,
        referencedColumn: rel.referenced_column as string,
        deleteRule: rel.delete_rule as string
      });
    }

    for (const tableName of Object.keys(relationshipsByTable).sort()) {
      console.log(`\n- Table ${tableName} relationships:`);
      // Use non-null assertion or provide a default empty array to handle possible undefined
      const relationships = relationshipsByTable[tableName] ?? [];
      for (const rel of relationships) {
        console.log(`  * ${rel.column} -> ${rel.referencedTable}.${rel.referencedColumn} (onDelete: ${rel.deleteRule})`);
      }
    }

    // 4. Create schema.json file
    console.log("\nCreating schema.json file from database...");
    
    // Get all columns for all tables
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
    
    // Process the data to handle ARRAY types correctly
    const processedColumns = columns.map(col => {
      const colInfo = {
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

    // Process relationships
    const processedRelationships = relationships.map(rel => ({
      constraint_name: rel.constraint_name as string,
      table_name: rel.table_name as string,
      column_name: rel.column_name as string,
      referenced_table: rel.referenced_table as string,
      referenced_column: rel.referenced_column as string,
      delete_rule: rel.delete_rule as string
    }));

    // Create the schema object
    const schemaObject = {
      tables: tableNames,
      columns: processedColumns,
      relationships: processedRelationships,
      enumTypes: enumTypes.map(et => ({
        typname: et.typname as string,
        enumlabels: et.enumlabels as string[]
      })),
      generatedAt: new Date().toISOString()
    };

    // Write the schema to the JSON file
    const schemaFilePath = path.join(process.cwd(), 'docs', 'database', 'schema.json');
    fs.writeFileSync(schemaFilePath, JSON.stringify(schemaObject, null, 2));
    
    console.log(`\nSchema JSON file updated at: ${schemaFilePath}`);
    console.log("Database analysis completed successfully!");

  } catch (error) {
    console.error("Database analysis error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
    console.log("Database connection closed.");
  }
}

// Run the analysis function
analyzeDatabase().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
