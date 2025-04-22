-- SQL to create the Product table
CREATE TABLE IF NOT EXISTS "public"."Product" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "price" double precision NOT NULL,
  "imageUrls" text[],
  "isFeatured" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Add some sample products (optional)
INSERT INTO "public"."Product" ("id", "name", "description", "price", "imageUrls", "isFeatured")
VALUES 
  ('prod_01', 'Muay Thai Gloves - Red', 'Premium leather Muay Thai gloves for training and competition', 49.99, ARRAY['https://example.com/gloves_red.jpg'], true),
  ('prod_02', 'Muay Thai Shorts - Black/Gold', 'Traditional Muay Thai shorts with gold trim', 29.99, ARRAY['https://example.com/shorts_black_gold.jpg'], true),
  ('prod_03', 'Hand Wraps - 180"', 'Professional grade hand wraps for protection and support', 12.99, ARRAY['https://example.com/hand_wraps.jpg'], true),
  ('prod_04', 'Muay Thai T-Shirt - Thailand Edition', 'Cotton t-shirt with Thailand Muay Thai design', 24.99, ARRAY['https://example.com/tshirt_thailand.jpg'], true)
ON CONFLICT (id) DO NOTHING;
