import { pgTable, foreignKey, unique, uuid, varchar, text, timestamp, numeric, boolean, integer, index, doublePrecision, jsonb, uniqueIndex, time, primaryKey, pgEnum } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const orderStatus = pgEnum("order_status", ['pending', 'processing', 'completed', 'cancelled', 'refunded'])
export const recurrenceType = pgEnum("recurrence_type", ['none', 'weekly', 'monthly'])
export const status = pgEnum("status", ['pending', 'completed', 'cancelled', 'in-progress', 'review', 'deferred', 'planned'])



export const realestateBlogCategories = pgTable("realestate_blog_categories", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	slug: varchar("slug", { length: 100 }).notNull(),
	description: text("description"),
	parentId: uuid("parent_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		realestateBlogCategoriesParentIdRealestateBlogCategories: foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "realestate_blog_categories_parent_id_realestate_blog_categories"
		}),
		realestateBlogCategoriesSlugUnique: unique("realestate_blog_categories_slug_unique").on(table.slug),
	}
});

export const realestateAgent = pgTable("realestate_agent", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	phone: varchar("phone", { length: 50 }),
	address: text("address"),
	commissionRate: numeric("commission_rate", { precision: 5, scale:  2 }).default('10.00'),
	active: boolean("active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const realestateBlogPosts = pgTable("realestate_blog_posts", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	title: varchar("title", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }).notNull(),
	customSeoTitle: varchar("custom_seo_title", { length: 255 }),
	metaDescription: text("meta_description"),
	excerpt: text("excerpt"),
	coverImageUrl: varchar("cover_image_url", { length: 2048 }),
	coverImageAlt: varchar("cover_image_alt", { length: 255 }),
	images: text("images").array().default(["RAY"]),
	imageAlts: text("image_alts").array().default(["RAY"]),
	categoryId: uuid("category_id"),
	tags: text("tags").array(),
	authorId: uuid("author_id"),
	status: varchar("status", { length: 50 }).default('draft').notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	scheduledPublishAt: timestamp("scheduled_publish_at", { mode: 'string' }),
	estimatedReadTimeMinutes: integer("estimated_read_time_minutes"),
	viewCount: integer("view_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	content: text("content"),
},
(table) => {
	return {
		realestateBlogPostsCategoryIdRealestateBlogCategoriesId: foreignKey({
			columns: [table.categoryId],
			foreignColumns: [realestateBlogCategories.id],
			name: "realestate_blog_posts_category_id_realestate_blog_categories_id"
		}),
		realestateBlogPostsSlugUnique: unique("realestate_blog_posts_slug_unique").on(table.slug),
	}
});

export const realestateBomItem = pgTable("realestate_bom_item", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	bomId: uuid("bom_id").notNull(),
	componentProductId: uuid("component_product_id").notNull(),
	quantity: numeric("quantity").notNull(),
	unit: varchar("unit", { length: 50 }),
	notes: text("notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		realestateBomItemBomIdRealestateBillOfMaterialsIdFk: foreignKey({
			columns: [table.bomId],
			foreignColumns: [realestateBillOfMaterials.id],
			name: "realestate_bom_item_bom_id_realestate_bill_of_materials_id_fk"
		}),
		realestateBomItemComponentProductIdRealestateProductId: foreignKey({
			columns: [table.componentProductId],
			foreignColumns: [realestateProduct.id],
			name: "realestate_bom_item_component_product_id_realestate_product_id_"
		}),
	}
});

export const realestateCards = pgTable("realestate_cards", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	blogPostId: uuid("blog_post_id").notNull(),
	order: integer("order").default(0).notNull(),
	title: varchar("title", { length: 255 }),
	subtitle: varchar("subtitle", { length: 255 }),
	textContent: text("text_content"),
	caption: text("caption"),
	contentType: varchar("content_type", { length: 50 }).default('text').notNull(),
	imageUrl: varchar("image_url", { length: 2048 }),
	imageAltText: varchar("image_alt_text", { length: 255 }),
	cardThumbnailUrl: varchar("card_thumbnail_url", { length: 2048 }),
	images: text("images").array().default(["RAY"]),
	imageAlts: text("image_alts").array().default(["RAY"]),
	videoUrl: varchar("video_url", { length: 2048 }),
	layoutStyle: varchar("layout_style", { length: 50 }).default('standard'),
	templateName: varchar("template_name", { length: 100 }),
	ctaButtonText: varchar("cta_button_text", { length: 100 }),
	ctaButtonUrl: varchar("cta_button_url", { length: 2048 }),
	isHighlighted: boolean("is_highlighted").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	content: text("content"),
},
(table) => {
	return {
		realestateCardsBlogPostIdRealestateBlogPostsIdFk: foreignKey({
			columns: [table.blogPostId],
			foreignColumns: [realestateBlogPosts.id],
			name: "realestate_cards_blog_post_id_realestate_blog_posts_id_fk"
		}),
	}
});

export const realestateCategory = pgTable("realestate_category", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description"),
	slug: varchar("slug", { length: 100 }).notNull(),
	parentId: uuid("parent_id"),
	isActive: boolean("is_active").default(true),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		realestateCategoryParentIdRealestateCategoryIdFk: foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "realestate_category_parent_id_realestate_category_id_fk"
		}),
		realestateCategorySlugUnique: unique("realestate_category_slug_unique").on(table.slug),
	}
});

export const realestateOrder = pgTable("realestate_order", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	orderNumber: varchar("order_number", { length: 50 }).notNull(),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	customerEmail: varchar("customer_email", { length: 255 }),
	customerPhone: varchar("customer_phone", { length: 50 }),
	customerAddress: text("customer_address"),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	agentId: uuid("agent_id"),
	subagentId: uuid("subagent_id"),
	source: varchar("source", { length: 20 }).default('web').notNull(),
	status: orderStatus("status").default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		realestateOrderAgentIdRealestateAgentIdFk: foreignKey({
			columns: [table.agentId],
			foreignColumns: [realestateAgent.id],
			name: "realestate_order_agent_id_realestate_agent_id_fk"
		}),
		realestateOrderSubagentIdRealestateSubagentIdFk: foreignKey({
			columns: [table.subagentId],
			foreignColumns: [realestateSubagent.id],
			name: "realestate_order_subagent_id_realestate_subagent_id_fk"
		}),
		realestateOrderOrderNumberUnique: unique("realestate_order_order_number_unique").on(table.orderNumber),
	}
});

export const realestateInventoryTransaction = pgTable("realestate_inventory_transaction", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	orderId: uuid("order_id"),
	productionOrderId: uuid("production_order_id"),
	quantity: integer("quantity").notNull(),
	type: varchar("type", { length: 20 }).notNull(),
	notes: text("notes"),
	referenceNumber: varchar("reference_number", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
},
(table) => {
	return {
		realestateInventoryTransactionProductIdRealestateProduct: foreignKey({
			columns: [table.productId],
			foreignColumns: [realestateProduct.id],
			name: "realestate_inventory_transaction_product_id_realestate_product_"
		}),
		realestateInventoryTransactionOrderIdRealestateOrderIdF: foreignKey({
			columns: [table.orderId],
			foreignColumns: [realestateOrder.id],
			name: "realestate_inventory_transaction_order_id_realestate_order_id_f"
		}),
		realestateInventoryTransactionProductionOrderIdRealestate: foreignKey({
			columns: [table.productionOrderId],
			foreignColumns: [realestateProductionOrder.id],
			name: "realestate_inventory_transaction_production_order_id_realestate"
		}),
	}
});

export const realestateBillOfMaterials = pgTable("realestate_bill_of_materials", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	finishedProductId: uuid("finished_product_id").notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	batchQuantity: integer("batch_quantity").default(1).notNull(),
	active: boolean("active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		realestateBillOfMaterialsFinishedProductIdRealestatePro: foreignKey({
			columns: [table.finishedProductId],
			foreignColumns: [realestateProduct.id],
			name: "realestate_bill_of_materials_finished_product_id_realestate_pro"
		}),
	}
});

export const realestateProduct = pgTable("realestate_product", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	sku: varchar("sku", { length: 50 }),
	price: numeric("price", { precision: 10, scale:  2 }).notNull(),
	cost: numeric("cost", { precision: 10, scale:  2 }),
	stockQuantity: integer("stock_quantity").default(0).notNull(),
	thumbnail: text("thumbnail"),
	images: text("images").array(),
	tags: text("tags").array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		realestateProductSkuUnique: unique("realestate_product_sku_unique").on(table.sku),
	}
});

export const realestateOrderItem = pgTable("realestate_order_item", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id").notNull(),
	quantity: integer("quantity").default(1).notNull(),
	price: numeric("price", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		realestateOrderItemOrderIdRealestateOrderIdFk: foreignKey({
			columns: [table.orderId],
			foreignColumns: [realestateOrder.id],
			name: "realestate_order_item_order_id_realestate_order_id_fk"
		}),
		realestateOrderItemProductIdRealestateProductIdFk: foreignKey({
			columns: [table.productId],
			foreignColumns: [realestateProduct.id],
			name: "realestate_order_item_product_id_realestate_product_id_fk"
		}),
	}
});

export const realestateProductionOrder = pgTable("realestate_production_order", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	productionNumber: varchar("production_number", { length: 50 }).notNull(),
	bomId: uuid("bom_id").notNull(),
	quantity: integer("quantity").default(1).notNull(),
	status: status("status").default('planned').notNull(),
	scheduledDate: timestamp("scheduled_date", { mode: 'string' }),
	completionDate: timestamp("completion_date", { mode: 'string' }),
	notes: text("notes"),
	cost: numeric("cost", { precision: 10, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		realestateProductionOrderBomIdRealestateBillOfMaterials: foreignKey({
			columns: [table.bomId],
			foreignColumns: [realestateBillOfMaterials.id],
			name: "realestate_production_order_bom_id_realestate_bill_of_materials"
		}),
		realestateProductionOrderProductionNumberUnique: unique("realestate_production_order_production_number_unique").on(table.productionNumber),
	}
});

export const testup2Upload = pgTable("testup2_upload", {
	id: text("id").primaryKey().notNull(),
	imageUrl: text("image_url").notNull(),
	originalFilename: text("original_filename").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const realestateSubagent = pgTable("realestate_subagent", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	agentId: uuid("agent_id").notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	phone: varchar("phone", { length: 50 }),
	address: text("address"),
	commissionRate: numeric("commission_rate", { precision: 5, scale:  2 }).default('5.00'),
	active: boolean("active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		realestateSubagentAgentIdRealestateAgentIdFk: foreignKey({
			columns: [table.agentId],
			foreignColumns: [realestateAgent.id],
			name: "realestate_subagent_agent_id_realestate_agent_id_fk"
		}),
	}
});

export const realestateCommission = pgTable("realestate_commission", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	agentId: uuid("agent_id"),
	subagentId: uuid("subagent_id"),
	amount: numeric("amount", { precision: 10, scale:  2 }).notNull(),
	status: status("status").default('pending').notNull(),
	paymentDate: timestamp("payment_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		realestateCommissionOrderIdRealestateOrderIdFk: foreignKey({
			columns: [table.orderId],
			foreignColumns: [realestateOrder.id],
			name: "realestate_commission_order_id_realestate_order_id_fk"
		}),
		realestateCommissionAgentIdRealestateAgentIdFk: foreignKey({
			columns: [table.agentId],
			foreignColumns: [realestateAgent.id],
			name: "realestate_commission_agent_id_realestate_agent_id_fk"
		}),
		realestateCommissionSubagentIdRealestateSubagentIdFk: foreignKey({
			columns: [table.subagentId],
			foreignColumns: [realestateSubagent.id],
			name: "realestate_commission_subagent_id_realestate_subagent_id_fk"
		}),
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

export const session = pgTable("session", {
	sessionToken: text("session_token").primaryKey().notNull(),
	userId: text("user_id").notNull(),
	expires: timestamp("expires", { withTimezone: true, mode: 'string' }).notNull(),
},
(table) => {
	return {
		userIdIdx: index("session_user_id_idx").using("btree", table.userId.asc().nullsLast()),
		sessionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_User_id_fk"
		}).onDelete("cascade"),
	}
});

export const testup2Upload = pgTable("Testup2Upload", {
	id: text("id").primaryKey().notNull(),
	imageUrl: text("image_url").notNull(),
	originalFilename: text("original_filename").notNull(),
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
});

export const event = pgTable("Event", {
	id: text("id").primaryKey().notNull(),
	title: text("title").notNull(),
	description: text("description"),
	date: timestamp("date", { withTimezone: true, mode: 'string' }).notNull(),
	startTime: timestamp("startTime", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("endTime", { withTimezone: true, mode: 'string' }),
	imageUrl: text("imageUrl"),
	usesDefaultPoster: boolean("usesDefaultPoster").default(true).notNull(),
	venueId: text("venueId"),
	regionId: text("regionId"),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	status: text("status").default('SCHEDULED').notNull(),
	thumbnailUrl: text("thumbnailUrl"),
	imageUrls: text("imageUrls").array(),
	metaTitle: text("metaTitle"),
	metaDescription: text("metaDescription"),
	keywords: text("keywords").array(),
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

export const realestateProductCategory = pgTable("realestate_product_category", {
	productId: uuid("product_id").notNull(),
	categoryId: uuid("category_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		realestateProductCategoryProductIdRealestateProductIdFk: foreignKey({
			columns: [table.productId],
			foreignColumns: [realestateProduct.id],
			name: "realestate_product_category_product_id_realestate_product_id_fk"
		}),
		realestateProductCategoryCategoryIdRealestateCategoryId: foreignKey({
			columns: [table.categoryId],
			foreignColumns: [realestateCategory.id],
			name: "realestate_product_category_category_id_realestate_category_id_"
		}),
		realestateProductCategoryProductIdCategoryIdPk: primaryKey({ columns: [table.productId, table.categoryId], name: "realestate_product_category_product_id_category_id_pk"}),
	}
});

export const verificationToken = pgTable("verification_token", {
	identifier: text("identifier").notNull(),
	token: text("token").notNull(),
	expires: timestamp("expires", { withTimezone: true, mode: 'string' }).notNull(),
},
(table) => {
	return {
		verificationTokenIdentifierTokenPk: primaryKey({ columns: [table.identifier, table.token], name: "verification_token_identifier_token_pk"}),
		verificationTokenTokenUnique: unique("verification_token_token_unique").on(table.token),
	}
});

export const account = pgTable("account", {
	userId: text("user_id").notNull(),
	type: text("type").notNull(),
	provider: text("provider").notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text("scope"),
	idToken: text("id_token"),
	sessionState: text("session_state"),
},
(table) => {
	return {
		userIdIdx: index("account_user_id_idx").using("btree", table.userId.asc().nullsLast()),
		accountUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_User_id_fk"
		}).onDelete("cascade"),
		accountProviderProviderAccountIdPk: primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_provider_account_id_pk"}),
	}
});