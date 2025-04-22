# Next.js + tRPC + Drizzle ORM + PostgreSQL Project Setup

This file contains everything you need to set up a new project with the same technology stack as Teeramuaythaione.

## Quick Start

1. Create a new Next.js project:
```bash
npx create-next-app@latest my-project-name
```
Select: TypeScript ✅, ESLint ✅, Tailwind CSS ✅, src/ directory ✅, App Router ✅

2. Copy the package.json dependencies and scripts section below
3. Run `npm install`
4. Copy each file to the specified location
5. Run `npm run db:generate` to generate your database schema

## package.json

Replace or merge these sections into your package.json:

```json
{
  "dependencies": {
    "@paralleldrive/cuid2": "^2.2.2",
    "@tanstack/react-query": "^4.36.1",
    "@trpc/client": "^10.43.6",
    "@trpc/next": "^10.43.6",
    "@trpc/react-query": "^10.43.6",
    "@trpc/server": "^10.43.6",
    "date-fns": "^2.30.0",
    "drizzle-orm": "^0.29.1",
    "next": "14.0.3",
    "pg": "^8.11.3",
    "react": "^18",
    "react-dom": "^18",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/pg": "^8.10.9",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "drizzle-kit": "^0.20.6",
    "eslint": "^8",
    "eslint-config-next": "14.0.3",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Environment Variables

Create a `.env` file in the root of your project:

```
# Database
DATABASE_URL="postgres://username:password@host:port/database"
```

## Project Files

### 1. Database Schema (src/server/db/schema.ts)

```typescript
import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// Example of creating an enum
export const statusEnum = pgEnum("status", ["active", "inactive", "pending"]);

// Example table
export const items = pgTable("items", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Add more tables as needed for your specific project
```

### 2. Drizzle Config (drizzle.config.ts)

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
});
```

### 3. Database Connection (src/server/db/index.ts)

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
```

### 4. tRPC Setup (src/server/api/trpc.ts)

```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { ZodError } from "zod";

import { db } from "~/server/db";

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  return {
    db,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
```

### 5. Sample Router (src/server/api/routers/item.ts)

```typescript
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { items } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const itemRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
        page: z.number().min(1).optional(),
        sortField: z.string().optional(),
        sortDirection: z.enum(["asc", "desc"]).optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const page = input?.page ?? 1;
      const offset = (page - 1) * limit;
      const sortField = input?.sortField ?? "updatedAt";
      const sortDirection = input?.sortDirection ?? "desc";

      const itemsList = await ctx.db.query.items.findMany({
        orderBy: [sortDirection === "asc" ? asc(items[sortField]) : desc(items[sortField])],
        limit: limit,
        offset: offset,
      });

      const totalCount = await ctx.db
        .select({ count: count() })
        .from(items)
        .then((result) => result[0]?.count ?? 0);

      return {
        items: itemsList,
        totalCount,
        pageCount: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.query.items.findFirst({
        where: eq(items.id, input.id),
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      return item;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = createId();
      await ctx.db.insert(items).values({
        id,
        name: input.name,
        description: input.description,
      });

      return { id };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        status: statusEnum,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      await ctx.db.update(items)
        .set({ 
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(items.id, id));

      return { id };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(items).where(eq(items.id, input.id));
      return { success: true };
    }),
});
```

### 6. Root Router (src/server/api/root.ts)

```typescript
import { createTRPCRouter } from "~/server/api/trpc";
import { itemRouter } from "~/server/api/routers/item";

export const appRouter = createTRPCRouter({
  item: itemRouter,
});

export type AppRouter = typeof appRouter;
```

### 7. tRPC API Handler (src/app/api/trpc/[trpc]/route.ts)

```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req }),
  });

export { handler as GET, handler as POST };
```

### 8. tRPC React Client (src/trpc/react.ts)

```typescript
"use client";

import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "~/server/api/root";

export const api = createTRPCReact<AppRouter>();
```

### 9. tRPC Server Client (src/trpc/client.ts)

```typescript
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { type AppRouter } from "~/server/api/root";

export const api = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/trpc`,
    }),
  ],
});
```

### 10. tRPC Provider (src/app/providers.tsx)

```typescript
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import { httpBatchLink } from "@trpc/client";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
```

### 11. Root Layout (src/app/layout.tsx)

```typescript
import { TRPCProvider } from "~/app/providers";
import "./globals.css";

export const metadata = {
  title: "My Application",
  description: "Created with Next.js, tRPC, and Drizzle",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
```

### 12. Sample List Page (src/app/admin/items/page.tsx)

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { format } from "date-fns";

export default function ItemsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState("updatedAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const { data, isLoading } = api.item.list.useQuery({
    page,
    limit,
    sortField,
    sortDirection,
  });

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Items</h1>
        <Link
          href="/admin/items/create"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create New Item
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    {sortField === "name" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    {sortField === "status" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer"
                    onClick={() => handleSort("updatedAt")}
                  >
                    Updated
                    {sortField === "updatedAt" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data?.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.description || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          item.status === "active"
                            ? "bg-green-100 text-green-800"
                            : item.status === "inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {format(new Date(item.updatedAt), "MMM d, yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/admin/items/${item.id}/view`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/items/${item.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(page - 1) * limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(page * limit, data.totalCount)}
                </span>{" "}
                of <span className="font-medium">{data.totalCount}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pageCount}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### 13. Sample Form Component (src/components/forms/ItemForm.tsx)

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormProps {
  initialData?: ItemFormData;
  onSubmit: (data: ItemFormData) => void;
  isSubmitting: boolean;
}

export function ItemForm({ initialData, onSubmit, isSubmitting }: ItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      status: "active",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          {...register("description")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          {...register("status")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
```

## Project Structure

```
my-project-name/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── trpc/
│   │   │       └── [trpc]/
│   │   │           └── route.ts
│   │   ├── admin/
│   │   │   └── items/
│   │   │       ├── page.tsx
│   │   │       ├── [id]/
│   │   │       │   ├── view/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── edit/
│   │   │       │       └── page.tsx
│   │   │       └── create/
│   │   │           └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── forms/
│   │       └── ItemForm.tsx
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   └── item.ts
│   │   │   ├── root.ts
│   │   │   └── trpc.ts
│   │   └── db/
│   │       ├── index.ts
│   │       └── schema.ts
│   ├── styles/
│   │   └── globals.css
│   └── trpc/
│       ├── client.ts
│       └── react.ts
├── drizzle.config.ts
├── .env
├── .gitignore
├── next.config.js
├── package.json
├── README.md
└── tsconfig.json
```

## To-Do List

1. **Define your database schema**
   - Identify the main entities in your application
   - Create tables with proper relationships

2. **Create API routes with tRPC**
   - Create routers for each entity
   - Implement CRUD operations

3. **Build admin interface**
   - Create list pages with pagination
   - Implement detail view pages
   - Create edit forms

4. **Implement business logic**
   - Add domain-specific functionality

5. **Create user-facing pages**
   - Design and implement public pages

6. **Add utilities and helpers**
   - Create date formatting helpers
   - Add form validation schemas

7. **Set up deployment**
   - Configure Vercel for frontend
   - Set up PostgreSQL database

8. **Testing and QA**
   - Test all CRUD operations
   - Verify data validation

## Notes

- **Authentication**: Will be added later when the project is nearly finished
- **Database**: Use Neon.tech for PostgreSQL hosting (free tier)
- **Styling**: Uses Tailwind CSS for styling
- **Form Handling**: Uses react-hook-form with Zod validation
