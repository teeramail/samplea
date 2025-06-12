import { pgTable, unique, text, timestamp, integer, foreignKey, doublePrecision, boolean, jsonb, uniqueIndex, index, time, pgEnum } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const orderStatus = pgEnum("order_status", ['pending', 'processing', 'completed', 'cancelled', 'refunded'])
export const recurrenceType = pgEnum("recurrence_type", ['none', 'weekly', 'monthly'])
export const status = pgEnum("status", ['pending', 'completed', 'cancelled', 'in-progress', 'review', 'deferred', 'planned'])



export const eventCategory = pgTable("EventCategory", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		eventCategoryNameKey: unique("EventCategory_name_key").on(table.name),
	}
});

export const region = pgTable("Region", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	imageUrls: text("imageUrls").array(),
	primaryImageIndex: integer("primaryImageIndex").default(0),
	slug: text("slug").notNull(),
	metaTitle: text("metaTitle"),
	metaDescription: text("metaDescription"),
	keywords: text("keywords").array(),
	thumbnailUrl: text("thumbnailUrl"),
},
(table) => {
	return {
		regionSlugUnique: unique("Region_slug_unique").on(table.slug),
	}
});

export const upload = pgTable("Upload", {
	id: text("id").primaryKey().notNull(),
	imageUrl: text("image_url").notNull(),
	originalFilename: text("original_filename").notNull(),
	entityType: text("entity_type"),
	entityId: text("entity_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const venue = pgTable("Venue", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	address: text("address").notNull(),
	capacity: integer("capacity"),
	regionId: text("regionId").notNull(),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	latitude: doublePrecision("latitude"),
	longitude: doublePrecision("longitude"),
	thumbnailUrl: text("thumbnailUrl"),
	imageUrls: text("imageUrls").array(),
	isFeatured: boolean("isFeatured").default(false).notNull(),
	metaTitle: text("metaTitle"),
	metaDescription: text("metaDescription"),
	keywords: text("keywords").array(),
	googleMapsUrl: text("googleMapsUrl"),
	remarks: text("remarks"),
	socialMediaLinks: jsonb("socialMediaLinks"),
},
(table) => {
	return {
		venueRegionIdRegionIdFk: foreignKey({
			columns: [table.regionId],
			foreignColumns: [region.id],
			name: "Venue_regionId_Region_id_fk"
		}).onDelete("restrict"),
	}
});

export const venueType = pgTable("VenueType", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const venueToVenueType = pgTable("VenueToVenueType", {
	id: text("id").primaryKey().notNull(),
	venueId: text("venueId").notNull(),
	venueTypeId: text("venueTypeId").notNull(),
	isPrimary: boolean("isPrimary").default(false).notNull(),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		venueToVenueTypeUniqueIdx: uniqueIndex("venue_to_venue_type_unique_idx").using("btree", table.venueId.asc().nullsLast(), table.venueTypeId.asc().nullsLast()),
		venueToVenueTypeVenueIdVenueIdFk: foreignKey({
			columns: [table.venueId],
			foreignColumns: [venue.id],
			name: "VenueToVenueType_venueId_Venue_id_fk"
		}).onDelete("cascade"),
		venueToVenueTypeVenueTypeIdVenueTypeIdFk: foreignKey({
			columns: [table.venueTypeId],
			foreignColumns: [venueType.id],
			name: "VenueToVenueType_venueTypeId_VenueType_id_fk"
		}).onDelete("cascade"),
	}
});

export const fighter = pgTable("Fighter", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	nickname: text("nickname"),
	weightClass: text("weightClass"),
	record: text("record"),
	imageUrl: text("imageUrl"),
	country: text("country"),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	isFeatured: boolean("isFeatured").default(false).notNull(),
	thumbnailUrl: text("thumbnailUrl"),
	imageUrls: text("imageUrls").array(),
	biography: text("biography"),
});

export const event = pgTable("Event", {
	id: text("id").primaryKey().notNull(),
	title: text("title").notNull(),
	description: text("description"),
	date: timestamp("date", { withTimezone: true, mode: 'string' }).notNull(),
	startTime: timestamp("startTime", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("endTime", { withTimezone: true, mode: 'string' }),
	venueId: text("venueId"),
	regionId: text("regionId"),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	status: text("status").default('SCHEDULED').notNull(),
	thumbnailUrl: text("thumbnailUrl"),
	imageUrls: text("imageUrls").array(),
	categoryId: text("categoryId"),
	isDeleted: boolean("isDeleted").default(false).notNull(),
},
(table) => {
	return {
		eventRegionIdRegionIdFk: foreignKey({
			columns: [table.regionId],
			foreignColumns: [region.id],
			name: "Event_regionId_Region_id_fk"
		}).onDelete("set null"),
		eventVenueIdVenueIdFk: foreignKey({
			columns: [table.venueId],
			foreignColumns: [venue.id],
			name: "Event_venueId_Venue_id_fk"
		}).onDelete("set null"),
		eventCategoryIdFkey: foreignKey({
			columns: [table.categoryId],
			foreignColumns: [eventCategory.id],
			name: "Event_categoryId_fkey"
		}).onDelete("set null"),
	}
});

export const eventTicket = pgTable("EventTicket", {
	id: text("id").primaryKey().notNull(),
	eventId: text("eventId").notNull(),
	seatType: text("seatType").notNull(),
	price: doublePrecision("price").notNull(),
	capacity: integer("capacity").notNull(),
	description: text("description"),
	soldCount: integer("soldCount").default(0).notNull(),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	discountedPrice: doublePrecision("discountedPrice"),
	cost: doublePrecision("cost"),
},
(table) => {
	return {
		eventTicketEventIdEventIdFk: foreignKey({
			columns: [table.eventId],
			foreignColumns: [event.id],
			name: "EventTicket_eventId_Event_id_fk"
		}).onDelete("cascade"),
	}
});

export const user = pgTable("User", {
	id: text("id").primaryKey().notNull(),
	email: text("email").notNull(),
	name: text("name"),
	emailVerified: timestamp("emailVerified", { mode: 'string' }),
	image: text("image"),
	role: text("role").default('user'),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		userEmailUnique: unique("User_email_unique").on(table.email),
	}
});

export const trainingCourse = pgTable("TrainingCourse", {
	id: text("id").primaryKey().notNull(),
	title: text("title").notNull(),
	slug: text("slug").notNull(),
	description: text("description"),
	skillLevel: text("skillLevel"),
	duration: text("duration"),
	scheduleDetails: text("scheduleDetails"),
	price: doublePrecision("price").notNull(),
	capacity: integer("capacity"),
	venueId: text("venueId"),
	regionId: text("regionId").notNull(),
	instructorId: text("instructorId"),
	imageUrls: text("imageUrls").array(),
	primaryImageIndex: integer("primaryImageIndex").default(0),
	isActive: boolean("isActive").default(true).notNull(),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	isFeatured: boolean("isFeatured").default(false).notNull(),
	metaTitle: text("metaTitle"),
	metaDescription: text("metaDescription"),
	keywords: text("keywords").array(),
	thumbnailUrl: text("thumbnailUrl"),
},
(table) => {
	return {
		trainingCourseInstructorIdInstructorIdFk: foreignKey({
			columns: [table.instructorId],
			foreignColumns: [instructor.id],
			name: "TrainingCourse_instructorId_Instructor_id_fk"
		}).onDelete("set null"),
		trainingCourseRegionIdRegionIdFk: foreignKey({
			columns: [table.regionId],
			foreignColumns: [region.id],
			name: "TrainingCourse_regionId_Region_id_fk"
		}).onDelete("restrict"),
		trainingCourseVenueIdVenueIdFk: foreignKey({
			columns: [table.venueId],
			foreignColumns: [venue.id],
			name: "TrainingCourse_venueId_Venue_id_fk"
		}).onDelete("set null"),
		trainingCourseSlugUnique: unique("TrainingCourse_slug_unique").on(table.slug),
	}
});

export const instructor = pgTable("Instructor", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	bio: text("bio"),
	imageUrl: text("imageUrl"),
	expertise: text("expertise").array(),
	userId: text("userId"),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	thumbnailUrl: text("thumbnailUrl"),
	imageUrls: text("imageUrls").array(),
},
(table) => {
	return {
		instructorUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Instructor_userId_User_id_fk"
		}).onDelete("set null"),
	}
});

export const product = pgTable("Product", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	description: text("description"),
	price: doublePrecision("price").notNull(),
	imageUrls: text("imageUrls").array(),
	isFeatured: boolean("isFeatured").default(false).notNull(),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	thumbnailUrl: text("thumbnailUrl"),
	categoryId: text("categoryId"),
	stock: integer("stock").default(0).notNull(),
},
(table) => {
	return {
		productCategoryIdCategoryIdFk: foreignKey({
			columns: [table.categoryId],
			foreignColumns: [category.id],
			name: "Product_categoryId_Category_id_fk"
		}).onDelete("set null"),
	}
});

export const category = pgTable("Category", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	slug: text("slug").notNull(),
	description: text("description"),
	thumbnailUrl: text("thumbnailUrl"),
	imageUrls: text("imageUrls").array(),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		categorySlugUnique: unique("Category_slug_unique").on(table.slug),
	}
});

export const productToCategory = pgTable("ProductToCategory", {
	id: text("id").primaryKey().notNull(),
	productId: text("productId").notNull(),
	categoryId: text("categoryId").notNull(),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		productToCategoryProductIdProductIdFk: foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "ProductToCategory_productId_Product_id_fk"
		}).onDelete("cascade"),
		productToCategoryCategoryIdCategoryIdFk: foreignKey({
			columns: [table.categoryId],
			foreignColumns: [category.id],
			name: "ProductToCategory_categoryId_Category_id_fk"
		}).onDelete("cascade"),
	}
});

export const booking = pgTable("Booking", {
	id: text("id").primaryKey().notNull(),
	eventId: text("eventId").notNull(),
	totalAmount: doublePrecision("totalAmount").notNull(),
	paymentStatus: text("paymentStatus").default('PENDING').notNull(),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	customerId: text("customerId").notNull(),
	customerNameSnapshot: text("customerNameSnapshot"),
	customerEmailSnapshot: text("customerEmailSnapshot"),
	customerPhoneSnapshot: text("customerPhoneSnapshot"),
	eventTitleSnapshot: text("eventTitleSnapshot"),
	eventDateSnapshot: timestamp("eventDateSnapshot", { withTimezone: true, mode: 'string' }),
	venueNameSnapshot: text("venueNameSnapshot"),
	regionNameSnapshot: text("regionNameSnapshot"),
	bookingItemsJson: jsonb("bookingItemsJson"),
	paymentOrderNo: text("paymentOrderNo"),
	paymentTransactionId: text("paymentTransactionId"),
	paymentBankCode: text("paymentBankCode"),
	paymentBankRefCode: text("paymentBankRefCode"),
	paymentDate: text("paymentDate"),
	paymentMethod: text("paymentMethod"),
	metadata: jsonb("metadata"),
},
(table) => {
	return {
		bookingCustomerIdCustomerIdFk: foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "Booking_customerId_Customer_id_fk"
		}).onDelete("restrict"),
		bookingEventIdEventIdFk: foreignKey({
			columns: [table.eventId],
			foreignColumns: [event.id],
			name: "Booking_eventId_Event_id_fk"
		}).onDelete("cascade"),
	}
});

export const customer = pgTable("Customer", {
	id: text("id").primaryKey().notNull(),
	userId: text("userId"),
	name: text("name").notNull(),
	email: text("email").notNull(),
	phone: text("phone"),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		customerEmailIdx: index("customer_email_idx").using("btree", table.email.asc().nullsLast()),
		customerUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Customer_userId_User_id_fk"
		}).onDelete("set null"),
	}
});

export const ticket = pgTable("Ticket", {
	id: text("id").primaryKey().notNull(),
	eventId: text("eventId").notNull(),
	eventDetailId: text("eventDetailId").notNull(),
	bookingId: text("bookingId").notNull(),
	status: text("status").default('ACTIVE').notNull(),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		ticketBookingIdBookingIdFk: foreignKey({
			columns: [table.bookingId],
			foreignColumns: [booking.id],
			name: "Ticket_bookingId_Booking_id_fk"
		}).onDelete("cascade"),
		ticketEventDetailIdEventTicketIdFk: foreignKey({
			columns: [table.eventDetailId],
			foreignColumns: [eventTicket.id],
			name: "Ticket_eventDetailId_EventTicket_id_fk"
		}).onDelete("restrict"),
		ticketEventIdEventIdFk: foreignKey({
			columns: [table.eventId],
			foreignColumns: [event.id],
			name: "Ticket_eventId_Event_id_fk"
		}),
	}
});

export const courseEnrollment = pgTable("CourseEnrollment", {
	id: text("id").primaryKey().notNull(),
	customerId: text("customerId").notNull(),
	courseId: text("courseId").notNull(),
	pricePaid: doublePrecision("pricePaid").notNull(),
	status: text("status").default('PENDING_PAYMENT').notNull(),
	enrollmentDate: timestamp("enrollmentDate", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	startDate: timestamp("startDate", { mode: 'string' }),
	courseTitleSnapshot: text("courseTitleSnapshot"),
	customerNameSnapshot: text("customerNameSnapshot"),
	customerEmailSnapshot: text("customerEmailSnapshot"),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		courseEnrollmentCourseIdTrainingCourseIdFk: foreignKey({
			columns: [table.courseId],
			foreignColumns: [trainingCourse.id],
			name: "CourseEnrollment_courseId_TrainingCourse_id_fk"
		}).onDelete("cascade"),
		courseEnrollmentCustomerIdCustomerIdFk: foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "CourseEnrollment_customerId_Customer_id_fk"
		}).onDelete("restrict"),
	}
});

export const eventTemplate = pgTable("EventTemplate", {
	id: text("id").primaryKey().notNull(),
	templateName: text("templateName").notNull(),
	venueId: text("venueId"),
	regionId: text("regionId"),
	defaultTitleFormat: text("defaultTitleFormat"),
	defaultDescription: text("defaultDescription"),
	recurringDaysOfWeek: integer("recurringDaysOfWeek").array(),
	defaultStartTime: time("defaultStartTime"),
	defaultEndTime: time("defaultEndTime"),
	isActive: boolean("isActive").default(true).notNull(),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	recurrenceType: recurrenceType("recurrenceType").default('none').notNull(),
	startDate: timestamp("startDate", { withTimezone: true, mode: 'string' }),
	endDate: timestamp("endDate", { withTimezone: true, mode: 'string' }),
	dayOfMonth: integer("dayOfMonth").array(),
	thumbnailUrl: text("thumbnailUrl"),
	imageUrls: text("imageUrls").array(),
},
(table) => {
	return {
		eventTemplateRegionIdRegionIdFk: foreignKey({
			columns: [table.regionId],
			foreignColumns: [region.id],
			name: "EventTemplate_regionId_Region_id_fk"
		}).onDelete("restrict"),
		eventTemplateVenueIdVenueIdFk: foreignKey({
			columns: [table.venueId],
			foreignColumns: [venue.id],
			name: "EventTemplate_venueId_Venue_id_fk"
		}).onDelete("restrict"),
	}
});

export const eventTemplateTicket = pgTable("EventTemplateTicket", {
	id: text("id").primaryKey().notNull(),
	eventTemplateId: text("eventTemplateId").notNull(),
	seatType: text("seatType").notNull(),
	defaultPrice: doublePrecision("defaultPrice").notNull(),
	defaultCapacity: integer("defaultCapacity").notNull(),
	defaultDescription: text("defaultDescription"),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		eventTemplateTicketEventTemplateIdEventTemplateIdFk: foreignKey({
			columns: [table.eventTemplateId],
			foreignColumns: [eventTemplate.id],
			name: "EventTemplateTicket_eventTemplateId_EventTemplate_id_fk"
		}).onDelete("cascade"),
	}
});

export const post = pgTable("Post", {
	id: text("id").primaryKey().notNull(),
	slug: text("slug").notNull(),
	title: text("title").notNull(),
	content: text("content").notNull(),
	excerpt: text("excerpt"),
	featuredImageUrl: text("featuredImageUrl"),
	isFeatured: boolean("isFeatured").default(false).notNull(),
	publishedAt: timestamp("publishedAt", { mode: 'string' }),
	status: text("status").default('DRAFT').notNull(),
	regionId: text("regionId"),
	authorId: text("authorId"),
	metaTitle: text("metaTitle"),
	metaDescription: text("metaDescription"),
	keywords: text("keywords").array(),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		postAuthorIdUserIdFk: foreignKey({
			columns: [table.authorId],
			foreignColumns: [user.id],
			name: "Post_authorId_User_id_fk"
		}).onDelete("set null"),
		postRegionIdRegionIdFk: foreignKey({
			columns: [table.regionId],
			foreignColumns: [region.id],
			name: "Post_regionId_Region_id_fk"
		}).onDelete("set null"),
		postSlugUnique: unique("Post_slug_unique").on(table.slug),
	}
});