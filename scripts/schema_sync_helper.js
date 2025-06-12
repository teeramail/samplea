// schema_sync_helper.js
// Comprehensive helper for keeping Drizzle and PostgreSQL schemas in sync
// Usage: node scripts/schema_sync_helper.js [command]

import dotenv from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

dotenv.config();

const commands = {
  'check': 'Check current schema differences',
  'introspect': 'Generate fresh schema from database',
  'push': 'Push Drizzle schema to database', 
  'backup': 'Backup current schema files',
  'restore': 'Restore schema from backup',
  'workflow': 'Show recommended development workflow'
};

function showHelp() {
  console.log('\n🔄 Schema Sync Helper\n');
  console.log('Available commands:');
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(12)} - ${desc}`);
  });
  console.log('\nUsage: node scripts/schema_sync_helper.js [command]\n');
}

function executeCommand(cmd, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    console.log('✅ Success!');
    if (output.trim()) {
      console.log(output);
    }
  } catch (error) {
    console.log('❌ Error:');
    console.log(error.stdout || error.message);
  }
}

function backupSchema() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `schema.${timestamp}.backup.ts`;
  
  try {
    fs.copyFileSync('src/server/db/schema.ts', `src/server/db/${backupName}`);
    console.log(`✅ Schema backed up to: src/server/db/${backupName}`);
  } catch (error) {
    console.log('❌ Backup failed:', error.message);
  }
}

function showWorkflow() {
  console.log(`
🚀 RECOMMENDED DEVELOPMENT WORKFLOW
==================================

📋 Before Making Changes:
  1. npm run db:backup-schema     # Backup current schema
  2. npm run db:sync-check        # Check current state

🔄 When Modifying Database Directly:
  1. npm run db:introspect        # Generate fresh schema from DB
  2. Review generated schema in drizzle/schema.ts
  3. Manually merge changes to src/server/db/schema.ts
  4. npm run db:sync-check        # Verify sync

⚡ When Modifying Drizzle Schema:
  1. Make changes to src/server/db/schema.ts
  2. npm run db:push              # Push to database
  3. npm run db:sync-check        # Verify sync

🔧 Weekly Maintenance:
  1. npm run db:introspect        # Fresh introspection
  2. npm run db:sync-check        # Check for schema drift
  3. Address any differences found

⚠️  Emergency Recovery:
  1. npm run db:backup-schema     # If working, backup first
  2. Restore from working backup or git
  3. npm run db:push              # Restore database state

💡 Pro Tips:
  - Always backup before major changes
  - Use git to track schema changes
  - Test schema changes in development first
  - Keep foreign key relationships simple to avoid reference errors
  `);
}

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }

  switch (command) {
    case 'check':
      executeCommand('node scripts/compare_postgres_drizzle.js', 'Checking schema differences');
      break;
      
    case 'introspect':
      executeCommand('npx drizzle-kit introspect', 'Generating fresh schema from database');
      console.log('\n📝 Next steps:');
      console.log('  1. Review: drizzle/schema.ts');
      console.log('  2. Merge changes to: src/server/db/schema.ts');
      console.log('  3. Run: npm run db:sync-check');
      break;
      
    case 'push':
      backupSchema();
      executeCommand('npx drizzle-kit push', 'Pushing Drizzle schema to database');
      executeCommand('node scripts/compare_postgres_drizzle.js', 'Verifying sync');
      break;
      
    case 'backup':
      backupSchema();
      break;
      
    case 'restore':
      console.log('\n📁 Available backups:');
      const backups = fs.readdirSync('src/server/db/')
        .filter(f => f.includes('.backup.ts'))
        .sort()
        .reverse();
      
      if (backups.length === 0) {
        console.log('❌ No backup files found');
        return;
      }
      
      backups.slice(0, 5).forEach((backup, i) => {
        console.log(`  ${i + 1}. ${backup}`);
      });
      console.log('\n💡 To restore: cp src/server/db/[backup-file] src/server/db/schema.ts');
      break;
      
    case 'workflow':
      showWorkflow();
      break;
      
    default:
      console.log(`❌ Unknown command: ${command}`);
      showHelp();
  }
}

main().catch(console.error); 