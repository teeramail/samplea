---
description: Next.js Full-Stack Application Development Rules
globs: src/**/*.ts, src/**/*.tsx, **/*.js, **/*.jsx
alwaysApply: true
---

# Next.js Full-Stack Application Development Rules

## **Technology Stack Overview**

This project uses the following core technologies:
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript for type safety
- **API Layer**: tRPC for end-to-end type safety
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod for schema validation
- **Authentication**: NextAuth.js (if implemented)
- **File Storage**: AWS S3 for file uploads
- **Styling**: Tailwind CSS
- **ID Generation**: CUID2 for unique identifiers
- **Date Handling**: date-fns for date formatting

## **Project Structure Requirements**

```
src/
├── app/                    # Next.js App Router pages
├── components/            # Reusable UI components
├── server/
│   ├── api/
│   │   ├── routers/      # tRPC routers
│   │   └── trpc.ts       # tRPC setup
│   └── db/
│       ├── schema.ts     # Drizzle database schema
│       └── index.ts      # Database connection
├── lib/                  # Utility functions
└── types/               # TypeScript type definitions
```

## **tRPC Router Development Rules**

### **Router Structure**
```typescript
// ✅ DO: Structure routers with consistent patterns
export const exampleRouter = createTRPCRouter({
  // Public procedures for non-authenticated endpoints
  getPublic: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Implementation
    }),

  // Protected procedures for authenticated endpoints
  create: protectedProcedure
    .input(validationSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

### **Input Validation**
```typescript
// ✅ DO: Always use Zod for input validation
.input(
  z.object({
    title: z.string().min(1),
    date: z.date(),
    optional: z.string().optional(),
    array: z.array(z.string()).optional(),
  })
)

// ❌ DON'T: Skip input validation
.input(z.any()) // Never use z.any()
```

### **Error Handling**
```typescript
// ✅ DO: Use TRPCError for consistent error handling
try {
  // Database operation
} catch (error) {
  console.error("Operation failed:", error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to perform operation",
  });
}
```

### **Database Queries**
```typescript
// ✅ DO: Use Drizzle query builder with relations
const results = await ctx.db.query.tableName.findMany({
  where: and(
    eq(table.field, value),
    eq(table.isDeleted, false)
  ),
  orderBy: [desc(table.updatedAt)],
  limit: input.limit,
  offset: (input.page - 1) * input.limit,
  with: {
    relationName: true,
  },
});

// ✅ DO: Handle pagination consistently
return {
  items: results,
  totalCount,
  pageCount: Math.ceil(totalCount / limit),
  currentPage: page,
};
```

## **AWS S3 Upload Component Rules**

### **S3 Upload Hook**
```typescript
// ✅ DO: Create reusable S3 upload hook
import { useState } from 'react';
import { api } from '~/lib/api';

export const useS3Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const getPresignedUrl = api.upload.getPresignedUrl.useMutation();
  
  const uploadFile = async (file: File, folder: string = 'uploads') => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Get presigned URL from your API
      const { url, key } = await getPresignedUrl.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        folder,
      });
      
      // Upload to S3
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      setUploadProgress(100);
      return { key, url: `https://your-bucket.s3.region.amazonaws.com/${key}` };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  return { uploadFile, isUploading, uploadProgress };
};
```

### **S3 Upload Component**
```typescript
// ✅ DO: Create reusable upload component
interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  folder?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  acceptedTypes = "image/*",
  maxSizeMB = 5,
  folder = "uploads"
}) => {
  const { uploadFile, isUploading, uploadProgress } = useS3Upload();
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }
    
    try {
      const { url } = await uploadFile(file, folder);
      onUploadComplete(url);
    } catch (error) {
      alert('Upload failed. Please try again.');
    }
  };
  
  return (
    <div className="upload-container">
      <input
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      {isUploading && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};
```

### **S3 tRPC Router**
```typescript
// ✅ DO: Create S3 upload router
export const uploadRouter = createTRPCRouter({
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        folder: z.string().default('uploads'),
      })
    )
    .mutation(async ({ input }) => {
      const { fileName, fileType, folder } = input;
      const key = `${folder}/${createId()}-${fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      });
      
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      return { url, key };
    }),
});
```

## **PostgreSQL with Drizzle ORM Rules**

### **Schema Definition**
```typescript
// ✅ DO: Define schemas with proper types and constraints
import { pgTable, text, timestamp, boolean, integer, decimal } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const events = pgTable('events', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  thumbnailUrl: text('thumbnail_url'),
  imageUrl: text('image_url'),
  venueId: text('venue_id').references(() => venues.id),
  regionId: text('region_id').references(() => regions.id),
  status: text('status').notNull().default('SCHEDULED'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ✅ DO: Define relations for joins
export const eventsRelations = relations(events, ({ one, many }) => ({
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
  region: one(regions, {
    fields: [events.regionId],
    references: [regions.id],
  }),
  tickets: many(eventTickets),
}));
```

### **Database Queries Best Practices**
```typescript
// ✅ DO: Use proper filtering and pagination
const getEvents = async (filters: {
  limit: number;
  page: number;
  query?: string;
  includeDeleted?: boolean;
}) => {
  const conditions = [];
  
  if (!filters.includeDeleted) {
    conditions.push(eq(events.isDeleted, false));
  }
  
  if (filters.query) {
    conditions.push(
      sql`LOWER(${events.title}) LIKE LOWER(${`%${filters.query}%`})`
    );
  }
  
  const whereClause = conditions.length > 0 
    ? and(...conditions) 
    : undefined;
  
  const results = await db.query.events.findMany({
    where: whereClause,
    orderBy: [desc(events.updatedAt)],
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
    with: {
      venue: true,
      region: true,
      tickets: true,
    },
  });
  
  return results;
};
```

### **Soft Delete Pattern**
```typescript
// ✅ DO: Implement soft delete for important entities
export const softDeleteEvent = async (id: string) => {
  await db
    .update(events)
    .set({ 
      isDeleted: true, 
      updatedAt: new Date() 
    })
    .where(eq(events.id, id));
};

// ✅ DO: Always filter out deleted records in queries
const activeEvents = await db.query.events.findMany({
  where: eq(events.isDeleted, false),
});
```

### **Transaction Handling**
```typescript
// ✅ DO: Use transactions for related operations
const createEventWithTickets = async (eventData: EventInput) => {
  return await db.transaction(async (tx) => {
    const [newEvent] = await tx
      .insert(events)
      .values(eventData)
      .returning({ id: events.id });
    
    if (eventData.tickets?.length) {
      await tx.insert(eventTickets).values(
        eventData.tickets.map(ticket => ({
          ...ticket,
          eventId: newEvent.id,
        }))
      );
    }
    
    return newEvent;
  });
};
```

## **Environment Variables**

```bash
# ✅ DO: Define all required environment variables
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET_NAME="your-bucket-name"
AWS_REGION="us-east-1"
NEXTAUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## **Type Safety Rules**

```typescript
// ✅ DO: Create proper TypeScript interfaces
interface EventWithRelations {
  id: string;
  title: string;
  date: Date;
  venue?: {
    id: string;
    name: string;
  };
  tickets: Array<{
    id: string;
    seatType: string;
    price: number;
  }>;
}

// ✅ DO: Use Zod for runtime validation and TypeScript inference
const eventSchema = z.object({
  title: z.string().min(1),
  date: z.date(),
  venueId: z.string().optional(),
});

type EventInput = z.infer<typeof eventSchema>;
```

## **Performance Optimization**

```typescript
// ✅ DO: Use database indexes for frequently queried fields
// In your migration files:
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_is_deleted ON events(is_deleted);

// ✅ DO: Implement proper pagination
const paginatedResults = {
  items: results,
  totalCount,
  pageCount: Math.ceil(totalCount / limit),
  currentPage: page,
  hasNext: page < Math.ceil(totalCount / limit),
  hasPrev: page > 1,
};
```

---

**Remember**: Always validate inputs, handle errors gracefully, use transactions for related operations, implement proper authentication, and maintain consistent code structure throughout the application. 