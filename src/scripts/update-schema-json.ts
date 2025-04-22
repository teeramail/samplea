import { drizzle } from "drizzle-orm/postgres-js";
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

async function updateSchemaJson() {
  // Create a postgres connection
  const client = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log("Starting schema.json update process...");

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

    // 6. Process relationships
    const processedRelationships: RelationshipInfo[] = relationships.map(rel => ({
      constraint_name: rel.constraint_name as string,
      table_name: rel.table_name as string,
      column_name: rel.column_name as string,
      referenced_table: rel.referenced_table as string,
      referenced_column: rel.referenced_column as string,
      delete_rule: rel.delete_rule as string
    }));

    // 7. Create the schema object
    const schemaObject: SchemaInfo = {
      tables: tableNames,
      columns: processedColumns,
      relationships: processedRelationships,
      enumTypes: enumTypes.map(et => ({
        typname: et.typname as string,
        enumlabels: et.enumlabels as string[]
      })),
      generatedAt: new Date().toISOString()
    };

    // 8. Write the schema to the JSON file
    const schemaFilePath = path.join(process.cwd(), 'docs', 'database', 'schema.json');
    fs.writeFileSync(schemaFilePath, JSON.stringify(schemaObject, null, 2));
    
    console.log(`Schema JSON file updated at: ${schemaFilePath}`);
    console.log("Schema update completed successfully!");

  } catch (error) {
    console.error("Database schema update error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
    console.log("Database connection closed.");
  }
}

// Run the update function
updateSchemaJson().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
