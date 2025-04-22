import postgres from "postgres";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file if it exists
dotenv.config();

// Database connection string from .env
const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/muaythai?sslmode=require";

// Mask sensitive information for logging
const maskedUrl = DATABASE_URL.replace(/:.*@/, ":*****@");
console.log(`Attempting to connect to database: ${maskedUrl}...`);

let sql: postgres.Sql | undefined = undefined;

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  table_name: string;
}

interface TableRelationship {
  constraint_name: string;
  table_name: string;
  column_name: string;
  referenced_table: string;
  referenced_column: string;
  delete_rule: string;
}

interface EnumType {
  typname: string;
  enumlabels: string[];
}

async function analyzeDbSchema(): Promise<void> {
  const outputDir = path.join(process.cwd(), "docs", "database");
  
  try {
    // Create docs/database directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Initialize postgres connection
    sql = postgres(DATABASE_URL, { 
      max: 1, // Use a single connection
      onnotice: (notice) => console.log(`DB Notice: ${notice.message}`),
      // Add more logging or connection options if needed
    });
    console.log("Database connection initiated.");
    
    // Attempt a simple query first to ensure connection
    await sql`SELECT 1`;
    console.log("Simple query successful. Proceeding with schema analysis...");

    // Get all tables in the database
    const tables = await sql<{table_name: string}[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log(`Found ${tables.length} tables in the database.`);
    
    // Get all columns for all tables
    const columns = await sql<TableColumn[]>`
      SELECT 
        c.table_name,
        c.column_name, 
        c.data_type, 
        c.is_nullable, 
        c.column_default
      FROM information_schema.columns c
      JOIN information_schema.tables t 
        ON c.table_name = t.table_name 
        AND c.table_schema = t.table_schema
      WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      ORDER BY c.table_name, c.ordinal_position;
    `;
    
    // Get all foreign key relationships
    const relationships = await sql<TableRelationship[]>`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    // Get all enum types
    const enumTypes = await sql<{typname: string, enumlabels: string}[]>`
      SELECT 
        t.typname,
        array_agg(e.enumlabel) as enumlabels
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `;
    
    // Process enum types to convert string array to actual array
    const processedEnumTypes: EnumType[] = enumTypes.map(type => ({
      typname: type.typname,
      enumlabels: typeof type.enumlabels === 'string' 
        ? type.enumlabels.replace(/[{}]/g, '').split(',') 
        : Array.isArray(type.enumlabels) ? type.enumlabels : []
    }));
    
    // Generate markdown documentation
    const markdownContent = generateMarkdownDoc(tables, columns, relationships, processedEnumTypes);
    
    // Generate JSON documentation for programmatic use
    const jsonContent = {
      tables: tables.map(t => t.table_name),
      columns: columns,
      relationships: relationships,
      enumTypes: processedEnumTypes,
      generatedAt: new Date().toISOString()
    };
    
    // Write the documentation files
    fs.writeFileSync(path.join(outputDir, "schema.md"), markdownContent);
    fs.writeFileSync(path.join(outputDir, "schema.json"), JSON.stringify(jsonContent, null, 2));
    
    console.log(`Schema documentation generated in ${outputDir}`);
    
    // Generate a comparison with Drizzle schema
    const comparisonReport = generateDrizzleComparison(tables, columns, processedEnumTypes);
    fs.writeFileSync(path.join(outputDir, "drizzle-comparison.md"), comparisonReport);
    
    console.log(`Drizzle schema comparison report generated in ${outputDir}`);
    
  } catch (error) {
    console.error("Database analysis error:", error instanceof Error ? error.message : String(error));
    if (error instanceof postgres.PostgresError) {
      console.error("SQL Error Code:", error.code);
      console.error("SQL State:", error.routine);
    }
  } finally {
    if (sql) {
      await sql.end({ timeout: 5 }); // Add timeout
      console.log("Database connection closed.");
    } else {
      console.log("SQL connection was not established.");
    }
  }
}

function generateMarkdownDoc(
  tables: {table_name: string}[], 
  columns: TableColumn[], 
  relationships: TableRelationship[],
  enumTypes: EnumType[]
): string {
  let markdown = `# PostgreSQL Database Schema Documentation\n\n`;
  markdown += `*Generated on: ${new Date().toLocaleString()}*\n\n`;
  
  // Add table of contents
  markdown += `## Table of Contents\n\n`;
  markdown += `- [Enum Types](#enum-types)\n`;
  markdown += `- [Tables](#tables)\n`;
  tables.forEach(table => {
    markdown += `  - [${table.table_name}](#${table.table_name.toLowerCase()})\n`;
  });
  
  // Document enum types
  markdown += `\n## Enum Types\n\n`;
  if (enumTypes.length === 0) {
    markdown += `No enum types found in the database.\n\n`;
  } else {
    enumTypes.forEach(enumType => {
      markdown += `### ${enumType.typname}\n\n`;
      markdown += `Values: ${enumType.enumlabels.map(v => `\`${v}\``).join(', ')}\n\n`;
    });
  }
  
  // Document each table
  markdown += `\n## Tables\n\n`;
  tables.forEach(table => {
    const tableColumns = columns.filter(col => col.table_name === table.table_name);
    const tableRelationships = relationships.filter(rel => rel.table_name === table.table_name);
    
    markdown += `### ${table.table_name}\n\n`;
    
    // Table columns
    markdown += `#### Columns\n\n`;
    markdown += `| Column Name | Data Type | Nullable | Default |\n`;
    markdown += `|-------------|-----------|----------|----------|\n`;
    
    tableColumns.forEach(col => {
      markdown += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default ?? 'NULL'} |\n`;
    });
    
    // Table relationships
    if (tableRelationships.length > 0) {
      markdown += `\n#### Foreign Keys\n\n`;
      markdown += `| Column | References | On Delete |\n`;
      markdown += `|--------|------------|------------|\n`;
      
      tableRelationships.forEach(rel => {
        markdown += `| ${rel.column_name} | ${rel.referenced_table}(${rel.referenced_column}) | ${rel.delete_rule} |\n`;
      });
    }
    
    // Referenced by
    const referencedBy = relationships.filter(rel => rel.referenced_table === table.table_name);
    if (referencedBy.length > 0) {
      markdown += `\n#### Referenced By\n\n`;
      markdown += `| Table | Column | On Delete |\n`;
      markdown += `|-------|--------|------------|\n`;
      
      referencedBy.forEach(rel => {
        markdown += `| ${rel.table_name} | ${rel.column_name} | ${rel.delete_rule} |\n`;
      });
    }
    
    markdown += `\n`;
  });
  
  return markdown;
}

function generateDrizzleComparison(
  tables: {table_name: string}[], 
  columns: TableColumn[],
  enumTypes: EnumType[]
): string {
  let markdown = `# Drizzle Schema vs PostgreSQL Database Comparison\n\n`;
  markdown += `*Generated on: ${new Date().toLocaleString()}*\n\n`;
  
  // Expected Drizzle schema tables and their columns based on schema.ts
  // This is a simplified approach - in a real implementation, you might want to
  // programmatically extract this information from your schema.ts file
  const drizzleTables = [
    "Region", "Venue", "VenueType", "VenueToVenueType", "Event", "EventTicket",
    "Fighter", "Instructor", "TrainingCourse", "Customer", "Booking", "Ticket",
    "CourseEnrollment", "EventTemplate", "EventTemplateTicket", "User", "account",
    "session", "Post", "verification_token"
  ];
  
  // Expected enum types
  const drizzleEnums = [
    { name: "recurrence_type", values: ["none", "weekly", "monthly"] }
  ];
  
  // Compare tables
  markdown += `## Table Comparison\n\n`;
  
  // Tables in Drizzle but not in PostgreSQL
  const missingTables = drizzleTables.filter(
    drizzleTable => !tables.some(dbTable => dbTable.table_name === drizzleTable)
  );
  
  if (missingTables.length > 0) {
    markdown += `### Tables in Drizzle but not in PostgreSQL\n\n`;
    missingTables.forEach(table => {
      markdown += `- ${table}\n`;
    });
    markdown += `\n`;
  }
  
  // Tables in PostgreSQL but not in Drizzle
  const extraTables = tables
    .map(t => t.table_name)
    .filter(dbTable => !drizzleTables.includes(dbTable));
  
  if (extraTables.length > 0) {
    markdown += `### Tables in PostgreSQL but not in Drizzle\n\n`;
    extraTables.forEach(table => {
      markdown += `- ${table}\n`;
    });
    markdown += `\n`;
  }
  
  // Compare enum types
  markdown += `## Enum Type Comparison\n\n`;
  
  // Enum types in Drizzle but not in PostgreSQL
  const missingEnums = drizzleEnums.filter(
    drizzleEnum => !enumTypes.some(dbEnum => dbEnum.typname === drizzleEnum.name)
  );
  
  if (missingEnums.length > 0) {
    markdown += `### Enum Types in Drizzle but not in PostgreSQL\n\n`;
    missingEnums.forEach(enumType => {
      markdown += `- ${enumType.name} (${enumType.values.join(', ')})\n`;
    });
    markdown += `\n`;
  }
  
  // Enum types in PostgreSQL but not in Drizzle
  const extraEnums = enumTypes.filter(
    dbEnum => !drizzleEnums.some(drizzleEnum => drizzleEnum.name === dbEnum.typname)
  );
  
  if (extraEnums.length > 0) {
    markdown += `### Enum Types in PostgreSQL but not in Drizzle\n\n`;
    extraEnums.forEach(enumType => {
      markdown += `- ${enumType.typname} (${enumType.enumlabels.join(', ')})\n`;
    });
    markdown += `\n`;
  }
  
  // Compare enum values for matching enum types
  const matchingEnums = enumTypes.filter(
    dbEnum => drizzleEnums.some(drizzleEnum => drizzleEnum.name === dbEnum.typname)
  );
  
  if (matchingEnums.length > 0) {
    markdown += `### Enum Value Comparison\n\n`;
    
    matchingEnums.forEach(dbEnum => {
      const drizzleEnum = drizzleEnums.find(e => e.name === dbEnum.typname);
      if (drizzleEnum) {
        const missingValues = drizzleEnum.values.filter(v => !dbEnum.enumlabels.includes(v));
        const extraValues = dbEnum.enumlabels.filter(v => !drizzleEnum.values.includes(v));
        
        markdown += `#### ${dbEnum.typname}\n\n`;
        
        if (missingValues.length > 0) {
          markdown += `Values in Drizzle but not in PostgreSQL: ${missingValues.join(', ')}\n\n`;
        }
        
        if (extraValues.length > 0) {
          markdown += `Values in PostgreSQL but not in Drizzle: ${extraValues.join(', ')}\n\n`;
        }
        
        if (missingValues.length === 0 && extraValues.length === 0) {
          markdown += `Enum values match perfectly.\n\n`;
        }
      }
    });
  }
  
  // Detailed table-by-table column comparison would be too complex for this example
  // but you could add it here for a more comprehensive report
  
  markdown += `## Next Steps\n\n`;
  markdown += `1. Review any discrepancies identified above\n`;
  markdown += `2. Run migrations to synchronize the database schema with Drizzle if needed\n`;
  markdown += `3. Update Drizzle schema if the database has intentional differences\n`;
  
  return markdown;
}

// Run the analysis
void analyzeDbSchema();

// Ensure we don't hang if something goes wrong
setTimeout(() => {
  console.log('Timeout reached. Closing db connection...');
  if (sql) {
    sql.end().catch((e: Error) => {
      console.error('Error during timeout cleanup:', e.message);
    });
  }
  process.exit(1); // Force exit with error code
}, 30000); // 30 seconds timeout
