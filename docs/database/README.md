# Database Schema Management

This project uses Drizzle ORM with PostgreSQL for database management. We've implemented a comprehensive schema management system to help keep the database schema, Drizzle schema, and documentation in sync.

## Quick Start

Run these commands from the project root:

```bash
# Check if database and Drizzle schema are in sync
npm run db:check

# Update database from Drizzle schema (Drizzle → DB)
npm run db:push-schema

# Update Drizzle schema from database (DB → Drizzle)
npm run db:pull-schema

# Update schema documentation
npm run db:document

# Run validation and documentation in one command
npm run db:manage
```

## When to Use Each Command

### 1. Validate Schema (`db:check`)

Use this when you want to check if your Drizzle schema matches the actual database:

```bash
npm run db:check
```

This will:
- Connect to your PostgreSQL database
- Compare tables and columns with your Drizzle schema
- Report any mismatches (tables missing in either direction)

### 2. Push Schema Changes (`db:push-schema`)

Use this after making changes to your Drizzle schema files that you want to apply to the database:

```bash
npm run db:push-schema
```

This will:
- Apply your Drizzle schema changes to the database
- Create new tables, add columns, etc.
- Useful during development or after adding new features

### 3. Pull Schema Changes (`db:pull-schema`)

Use this when the database has been modified directly (e.g., by a DBA) and you need to update your Drizzle schema:

```bash
npm run db:pull-schema
```

This will:
- Introspect your PostgreSQL database
- Generate updated Drizzle schema files in `src/server/db/introspected/`
- Create a merged schema template you can use to update your main schema.ts

**Note:** After running this, you'll need to manually merge the changes into your main schema.ts file.

### 4. Update Documentation (`db:document`)

Use this to generate up-to-date documentation of your database schema:

```bash
npm run db:document
```

This will:
- Query your database for all tables, columns, relationships, and indexes
- Generate a comprehensive markdown file at `docs/database/schema.md`
- Include details like column types, nullability, defaults, foreign keys, and indexes

## Implementation Details

The schema management system is implemented in `src/scripts/db-schema-manager.ts` and provides four main functions:

1. **validateSchema()**: Compares database with Drizzle schema
2. **pushSchema()**: Updates database from Drizzle schema
3. **pullSchema()**: Updates Drizzle schema from database
4. **updateDocumentation()**: Generates schema documentation

## Deployment Considerations

When deploying to production:

1. Always run `npm run db:check` before deployment to ensure schemas are in sync
2. Include `npx drizzle-kit push` in your build process (already added to package.json)
3. Consider using migrations for production changes instead of direct pushes

## Troubleshooting

If you encounter issues:

1. **Database connection errors**: Check your DATABASE_URL in .env
2. **Schema mismatch errors**: Run `npm run db:check` to identify specific mismatches
3. **Introspection issues**: Manually review the generated schema files

## Best Practices

1. **Regular validation**: Run `npm run db:check` regularly during development
2. **Documentation updates**: Run `npm run db:document` after schema changes
3. **Schema reviews**: Always review introspected schema before merging changes
4. **Commit schema files**: Keep your schema.ts and schema.md files in version control

## Database Schema

For the current database schema documentation, see [schema.md](./schema.md).
