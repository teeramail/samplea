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

## Image Upload Implementation Guide

### Adding Image Upload to Create Pages

To implement image upload functionality in create pages (similar to the category creation page), follow these steps:

1. **Frontend Implementation**:
   - Import the necessary dependencies:
     ```typescript
     import { useDropzone } from "react-dropzone";
     import { z } from "zod";
     ```
   - Define a Zod schema for validation that properly handles image URLs:
     ```typescript
     const schema = z.object({
       // Other fields...
       thumbnailUrl: z.union([
         z.string().url(),
         z.string().length(0),
         z.null(),
         z.undefined()
       ]),
       imageUrls: z.array(z.string().url()).max(8).optional().default([]),
     });
     ```
   - Set up state for file handling:
     ```typescript
     const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
     const [imageFiles, setImageFiles] = useState<File[]>([]);
     ```
   - Implement dropzone for image uploads:
     ```typescript
     const { getRootProps, getInputProps } = useDropzone({
       onDrop: (acceptedFiles) => {
         // Handle file validation and state updates
       },
       multiple: false, // or true for multiple files
       maxSize: 120 * 1024, // Size limit in bytes
       accept: { 'image/*': [] }
     });
     ```
   - Add image upload to form submission:
     ```typescript
     // Upload thumbnail
     const formData = new FormData();
     formData.append("entityType", "category"); // Change to your entity type
     formData.append("image", file);
     const res = await fetch("/api/upload-thumbnail", {
       method: "POST",
       body: formData,
     });
     // Handle response and update form data with image URL
     ```

2. **API Implementation**:
   - Ensure your API endpoint properly validates image URLs:
     ```typescript
     import { z } from "zod";
     
     const schema = z.object({
       // Other fields...
       thumbnailUrl: z.union([
         z.string().url(),
         z.string().length(0),
         z.null(),
         z.undefined()
       ]),
       imageUrls: z.array(z.string().url()).max(8).optional().default([]),
     });
     ```
   - Handle database queries correctly:
     ```typescript
     import { eq } from "drizzle-orm";
     
     // Use eq for equality comparisons
     .where(eq(table.field, value))
     ```

3. **Database Schema**:
   - Ensure your database table has fields for storing image URLs:
     ```typescript
     thumbnailUrl: text("thumbnailUrl"),
     imageUrls: text("imageUrls").array(),
     ```

For reference, see the implementation in:
- `src/app/admin/categories/create/page.tsx`
- `src/app/api/temp-create-category/route.ts`
- `src/lib/s3-upload.ts`

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [tRPC Documentation](https://trpc.io/docs)
- [React Dropzone Documentation](https://react-dropzone.js.org/)
