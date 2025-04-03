import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
  boolean,
  doublePrecision,
  jsonb,
  time,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`);

// Add regions table
export const regions = createTable(
  "Region",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrls: text("imageUrls").array(), // Array of image URLs
    primaryImageIndex: integer("primaryImageIndex").default(0), // Index of primary image in the array
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

// Match existing schema from thaiboxinghub database
export const venues = createTable(
  "Venue",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    capacity: integer("capacity"),
    regionId: text("regionId").references(() => regions.id).notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    thumbnailUrl: text("thumbnailUrl"),
    imageUrls: text("imageUrls").array(),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

export const events = createTable(
  "Event",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    date: timestamp("date", { withTimezone: false }).notNull(),
    startTime: timestamp("startTime", { withTimezone: false }).notNull(),
    endTime: timestamp("endTime", { withTimezone: false }),
    imageUrl: text("imageUrl"),
    thumbnailUrl: text("thumbnailUrl"),
    imageUrls: text("imageUrls").array(),
    usesDefaultPoster: boolean("usesDefaultPoster").default(true).notNull(),
    venueId: text("venueId").references(() => venues.id),
    regionId: text("regionId").references(() => regions.id),
    status: text("status").default('SCHEDULED').notNull(),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

// Add EventTicket table for seat types and pricing
export const eventTickets = createTable(
  "EventTicket",
  {
    id: text("id").primaryKey(),
    eventId: text("eventId").references(() => events.id).notNull(),
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
      .notNull(),
  }
);

export const fighters = createTable(
  "Fighter",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    nickname: text("nickname"),
    weightClass: text("weightClass"),
    record: text("record"),
    imageUrl: text("imageUrl"),
    country: text("country"),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

// NEW Instructor Table
export const instructors = createTable(
  "Instructor",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    bio: text("bio"),
    imageUrl: text("imageUrl"),
    expertise: text("expertise").array(), // Array of strings like ["Clinch", "Kicks"]
    userId: text("userId").references(() => users.id), // Optional link to a user account
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

export const users = createTable(
  "User",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    name: text("name"),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    role: text("role").default("user"),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

// NEW Training Course Table
export const trainingCourses = createTable(
  "TrainingCourse",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(), // For SEO-friendly URLs
    description: text("description"),
    skillLevel: text("skillLevel"), // e.g., "Beginner", "Intermediate", "Advanced", "All Levels"
    duration: text("duration"), // e.g., "1 Week", "1 Month", "90 minutes"
    scheduleDetails: text("scheduleDetails"), // e.g., "Mon-Fri 9am-11am"
    price: doublePrecision("price").notNull(),
    capacity: integer("capacity"),
    venueId: text("venueId").references(() => venues.id), // Optional, if venue-specific
    regionId: text("regionId").references(() => regions.id).notNull(), // Course belongs to a region
    instructorId: text("instructorId").references(() => instructors.id), // Link to instructor
    imageUrls: text("imageUrls").array(),
    primaryImageIndex: integer("primaryImageIndex").default(0),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

// New Customer table to handle both registered users and guests
export const customers = createTable(
  "Customer",
  {
    id: text("id").primaryKey(),
    userId: text("userId").references(() => users.id), // Nullable - can be linked to a User or null for guests
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

// Bookings table to track ticket purchases - now linked to Customer and includes snapshot data
export const bookings = createTable(
  "Booking",
  {
    id: text("id").primaryKey(),
    customerId: text("customerId").references(() => customers.id).notNull(),
    eventId: text("eventId").references(() => events.id).notNull(),
    totalAmount: doublePrecision("totalAmount").notNull(),
    paymentStatus: text("paymentStatus").notNull().default("PENDING"),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    
    // Snapshot fields (nullable as they are populated by the API)
    customerNameSnapshot: text("customerNameSnapshot"),
    customerEmailSnapshot: text("customerEmailSnapshot"),
    customerPhoneSnapshot: text("customerPhoneSnapshot"),
    eventTitleSnapshot: text("eventTitleSnapshot"),
    eventDateSnapshot: timestamp("eventDateSnapshot", { withTimezone: false }),
    venueNameSnapshot: text("venueNameSnapshot"),
    regionNameSnapshot: text("regionNameSnapshot"),
    bookingItemsJson: jsonb("bookingItemsJson"), // Use jsonb type
  }
);

// Add ticket details table to store individual tickets in a booking
export const tickets = createTable(
  "Ticket",
  {
    id: text("id").primaryKey(),
    eventId: text("eventId").references(() => events.id).notNull(),
    eventDetailId: text("eventDetailId").references(() => eventTickets.id).notNull(),
    bookingId: text("bookingId").references(() => bookings.id).notNull(),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE, USED, CANCELLED
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

// NEW Course Enrollment Table
export const courseEnrollments = createTable(
  "CourseEnrollment",
  {
    id: text("id").primaryKey(),
    customerId: text("customerId").references(() => customers.id).notNull(),
    courseId: text("courseId").references(() => trainingCourses.id).notNull(),
    pricePaid: doublePrecision("pricePaid").notNull(),
    status: text("status").notNull().default("PENDING_PAYMENT"), // e.g., CONFIRMED, CANCELLED
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
      .notNull(),
  }
);

// NEW Event Template table
export const eventTemplates = createTable(
  "EventTemplate",
  {
    id: text("id").primaryKey(),
    templateName: text("templateName").notNull(),
    venueId: text("venueId").references(() => venues.id).notNull(),
    regionId: text("regionId").references(() => regions.id).notNull(),
    defaultTitleFormat: text("defaultTitleFormat").notNull(),
    defaultDescription: text("defaultDescription"),
    recurringDaysOfWeek: integer("recurringDaysOfWeek").array().notNull(),
    defaultStartTime: time("defaultStartTime").notNull(),
    defaultEndTime: time("defaultEndTime"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

// NEW Event Template Ticket table
export const eventTemplateTickets = createTable(
  "EventTemplateTicket",
  {
    id: text("id").primaryKey(),
    eventTemplateId: text("eventTemplateId").references(() => eventTemplates.id, { onDelete: 'cascade' }).notNull(),
    seatType: text("seatType").notNull(),
    defaultPrice: doublePrecision("defaultPrice").notNull(),
    defaultCapacity: integer("defaultCapacity").notNull(),
    defaultDescription: text("defaultDescription"),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

// Define relationships
export const regionsRelations = relations(regions, ({ one: _one, many }) => ({
  venues: many(venues),
  events: many(events),
  eventTemplates: many(eventTemplates),
  trainingCourses: many(trainingCourses),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  events: many(events),
  region: one(regions, { fields: [venues.regionId], references: [regions.id] }),
  eventTemplates: many(eventTemplates),
  trainingCourses: many(trainingCourses),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  venue: one(venues, { fields: [events.venueId], references: [venues.id] }),
  region: one(regions, { fields: [events.regionId], references: [regions.id] }),
  tickets: many(eventTickets),
  bookings: many(bookings),
}));

export const eventTicketsRelations = relations(eventTickets, ({ one, many }) => ({
  event: one(events, { fields: [eventTickets.eventId], references: [events.id] }),
  tickets: many(tickets),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  event: one(events, { fields: [bookings.eventId], references: [events.id] }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  event: one(events, { fields: [tickets.eventId], references: [events.id] }),
  eventDetail: one(eventTickets, { fields: [tickets.eventDetailId], references: [eventTickets.id] }),
  booking: one(bookings, { fields: [tickets.bookingId], references: [bookings.id] }),
}));

// NEW relations for EventTemplate
export const eventTemplatesRelations = relations(eventTemplates, ({ one, many }) => ({
  venue: one(venues, {
    fields: [eventTemplates.venueId],
    references: [venues.id],
  }),
  region: one(regions, {
    fields: [eventTemplates.regionId],
    references: [regions.id],
  }),
  templateTickets: many(eventTemplateTickets),
}));

// NEW relations for EventTemplateTicket
export const eventTemplateTicketsRelations = relations(eventTemplateTickets, ({ one }) => ({
  eventTemplate: one(eventTemplates, {
    fields: [eventTemplateTickets.eventTemplateId],
    references: [eventTemplates.id],
  }),
}));

// NEW relations for Instructor
export const instructorsRelations = relations(instructors, ({ one, many }) => ({
  user: one(users, { fields: [instructors.userId], references: [users.id] }),
  trainingCourses: many(trainingCourses),
}));

// NEW relations for TrainingCourse
export const trainingCoursesRelations = relations(trainingCourses, ({ one, many }) => ({
  venue: one(venues, { fields: [trainingCourses.venueId], references: [venues.id] }),
  region: one(regions, { fields: [trainingCourses.regionId], references: [regions.id] }),
  instructor: one(instructors, { fields: [trainingCourses.instructorId], references: [instructors.id] }),
  enrollments: many(courseEnrollments),
}));

// NEW relations for CourseEnrollment
export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  customer: one(customers, { fields: [courseEnrollments.customerId], references: [customers.id] }),
  course: one(trainingCourses, { fields: [courseEnrollments.courseId], references: [trainingCourses.id] }),
}));

// Add relation back from Customer to CourseEnrollment
export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  bookings: many(bookings),
  courseEnrollments: many(courseEnrollments),
}));

// Add relation back from User to Instructor
export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  customerProfile: one(customers, { fields: [users.id], references: [customers.userId] }),
  instructorProfile: one(instructors, { fields: [users.id], references: [instructors.userId] }),
}));

// Keep the existing NextAuth tables
export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);
