// src/server/db/schema.ts
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  boolean,
  doublePrecision,
  jsonb,
  time,
  uniqueIndex,
  pgEnum,
  // Add other imports as needed
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";
import { createId } from "@paralleldrive/cuid2"; // Using CUID2 for IDs, adjust if needed

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`);

// Define the recurrence type enum
export const recurrenceTypeEnum = pgEnum('recurrence_type', ['none', 'weekly', 'monthly']);

// Define Enums if desired (Example for post status)
// export const postStatusEnum = pgEnum('post_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);

// Add regions table
export const regions = createTable("Region", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()), // Using CUID
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrls: text("imageUrls").array(), // Array of image URLs
  primaryImageIndex: integer("primaryImageIndex").default(0), // Index of primary image in the array
  // SEO Fields
  metaTitle: text("metaTitle"),
  metaDescription: text("metaDescription"),
  keywords: text("keywords").array(),
  // Timestamps
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// Match existing schema from thaiboxinghub database
export const venues = createTable("Venue", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  address: text("address").notNull(),
  capacity: integer("capacity"),
  regionId: text("regionId")
    .references(() => regions.id, { onDelete: "restrict" })
    .notNull(), // Restrict deletion if linked
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  thumbnailUrl: text("thumbnailUrl"),
  imageUrls: text("imageUrls").array(),
  isFeatured: boolean("isFeatured").notNull().default(false), // Added featured flag
  // New fields
  googleMapsUrl: text("googleMapsUrl"),
  remarks: text("remarks"),
  socialMediaLinks: jsonb("socialMediaLinks"), // JSON object for social media links
  // SEO Fields
  metaTitle: text("metaTitle"),
  metaDescription: text("metaDescription"),
  keywords: text("keywords").array(),
  // Timestamps
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// Venue Type table for categorization
export const venueTypes = createTable("VenueType", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// Junction table for many-to-many relationship between Venue and VenueType
export const venueToVenueTypes = createTable(
  "VenueToVenueType",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    venueId: text("venueId")
      .references(() => venues.id, { onDelete: "cascade" })
      .notNull(),
    venueTypeId: text("venueTypeId")
      .references(() => venueTypes.id, { onDelete: "cascade" })
      .notNull(),
    isPrimary: boolean("isPrimary").notNull().default(false),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    venueTypeUniqueIdx: uniqueIndex("venue_to_venue_type_unique_idx").on(
      table.venueId,
      table.venueTypeId,
    ),
  }),
);

export const events = createTable("Event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date", { withTimezone: false }).notNull(),
  startTime: timestamp("startTime", { withTimezone: false }).notNull(),
  endTime: timestamp("endTime", { withTimezone: false }),
  imageUrl: text("imageUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  imageUrls: text("imageUrls").array(),
  usesDefaultPoster: boolean("usesDefaultPoster").default(true).notNull(),
  venueId: text("venueId").references(() => venues.id, {
    onDelete: "set null",
  }), // Allow null if venue deleted
  regionId: text("regionId").references(() => regions.id, {
    onDelete: "set null",
  }), // Allow null if region deleted
  status: text("status").default("SCHEDULED").notNull(), // Consider pgEnum
  // SEO Fields
  metaTitle: text("metaTitle"),
  metaDescription: text("metaDescription"),
  keywords: text("keywords").array(),
  // Timestamps
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// Add EventTicket table for seat types and pricing
export const eventTickets = createTable("EventTicket", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventId: text("eventId")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(), // Cascade delete if event deleted
  seatType: text("seatType").notNull(), // e.g., "VIP", "Ringside", "General"
  price: doublePrecision("price").notNull(),
  discountedPrice: doublePrecision("discountedPrice"),
  cost: doublePrecision("cost"),
  capacity: integer("capacity").notNull(),
  description: text("description"),
  soldCount: integer("soldCount").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

export const fighters = createTable("Fighter", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  nickname: text("nickname"),
  weightClass: text("weightClass"),
  record: text("record"),
  imageUrl: text("imageUrl"),
  country: text("country"),
  isFeatured: boolean("isFeatured").notNull().default(false), // Added featured flag
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// Keep users definition before Instructor if Instructor references users.id
export const users = createTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(), // Ensure email is unique
  // password: text("password").notNull(), // Comment out if using NextAuth only for providers
  name: text("name"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role").default("user"), // Consider pgEnum
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// NEW Instructor Table
export const instructors = createTable("Instructor", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  bio: text("bio"),
  imageUrl: text("imageUrl"),
  expertise: text("expertise").array(), // Array of strings like ["Clinch", "Kicks"]
  userId: text("userId").references(() => users.id, { onDelete: "set null" }), // Optional link to a user account
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// NEW Training Course Table
export const trainingCourses = createTable("TrainingCourse", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(), // For SEO-friendly URLs
  description: text("description"),
  skillLevel: text("skillLevel"), // e.g., "Beginner", "Intermediate", "Advanced", "All Levels"
  duration: text("duration"), // e.g., "1 Week", "1 Month", "90 minutes"
  scheduleDetails: text("scheduleDetails"), // e.g., "Mon-Fri 9am-11am"
  price: doublePrecision("price").notNull(),
  capacity: integer("capacity"),
  venueId: text("venueId").references(() => venues.id, {
    onDelete: "set null",
  }), // Optional, if venue-specific
  regionId: text("regionId")
    .references(() => regions.id, { onDelete: "restrict" })
    .notNull(), // Course belongs to a region
  instructorId: text("instructorId").references(() => instructors.id, {
    onDelete: "set null",
  }), // Link to instructor
  imageUrls: text("imageUrls").array(),
  primaryImageIndex: integer("primaryImageIndex").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").notNull().default(false), // Added featured flag
  // SEO Fields
  metaTitle: text("metaTitle"),
  metaDescription: text("metaDescription"),
  keywords: text("keywords").array(),
  // Timestamps
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// Product Categories table
export const categories = createTable("Category", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

export const products = createTable("Product", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  thumbnailUrl: text("thumbnailUrl"), // Add thumbnailUrl field
  imageUrls: text("imageUrls").array(),
  categoryId: text("categoryId")
    .references(() => categories.id, { onDelete: "set null" }),
  isFeatured: boolean("isFeatured").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// New Customer table to handle both registered users and guests
export const customers = createTable(
  "Customer",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId").references(() => users.id, { onDelete: "set null" }), // Nullable - can be linked to a User or null for guests
    name: text("name").notNull(),
    email: text("email").notNull(), // Consider index for faster lookups if querying often
    phone: text("phone"),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (customer) => ({
    emailIdx: index("customer_email_idx").on(customer.email), // Example index
  }),
);

// Bookings table to track ticket purchases - now linked to Customer and includes snapshot data
export const bookings = createTable("Booking", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  customerId: text("customerId")
    .references(() => customers.id, { onDelete: "restrict" })
    .notNull(),
  eventId: text("eventId")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(), // Cascade delete if event deleted
  totalAmount: doublePrecision("totalAmount").notNull(),
  paymentStatus: text("paymentStatus").notNull().default("PENDING"), // Consider pgEnum
  paymentOrderNo: text("paymentOrderNo"), // Track ChillPay order number

  // Add ChillPay payment related fields
  paymentTransactionId: text("paymentTransactionId"), // ChillPay transaction ID
  paymentBankCode: text("paymentBankCode"), // Bank code from ChillPay (e.g., internetbank_bay)
  paymentBankRefCode: text("paymentBankRefCode"), // Reference code from the bank
  paymentDate: text("paymentDate"), // Payment transaction date from ChillPay
  paymentMethod: text("paymentMethod"), // Payment method (creditcard, qrcode, etc.)

  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),

  // Snapshot fields (nullable as they are populated by the API)
  customerNameSnapshot: text("customerNameSnapshot"),
  customerEmailSnapshot: text("customerEmailSnapshot"),
  customerPhoneSnapshot: text("customerPhoneSnapshot"),
  eventTitleSnapshot: text("eventTitleSnapshot"),
  eventDateSnapshot: timestamp("eventDateSnapshot", { withTimezone: false }),
  venueNameSnapshot: text("venueNameSnapshot"),
  regionNameSnapshot: text("regionNameSnapshot"),
  bookingItemsJson: jsonb("bookingItemsJson"), // Use jsonb type
});

// Add ticket details table to store individual tickets in a booking
export const tickets = createTable("Ticket", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventId: text("eventId")
    .references(() => events.id)
    .notNull(), // Keep eventId for direct querying
  eventDetailId: text("eventDetailId")
    .references(() => eventTickets.id, { onDelete: "restrict" })
    .notNull(), // Link to specific ticket type
  bookingId: text("bookingId")
    .references(() => bookings.id, { onDelete: "cascade" })
    .notNull(), // Cascade delete if booking deleted
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, USED, CANCELLED - consider pgEnum
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// NEW Course Enrollment Table
export const courseEnrollments = createTable("CourseEnrollment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  customerId: text("customerId")
    .references(() => customers.id, { onDelete: "restrict" })
    .notNull(),
  courseId: text("courseId")
    .references(() => trainingCourses.id, { onDelete: "cascade" })
    .notNull(), // Cascade delete if course deleted
  pricePaid: doublePrecision("pricePaid").notNull(),
  status: text("status").notNull().default("PENDING_PAYMENT"), // e.g., CONFIRMED, CANCELLED - consider pgEnum
  enrollmentDate: timestamp("enrollmentDate", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  startDate: timestamp("startDate", { withTimezone: false }), // Optional specific start date
  // Snapshot fields
  courseTitleSnapshot: text("courseTitleSnapshot"),
  customerNameSnapshot: text("customerNameSnapshot"),
  customerEmailSnapshot: text("customerEmailSnapshot"),
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// NEW Event Template table
export const eventTemplates = createTable("EventTemplate", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  templateName: text("templateName").notNull(),
  venueId: text("venueId")
    .references(() => venues.id, { onDelete: "restrict" }),
  regionId: text("regionId")
    .references(() => regions.id, { onDelete: "restrict" }),
  defaultTitleFormat: text("defaultTitleFormat"),
  defaultDescription: text("defaultDescription"),

  // --- Recurrence Fields ---
  recurrenceType: recurrenceTypeEnum("recurrenceType").default('none').notNull(),
  recurringDaysOfWeek: integer("recurringDaysOfWeek").array(),
  dayOfMonth: integer("dayOfMonth").array(),
  // --- End Recurrence Fields ---

  defaultStartTime: time("defaultStartTime", { withTimezone: false }),
  defaultEndTime: time("defaultEndTime", { withTimezone: false }),

  // --- Activation Fields ---
  isActive: boolean("isActive").default(true).notNull(),
  startDate: timestamp("startDate", { withTimezone: false }),
  endDate: timestamp("endDate", { withTimezone: false }),
  // --- End Activation Fields ---

  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// NEW Event Template Ticket table
export const eventTemplateTickets = createTable("EventTemplateTicket", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventTemplateId: text("eventTemplateId")
    .references(() => eventTemplates.id, { onDelete: "cascade" })
    .notNull(),
  seatType: text("seatType").notNull(),
  defaultPrice: doublePrecision("defaultPrice").notNull(),
  defaultCapacity: integer("defaultCapacity").notNull(),
  defaultDescription: text("defaultDescription"),
  createdAt: timestamp("createdAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

// --- ADDED POST TABLE DEFINITION ---
export const posts = createTable(
  "Post", // Use "Post" to match the SQL table name from previous instructions
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()), // Use CUID
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    featuredImageUrl: text("featuredImageUrl"),
    isFeatured: boolean("isFeatured").notNull().default(false),
    publishedAt: timestamp("publishedAt", { withTimezone: false }), // Match existing timestamp style
    status: text("status").notNull().default("DRAFT"), // Consider pgEnum('post_status')
    regionId: text("regionId").references(() => regions.id, {
      onDelete: "set null",
    }), // Optional link to region
    authorId: text("authorId").references(() => users.id, {
      onDelete: "set null",
    }), // Optional link to user/author
    metaTitle: text("metaTitle"),
    metaDescription: text("metaDescription"),
    keywords: text("keywords").array(),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
      .$onUpdate(() => new Date()), // Add $onUpdate if you want auto-update behavior
  },
);

// Keep the existing NextAuth tables
export const accounts = createTable(
  "account",
  {
    userId: text("user_id") // Changed from varchar to text to match User.id
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // Add onDelete cascade
    type: text("type") // Changed from varchar to text
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: text("provider").notNull(), // Changed from varchar to text
    providerAccountId: text("provider_account_id").notNull(), // Changed from varchar to text
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"), // Changed from varchar to text
    scope: text("scope"), // Changed from varchar to text
    id_token: text("id_token"),
    session_state: text("session_state"), // Changed from varchar to text
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const sessions = createTable(
  "session",
  {
    sessionToken: text("session_token").notNull().primaryKey(), // Changed from varchar to text
    userId: text("user_id") // Changed from varchar to text
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // Add onDelete cascade
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true, // Keep withTimezone for NextAuth expires
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(), // Changed from varchar to text
    token: text("token").notNull().unique(), // Changed from varchar to text, ensure token is unique
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true, // Keep withTimezone for NextAuth expires
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

// ----- DEFINE RELATIONSHIPS -----

// --- MODIFIED regionsRelations ---
export const regionsRelations = relations(regions, ({ one: _one, many }) => ({
  venues: many(venues),
  events: many(events),
  eventTemplates: many(eventTemplates),
  trainingCourses: many(trainingCourses),
  posts: many(posts), // <-- ADDED posts relation
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  events: many(events),
  region: one(regions, { fields: [venues.regionId], references: [regions.id] }),
  eventTemplates: many(eventTemplates),
  trainingCourses: many(trainingCourses),
  venueTypes: many(venueToVenueTypes),
}));

export const venueTypesRelations = relations(venueTypes, ({ many }) => ({
  venues: many(venueToVenueTypes),
}));

export const venueToVenueTypesRelations = relations(
  venueToVenueTypes,
  ({ one }) => ({
    venue: one(venues, {
      fields: [venueToVenueTypes.venueId],
      references: [venues.id],
    }),
    venueType: one(venueTypes, {
      fields: [venueToVenueTypes.venueTypeId],
      references: [venueTypes.id],
    }),
  }),
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  venue: one(venues, { fields: [events.venueId], references: [venues.id] }),
  region: one(regions, { fields: [events.regionId], references: [regions.id] }),
  eventTickets: many(eventTickets), // Changed from tickets to eventTickets
  bookings: many(bookings),
}));

export const eventTicketsRelations = relations(
  eventTickets,
  ({ one, many }) => ({
    event: one(events, {
      fields: [eventTickets.eventId],
      references: [events.id],
    }),
    tickets: many(tickets), // Relation to individual issued tickets
  }),
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  event: one(events, { fields: [bookings.eventId], references: [events.id] }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  event: one(events, { fields: [tickets.eventId], references: [events.id] }),
  eventTicketType: one(eventTickets, {
    fields: [tickets.eventDetailId],
    references: [eventTickets.id],
  }), // Renamed for clarity
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
}));

export const eventTemplatesRelations = relations(
  eventTemplates,
  ({ one, many }) => ({
    venue: one(venues, {
      fields: [eventTemplates.venueId],
      references: [venues.id],
    }),
    region: one(regions, {
      fields: [eventTemplates.regionId],
      references: [regions.id],
    }),
    templateTickets: many(eventTemplateTickets),
  }),
);

export const eventTemplateTicketsRelations = relations(
  eventTemplateTickets,
  ({ one }) => ({
    eventTemplate: one(eventTemplates, {
      fields: [eventTemplateTickets.eventTemplateId],
      references: [eventTemplates.id],
    }),
  }),
);

export const instructorsRelations = relations(instructors, ({ one, many }) => ({
  user: one(users, { fields: [instructors.userId], references: [users.id] }),
  trainingCourses: many(trainingCourses),
}));

export const trainingCoursesRelations = relations(
  trainingCourses,
  ({ one, many }) => ({
    venue: one(venues, {
      fields: [trainingCourses.venueId],
      references: [venues.id],
    }),
    region: one(regions, {
      fields: [trainingCourses.regionId],
      references: [regions.id],
    }),
    instructor: one(instructors, {
      fields: [trainingCourses.instructorId],
      references: [instructors.id],
    }),
    enrollments: many(courseEnrollments),
  }),
);

export const courseEnrollmentsRelations = relations(
  courseEnrollments,
  ({ one }) => ({
    customer: one(customers, {
      fields: [courseEnrollments.customerId],
      references: [customers.id],
    }),
    course: one(trainingCourses, {
      fields: [courseEnrollments.courseId],
      references: [trainingCourses.id],
    }),
  }),
);

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  bookings: many(bookings),
  courseEnrollments: many(courseEnrollments),
}));

// --- MODIFIED usersRelations ---
export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  customerProfile: one(customers, {
    fields: [users.id],
    references: [customers.userId],
  }),
  instructorProfile: one(instructors, {
    fields: [users.id],
    references: [instructors.userId],
  }),
  posts: many(posts), // <-- ADDED posts relation (authored posts)
}));

// --- ADDED postsRelations ---
export const postsRelations = relations(posts, ({ one }) => ({
  region: one(regions, {
    fields: [posts.regionId],
    references: [regions.id],
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

// --- ADDED categoriesRelations ---
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products)
}));

// --- ADDED productsRelations ---
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

// NextAuth relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
