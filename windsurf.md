# Teera Muay Thai One - Project Guide

## Project Overview

This is a Muay Thai e-commerce and event management platform built with Next.js, Drizzle ORM, and PostgreSQL. The platform allows users to browse and purchase Muay Thai merchandise (boxer pants, shirts, etc.), book events, and manage courses.

## Key Features

- **Events Management**: Create, edit, and manage Muay Thai events
- **Course Management**: Manage training courses with instructors
- **E-commerce**: Sell Muay Thai merchandise with product categories
- **Booking System**: Allow users to book events and courses

## Database Management

We use PostgreSQL with Drizzle ORM for database management. We've implemented a comprehensive schema management system to help keep the database schema, Drizzle schema, and documentation in sync.

### Database Commands

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

For detailed documentation on the database schema and management tools, see:
- [Database Management Guide](./docs/database/README.md)
- [Database Schema Documentation](./docs/database/schema.md)

## Project Structure

- `src/app`: Next.js app router pages and components
- `src/server`: Server-side code
  - `src/server/api`: tRPC API routes
  - `src/server/db`: Database schema and utilities
  - `src/server/auth`: Authentication setup
- `src/components`: Reusable React components
- `src/scripts`: Utility scripts including database management tools
- `docs`: Project documentation

## Development Workflow

1. Run `npm run dev` to start the development server
2. Make changes to the code
3. Run `npm run db:check` to validate database schema
4. Run `npm run db:document` to update schema documentation
5. Commit changes and push to GitHub

## Deployment

The project is deployed on Vercel. The build process includes database migrations to ensure the production database schema is up to date:

```json
"build": "npx drizzle-kit push && next build"
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [tRPC Documentation](https://trpc.io/docs)
