---
description: 
globs: 
alwaysApply: false
---

## PROJECT OVERVIEW
- Use context7
- no authentication (because we are in developing process please not create authentication)
- Name: Teera Muay Thai One (teeone)
- Type: Full-stack Muay Thai e-commerce and event management platform
- Tech Stack: Next.js 15, TypeScript, Drizzle ORM, PostgreSQL,  tRPC, Tailwind CSS
- Architecture: T3 Stack (TypeScript, tRPC, Tailwind)

## CORE BUSINESS RULES

### EVENT MANAGEMENT
- Events must have a venue and region assigned
- Events can have multiple ticket types with different pricing
- Event tickets have capacity limits and sold count tracking
- Events support recurring templates for regular events
- Events can be scheduled, cancelled, or completed
- Default poster system available for events without custom images
- Event snapshots stored in bookings for historical data

### COURSE MANAGEMENT
- Training courses must be assigned to a region
- Courses can have instructors assigned
- Courses have skill levels: Beginner, Intermediate, Advanced, All Levels
- Course capacity and enrollment tracking required
- Courses can be active/inactive and featured
- Course enrollment supports payment tracking

### E-COMMERCE RULES
- Products must belong to categories
- Products support multiple images with thumbnail selection
- Stock tracking is mandatory for all products
- Featured products system for homepage display
- Product-to-category many-to-many relationships supported
- Categories support image galleries and SEO fields

### USER & CUSTOMER MANAGEMENT
- Separate users (authentication) and customers (business data) tables
- Customers can be linked to users or exist as guests
- Role-based access control (user, admin roles)
- Instructors can optionally be linked to user accounts
- Customer data snapshots stored in bookings/enrollments

## DATABASE RULES

### SCHEMA MANAGEMENT COMMANDS
```bash




### TIMESTAMP STANDARDS
- All tables must have createdAt and updatedAt timestamps
- Use withTimezone: true for timestamps
- Auto-update updatedAt with $onUpdate(() => new Date())
- Format: timestamp("createdAt", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull()



### REQUIRED FIELDS STANDARDS
- All entities must have: id, createdAt, updatedAt
- SEO entities must have: metaTitle, metaDescription, keywords
- Image entities must have: thumbnailUrl, imageUrls array
- Snapshot entities must store relevant data for historical records

## DEVELOPMENT RULES

### PROJECT STRUCTURE
```
src/
├── app/                 # Next.js App Router pages
│   ├── admin/          # Admin panel pages
│   ├── api/            # API routes
│   └── _components/    # Page-specific components
├── components/         # Reusable components
├── server/            # Server-side code
│   ├── api/           # tRPC routers
│   ├── db/            # Database schema & utilities
│   └── auth/          # Authentication config
├── lib/               # Utility libraries
├── scripts/           # Database management scripts
└── styles/            # Global styles
```

### NAMING CONVENTIONS
- Files: kebab-case (event-templates, create-event)
- Components: PascalCase (EventCard, BookingForm)
- Variables: camelCase (eventId, customerName)
- Database tables: PascalCase (Event, TrainingCourse)
- API routes: kebab-case (/api/event-templates)
- Environment variables: SCREAMING_SNAKE_CASE

### IMAGE UPLOAD RULES
- Maximum file size: 120KB for thumbnails limit at 30 kb create first image as thumnail
- Support multiple images per entity (max 8)
- Use AWS S3 for image storage
- Always include thumbnailUrl and imageUrls array
- Implement proper validation with Zod schemas



## API DEVELOPMENT RULES

### tRPC PROCEDURES
- Use input validation with Zod schemas
- Implement proper error handling
- Use TypeScript for type safety
- Follow RESTful naming conventions
- Use database transactions for multi-table operations

### ROUTE HANDLERS
- Validate all inputs with Zod
- Use proper HTTP status codes
- Implement error handling middleware
- Support both authenticated and guest users
- Return consistent response formats

### DATABASE QUERY STANDARDS
```typescript
// Use eq for equality comparisons
import { eq } from "drizzle-orm";
.where(eq(table.field, value))

// Use proper joins for related data
.leftJoin(relatedTable, eq(table.foreignKey, relatedTable.id))

// Implement pagination
.limit(pageSize).offset(page * pageSize)
```

## FRONTEND RULES

### FORM HANDLING STANDARDS
- Use react-hook-form with Zod validation
- Implement proper error states
- Show loading states during submissions
- Use toast notifications for feedback
- Handle both success and error scenarios

### COMPONENT STANDARDS
- Use TypeScript interfaces for props
- Implement proper loading states
- Handle error boundaries
- Use consistent styling with Tailwind
- Implement accessibility features

### STATE MANAGEMENT
- Use React Query for server state
- Use React Hook Form for form state
- Use React state for local UI state
- Implement proper error handling

## SECURITY RULES

### AUTHENTICATION
-no Authentication

### DATA VALIDATION
- Validate all inputs on both client and server
- Use Zod schemas consistently
- Sanitize user inputs
- Implement CSRF protection
- Use parameterized queries

### ADMIN ACCESS CONTROL
- Restrict admin routes to authorized users
- Implement proper session management
- Log admin actions for audit trail
- Use secure headers and HTTPS

## PERFORMANCE RULES

### DATABASE OPTIMIZATION
- Use indexes for frequently queried fields
- Implement pagination for large datasets
- Use database relations efficiently
- Use database transactions appropriately

### FRONTEND OPTIMIZATION
- Use Next.js Image component
- Implement lazy loading
- Optimize image sizes
- Use WebP format when possible
- Implement proper caching strategies

### API OPTIMIZATION
- Use proper HTTP caching headers
- Implement request deduplication
- Use database connection pooling
- Optimize query performance




### TESTING STANDARDS
- Write unit tests for utility functions
- Test API endpoints thoroughly
- Implement integration tests for critical flows
- Test error scenarios
- Validate form submissions

## DOCUMENTATION RULES

### CODE DOCUMENTATION
- Document complex business logic
- Use TypeScript for self-documenting code
- Maintain API documentation
- Update schema documentation after changes
- Document deployment procedures

### DATABASE DOCUMENTATION
- Auto-generate schema documentation
- Document relationships and constraints
- Maintain migration history
- Document business rules in schema comments

### PROJECT DOCUMENTATION
- Keep README.md updated
- Document setup procedures
- Maintain changelog
- Document known issues and solutions

## GIT & VERSION CONTROL RULES


### DATABASE ERROR HANDLING
- Handle connection failures gracefully
- Implement retry logic for transient errors
- Log database errors for monitoring
- Use transactions for data consistency


