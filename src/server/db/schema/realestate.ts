// src/server/db/schema/realestate.ts
import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  numeric,
  integer,
  jsonb,
  pgEnum,
  primaryKey,
  uniqueIndex,
  index,
  varchar,
} from "drizzle-orm/pg-core";

// Enums
export const statusEnum = pgEnum('status', [
  'pending', 
  'completed', 
  'cancelled', 
  'in-progress', 
  'review', 
  'deferred'
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'completed',
  'cancelled',
  'refunded'
]);

// Test Upload Table
export const testup2Upload = pgTable("testup2_upload", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  image_url: text("image_url").notNull(),
  original_filename: text("original_filename").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Real Estate Agent
export const realestateAgent = pgTable("realestate_agent", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  commission_rate: numeric("commission_rate", { precision: 5, scale: 2 }).default("10.00"),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

// Real Estate Subagent
export const realestateSubagent = pgTable("realestate_subagent", {
  id: uuid("id").primaryKey().defaultRandom(),
  agent_id: uuid("agent_id").references(() => realestateAgent.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  commission_rate: numeric("commission_rate", { precision: 5, scale: 2 }).default("5.00"),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

// Real Estate Product
export const realestateProduct = pgTable("realestate_product", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sku: varchar("sku", { length: 50 }).unique(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  stock_quantity: integer("stock_quantity").default(0).notNull(),
  thumbnail: text("thumbnail"),
  images: text("images").array(),
  tags: text("tags").array(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

// Real Estate Category
export const realestateCategory = pgTable("realestate_category", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  parent_id: uuid("parent_id").references(() => realestateCategory.id),
  is_active: boolean("is_active").default(true),
  display_order: integer("display_order").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Product-Category Many-to-Many Relationship
export const realestateProductCategory = pgTable("realestate_product_category", {
  id: uuid("id").primaryKey().defaultRandom(),
  product_id: uuid("product_id").references(() => realestateProduct.id).notNull(),
  category_id: uuid("category_id").references(() => realestateCategory.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.product_id, table.category_id] }),
}));

// Real Estate Order
export const realestateOrder = pgTable("realestate_order", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_number: varchar("order_number", { length: 50 }).notNull().unique(),
  customer_name: varchar("customer_name", { length: 255 }).notNull(),
  customer_email: varchar("customer_email", { length: 255 }),
  customer_phone: varchar("customer_phone", { length: 50 }),
  customer_address: text("customer_address"),
  total_amount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  agent_id: uuid("agent_id").references(() => realestateAgent.id),
  subagent_id: uuid("subagent_id").references(() => realestateSubagent.id),
  source: varchar("source", { length: 20 }).default('web').notNull(),
  status: orderStatusEnum("status").default('pending').notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

// Order Items
export const realestateOrderItem = pgTable("realestate_order_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: uuid("order_id").references(() => realestateOrder.id).notNull(),
  product_id: uuid("product_id").references(() => realestateProduct.id).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Commission Tracking
export const realestateCommission = pgTable("realestate_commission", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: uuid("order_id").references(() => realestateOrder.id).notNull(),
  agent_id: uuid("agent_id").references(() => realestateAgent.id),
  subagent_id: uuid("subagent_id").references(() => realestateSubagent.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: statusEnum("status").default('pending').notNull(),
  payment_date: timestamp("payment_date"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

// Bill of Materials
export const realestateBillOfMaterials = pgTable("realestate_bill_of_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  finished_product_id: uuid("finished_product_id").references(() => realestateProduct.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  batch_quantity: integer("batch_quantity").default(1).notNull(),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

// BOM Items
export const realestateBomItem = pgTable("realestate_bom_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  bom_id: uuid("bom_id").references(() => realestateBillOfMaterials.id).notNull(),
  component_product_id: uuid("component_product_id").references(() => realestateProduct.id).notNull(),
  quantity: numeric("quantity").notNull(),
  unit: varchar("unit", { length: 50 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Production Orders
export const realestateProductionOrder = pgTable("realestate_production_order", {
  id: uuid("id").primaryKey().defaultRandom(),
  production_number: varchar("production_number", { length: 50 }).notNull().unique(),
  bom_id: uuid("bom_id").references(() => realestateBillOfMaterials.id).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  status: statusEnum("status").default('planned').notNull(),
  scheduled_date: timestamp("scheduled_date"),
  completion_date: timestamp("completion_date"),
  notes: text("notes"),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

// Inventory Transactions
export const realestateInventoryTransaction = pgTable("realestate_inventory_transaction", {
  id: uuid("id").primaryKey().defaultRandom(),
  product_id: uuid("product_id").references(() => realestateProduct.id).notNull(),
  order_id: uuid("order_id").references(() => realestateOrder.id),
  production_order_id: uuid("production_order_id").references(() => realestateProductionOrder.id),
  quantity: integer("quantity").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'in', 'out', 'adjustment', etc.
  notes: text("notes"),
  reference_number: varchar("reference_number", { length: 100 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  created_by: uuid("created_by"),
});

// Blog Categories
export const realestateBlogCategory = pgTable("realestate_blog_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  parent_id: uuid("parent_id").references(() => realestateBlogCategory.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Blog Posts
export const realestateBlogPost = pgTable("realestate_blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  custom_seo_title: varchar("custom_seo_title", { length: 255 }),
  meta_description: text("meta_description"),
  excerpt: text("excerpt"),
  cover_image_url: varchar("cover_image_url", { length: 2048 }),
  cover_image_alt: varchar("cover_image_alt", { length: 255 }),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  image_alts: text("image_alts").array().default(sql`ARRAY[]::text[]`),
  category_id: uuid("category_id").references(() => realestateBlogCategory.id),
  tags: text("tags").array(),
  author_id: uuid("author_id"), // Could reference a users table
  status: varchar("status", { length: 50 }).default('draft').notNull(),
  published_at: timestamp("published_at"),
  scheduled_publish_at: timestamp("scheduled_publish_at"),
  estimated_read_time_minutes: integer("estimated_read_time_minutes"),
  view_count: integer("view_count").default(0).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  content: text("content"),
});

// Blog Cards (for modular content)
export const realestateCard = pgTable("realestate_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  blog_post_id: uuid("blog_post_id").references(() => realestateBlogPost.id).notNull(),
  order: integer("order").default(0).notNull(),
  title: varchar("title", { length: 255 }),
  subtitle: varchar("subtitle", { length: 255 }),
  text_content: text("text_content"),
  caption: text("caption"),
  content_type: varchar("content_type", { length: 50 }).default('text').notNull(),
  image_url: varchar("image_url", { length: 2048 }),
  image_alt_text: varchar("image_alt_text", { length: 255 }),
  card_thumbnail_url: varchar("card_thumbnail_url", { length: 2048 }),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  image_alts: text("image_alts").array().default(sql`ARRAY[]::text[]`),
  video_url: varchar("video_url", { length: 2048 }),
  layout_style: varchar("layout_style", { length: 50 }).default('standard'),
  template_name: varchar("template_name", { length: 100 }),
  cta_button_text: varchar("cta_button_text", { length: 100 }),
  cta_button_url: varchar("cta_button_url", { length: 2048 }),
  is_highlighted: boolean("is_highlighted").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  content: text("content"),
});

// Indexes
// Add indexes for frequently queried columns
// Example:
// .index("idx_blog_post_status", ["status"])

// Relations
export const realestateRelations = {
  // Define relations here
};

// Export all tables
export const realestateTables = {
  testup2Upload,
  realestateAgent,
  realestateSubagent,
  realestateProduct,
  realestateCategory,
  realestateProductCategory,
  realestateOrder,
  realestateOrderItem,
  realestateCommission,
  realestateBillOfMaterials,
  realestateBomItem,
  realestateProductionOrder,
  realestateInventoryTransaction,
  realestateBlogCategory,
  realestateBlogPost,
  realestateCard,
};

export type RealEstateTable = keyof typeof realestateTables;
