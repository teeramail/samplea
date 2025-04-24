/**
 * Database Schema Manager
 * 
 * This script provides comprehensive database schema management:
 * 1. VALIDATE: Compare actual PostgreSQL database with Drizzle schema
 * 2. PUSH: Push Drizzle schema changes to the database
 * 3. PULL: Update Drizzle schema from database (introspection)
 * 4. DOCUMENT: Update the schema.md documentation file
 * 
 * Usage:
 *   npx tsx src/scripts/db-schema-manager.ts validate
 *   npx tsx src/scripts/db-schema-manager.ts push
 *   npx tsx src/scripts/db-schema-manager.ts pull
 *   npx tsx src/scripts/db-schema-manager.ts document
 *   npx tsx src/scripts/db-schema-manager.ts all
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import * as schema from "../server/db/schema";
import { sql } from "drizzle-orm";
import { exec } from "child_process";
import { promisify } from "util";

// Convert exec to promise-based
const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

// Get database connection string
const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Types for database schema information
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

/**
 * Validates the database schema against the Drizzle schema
 */
async function validateSchema() {
  console.log(`Connecting to database: ${DATABASE_URL.replace(/:.*@/, ":*****@")}...`);
  
  // Create a postgres connection
  const client = postgres(DATABASE_URL, { max: 1 });
  
  try {
    console.log("Starting schema validation...");

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

    // 5. Extract tables from Drizzle schema
    const drizzleTables: string[] = [];
    
    for (const key in schema) {
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
    
    // 6. Compare tables
    const dbTableSet = new Set(tableNames);
    const drizzleTableSet = new Set(drizzleTables);
    
    const missingTablesInDrizzle = [...dbTableSet].filter(t => !drizzleTableSet.has(t));
    const extraTablesInDrizzle = [...drizzleTableSet].filter(t => !dbTableSet.has(t));
    
    console.log("\n=== SCHEMA VALIDATION RESULTS ===");
    
    if (missingTablesInDrizzle.length > 0) {
      console.log(`\n❌ Tables in database but missing in Drizzle schema: ${missingTablesInDrizzle.join(', ')}`);
      console.log("   Run 'npx tsx src/scripts/db-schema-manager.ts pull' to update Drizzle schema");
    } else {
      console.log("\n✅ All database tables are defined in Drizzle schema");
    }
    
    if (extraTablesInDrizzle.length > 0) {
      console.log(`\n⚠️ Tables in Drizzle schema but not in database: ${extraTablesInDrizzle.join(', ')}`);
      console.log("   Run 'npx tsx src/scripts/db-schema-manager.ts push' to update the database");
    } else {
      console.log("\n✅ All Drizzle schema tables exist in the database");
    }

    return {
      dbTables: tableNames,
      drizzleTables,
      missingTablesInDrizzle,
      extraTablesInDrizzle,
      columns,
      relationships,
      enumTypes
    };
    
  } catch (error) {
    console.error("Schema validation error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
    console.log("\nDatabase connection closed.");
  }
}

/**
 * Pushes Drizzle schema to the database (Drizzle → DB)
 */
async function pushSchema() {
  console.log("Pushing Drizzle schema to database...");
  
  try {
    const { stdout, stderr } = await execAsync('npx drizzle-kit push');
    
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    
    console.log(stdout);
    console.log("\n✅ Database updated successfully from Drizzle schema!");
    
  } catch (error) {
    console.error("Error pushing schema:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Pulls database schema into Drizzle (DB → Drizzle)
 */
async function pullSchema() {
  console.log("Pulling database schema to update Drizzle...");
  
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'src', 'server', 'db', 'introspected');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Run drizzle-kit introspect
    const { stdout, stderr } = await execAsync(
      `npx drizzle-kit introspect:pg --out=${outputDir}`
    );
    
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    
    console.log(stdout);
    
    // Generate a merged schema file
    const mergedSchemaPath = path.join(outputDir, 'merged-schema.ts');
    const introspectedSchemaPath = path.join(outputDir, 'schema.ts');
    
    if (fs.existsSync(introspectedSchemaPath)) {
      // Read the introspected schema
      const introspectedSchema = fs.readFileSync(introspectedSchemaPath, 'utf8');
      
      // Create a merged schema file with instructions
      const mergedContent = `/**
 * MERGED SCHEMA - Generated from database introspection
 * 
 * This file contains the schema introspected from your database.
 * You should manually merge this with your existing schema.ts file.
 * 
 * Generated: ${new Date().toISOString()}
 */

${introspectedSchema}

/**
 * HOW TO USE THIS FILE:
 * 
 * 1. Review the introspected schema above
 * 2. Copy the relevant parts to your main schema.ts file
 * 3. Make sure to preserve any custom configurations in your existing schema
 * 4. Pay special attention to relations, indexes, and custom column configurations
 */`;
      
      fs.writeFileSync(mergedSchemaPath, mergedContent);
      
      console.log(`\n✅ Database schema introspected successfully!`);
      console.log(`\nIntrospected schema saved to: ${introspectedSchemaPath}`);
      console.log(`Merged schema template saved to: ${mergedSchemaPath}`);
      console.log(`\nIMPORTANT: You need to manually merge these changes with your existing schema.ts file.`);
      console.log(`The introspection may not preserve all relations and custom configurations.`);
    } else {
      console.error(`\n❌ Introspection failed: Could not find generated schema file at ${introspectedSchemaPath}`);
    }
    
  } catch (error) {
    console.error("Error pulling schema:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Updates the schema.md documentation file
 */
async function updateDocumentation() {
  console.log(`Connecting to database: ${DATABASE_URL.replace(/:.*@/, ":*****@")}...`);
  
  // Create a postgres connection
  const client = postgres(DATABASE_URL, { max: 1 });
  
  try {
    console.log("Starting documentation update...");

    // 1. Get all tables in the database
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tableNames = tables.map(t => t.table_name as string);
    
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
    
    // 4. Get indexes
    const indexes = await client`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    // 5. Group columns by table
    const tableInfo: Record<string, ColumnInfo[]> = {};
    
    for (const column of columns) {
      const tableName = column.table_name as string;
      if (!tableInfo[tableName]) {
        tableInfo[tableName] = [];
      }
      tableInfo[tableName].push(column as ColumnInfo);
    }
    
    // 6. Create the markdown content
    let markdownContent = `# Database Schema\n\n`;
    markdownContent += `*Last updated: ${new Date().toISOString()}*\n\n`;
    markdownContent += `## Tables\n\n`;
    
    // Add table of contents
    for (const tableName of tableNames) {
      markdownContent += `- [${tableName}](#${tableName.toLowerCase()})\n`;
    }
    
    markdownContent += `\n## Schema Details\n\n`;
    
    // Add detailed table information
    for (const tableName of tableNames) {
      const tableColumns = tableInfo[tableName] || [];
      
      markdownContent += `### ${tableName}\n\n`;
      markdownContent += `#### Columns\n\n`;
      markdownContent += `| Column Name | Data Type | Nullable | Default |\n`;
      markdownContent += `|-------------|-----------|----------|----------|\n`;
      
      for (const column of tableColumns) {
        const nullable = column.is_nullable === 'YES' ? 'YES' : 'NO';
        const defaultValue = column.column_default === null ? 'NULL' : column.column_default;
        
        markdownContent += `| ${column.column_name} | ${column.data_type} | ${nullable} | ${defaultValue} |\n`;
      }
      
      // Add foreign key information
      const tableRelationships = relationships.filter(r => r.table_name === tableName);
      
      if (tableRelationships.length > 0) {
        markdownContent += `\n#### Foreign Keys\n\n`;
        markdownContent += `| Column | References | On Delete |\n`;
        markdownContent += `|--------|------------|------------|\n`;
        
        for (const rel of tableRelationships) {
          markdownContent += `| ${rel.column_name} | ${rel.referenced_table}.${rel.referenced_column} | ${rel.delete_rule} |\n`;
        }
      }
      
      // Add index information
      const tableIndexes = indexes.filter(idx => idx.tablename === tableName);
      
      if (tableIndexes.length > 0) {
        markdownContent += `\n#### Indexes\n\n`;
        markdownContent += `| Name | Definition |\n`;
        markdownContent += `|------|------------|\n`;
        
        for (const idx of tableIndexes) {
          markdownContent += `| ${idx.indexname} | ${idx.indexdef} |\n`;
        }
      }
      
      markdownContent += `\n`;
    }
    
    // 7. Write to the schema.md file
    const docsDir = path.join(process.cwd(), 'docs', 'database');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    const schemaFilePath = path.join(docsDir, 'schema.md');
    fs.writeFileSync(schemaFilePath, markdownContent);
    
    console.log(`\n✅ Schema documentation updated at: ${schemaFilePath}`);
    
  } catch (error) {
    console.error("Documentation update error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
    console.log("\nDatabase connection closed.");
  }
}

/**
 * Main function to handle command line arguments
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'validate';
  
  switch (command) {
    case 'validate':
      await validateSchema();
      break;
    case 'push':
      await pushSchema();
      break;
    case 'pull':
      await pullSchema();
      break;
    case 'document':
      await updateDocumentation();
      break;
    case 'all':
      console.log("=== STEP 1: VALIDATING SCHEMA ===");
      await validateSchema();
      console.log("\n=== STEP 2: UPDATING DOCUMENTATION ===");
      await updateDocumentation();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: npx tsx src/scripts/db-schema-manager.ts [validate|push|pull|document|all]');
      process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
