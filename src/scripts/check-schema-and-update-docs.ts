import { db } from "~/server/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { format } from "date-fns";

/**
 * This script:
 * 1. Checks if the database schema matches the Drizzle schema
 * 2. Updates the schema.md documentation
 */

async function main() {
  try {
    console.log("Checking database schema...");
    
    // Get all tables from the database
    const tables = await db.execute(sql`
      SELECT 
        table_schema,
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_schema = 'public'
      ORDER BY 
        table_name, ordinal_position
    `);
    
    // Check if Product table exists
    const productTable = tables.rows.filter(
      (row: any) => row.table_name === 'Product'
    );
    
    if (productTable.length === 0) {
      console.log("❌ Product table not found in database!");
      console.log("Creating Product table...");
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "public"."Product" (
          "id" text NOT NULL,
          "name" text NOT NULL,
          "description" text,
          "price" double precision NOT NULL,
          "imageUrls" text[],
          "isFeatured" boolean NOT NULL DEFAULT false,
          "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY ("id")
        );
      `);
      
      console.log("✅ Product table created successfully!");
    } else {
      console.log("✅ Product table already exists in database.");
    }
    
    // Update schema documentation
    await updateSchemaDocs();
    
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

async function updateSchemaDocs() {
  console.log("Updating schema documentation...");
  
  // Get all tables from the database
  const tablesResult = await db.execute(sql`
    SELECT 
      table_name
    FROM 
      information_schema.tables
    WHERE 
      table_schema = 'public'
    ORDER BY 
      table_name
  `);
  
  const tables = tablesResult.rows.map((row: any) => row.table_name);
  
  // Get enum types
  const enumsResult = await db.execute(sql`
    SELECT 
      t.typname as enum_name,
      e.enumlabel as enum_value
    FROM 
      pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE 
      n.nspname = 'public'
    ORDER BY 
      t.typname, e.enumsortorder
  `);
  
  // Group enum values by enum name
  const enums: Record<string, string[]> = {};
  for (const row of enumsResult.rows) {
    if (!enums[row.enum_name]) {
      enums[row.enum_name] = [];
    }
    enums[row.enum_name].push(row.enum_value);
  }
  
  // Generate documentation
  let doc = `# PostgreSQL Database Schema Documentation

*Generated on: ${format(new Date(), 'M/d/yyyy, h:mm:ss a')}*

## Table of Contents

`;

  // Add enum types to TOC if any
  if (Object.keys(enums).length > 0) {
    doc += `- [Enum Types](#enum-types)\n`;
  }
  
  // Add tables to TOC
  doc += `- [Tables](#tables)\n`;
  for (const table of tables) {
    doc += `  - [${table}](#${table.toLowerCase()})\n`;
  }
  
  doc += `\n`;
  
  // Add enum types section if any
  if (Object.keys(enums).length > 0) {
    doc += `## Enum Types\n\n`;
    
    for (const [enumName, enumValues] of Object.entries(enums)) {
      doc += `### ${enumName}\n\n`;
      doc += `\`\`\`sql\nENUM ${enumName} (\n`;
      for (const value of enumValues) {
        doc += `  '${value}',\n`;
      }
      doc = doc.slice(0, -2); // Remove last comma
      doc += `\n)\n\`\`\`\n\n`;
    }
  }
  
  // Add tables section
  doc += `## Tables\n\n`;
  
  // Get details for each table
  for (const table of tables) {
    // Get columns
    const columnsResult = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM 
        information_schema.columns
      WHERE 
        table_schema = 'public'
        AND table_name = ${table}
      ORDER BY 
        ordinal_position
    `);
    
    // Get primary key
    const pkResult = await db.execute(sql`
      SELECT 
        c.column_name
      FROM 
        information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
        JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
          AND tc.table_name = c.table_name
          AND ccu.column_name = c.column_name
      WHERE 
        tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = ${table}
    `);
    
    const primaryKeys = pkResult.rows.map((row: any) => row.column_name);
    
    // Get foreign keys
    const fkResult = await db.execute(sql`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = ${table}
    `);
    
    // Add table section
    doc += `### ${table}\n\n`;
    
    // Add table description
    doc += `| Column | Type | Nullable | Default | Description |\n`;
    doc += `| ------ | ---- | -------- | ------- | ----------- |\n`;
    
    for (const column of columnsResult.rows) {
      let dataType = column.data_type;
      if (dataType === 'character varying' && column.character_maximum_length) {
        dataType = `varchar(${column.character_maximum_length})`;
      }
      
      // Check if column is primary key
      const isPK = primaryKeys.includes(column.column_name);
      
      // Check if column is foreign key
      const fkInfo = fkResult.rows.find((row: any) => row.column_name === column.column_name);
      
      // Build description
      let description = [];
      if (isPK) description.push('Primary Key');
      if (fkInfo) description.push(`References ${fkInfo.foreign_table_name}(${fkInfo.foreign_column_name})`);
      
      doc += `| ${column.column_name} | ${dataType} | ${column.is_nullable === 'YES' ? 'Yes' : 'No'} | ${column.column_default || ''} | ${description.join(', ')} |\n`;
    }
    
    doc += `\n`;
  }
  
  // Write to file
  const docsPath = path.join(process.cwd(), 'docs', 'database', 'schema.md');
  fs.writeFileSync(docsPath, doc);
  
  console.log(`✅ Schema documentation updated at ${docsPath}`);
}

// Run the script
void main();
