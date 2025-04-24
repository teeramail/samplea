import { sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { categories } from "../server/db/schema";

export async function up(db: any): Promise<void> {
  // Initial product categories for a Muay Thai store
  const initialCategories = [
    {
      id: createId(),
      name: "Gloves",
      slug: "gloves",
      description: "Boxing and Muay Thai gloves for training and competition",
    },
    {
      id: createId(),
      name: "Hand Wraps",
      slug: "hand-wraps",
      description: "Hand wraps for protection and support",
    },
    {
      id: createId(),
      name: "Shorts",
      slug: "shorts",
      description: "Traditional Muay Thai shorts and boxing trunks",
    },
    {
      id: createId(),
      name: "Shirts & Apparel",
      slug: "shirts-apparel",
      description: "T-shirts, tank tops, and other apparel",
    },
    {
      id: createId(),
      name: "Shin Guards",
      slug: "shin-guards",
      description: "Shin guards for protection during training",
    },
    {
      id: createId(),
      name: "Headgear",
      slug: "headgear",
      description: "Headgear for sparring and competition",
    },
    {
      id: createId(),
      name: "Pads & Shields",
      slug: "pads-shields",
      description: "Thai pads, kick shields, and focus mitts",
    },
    {
      id: createId(),
      name: "Bags",
      slug: "bags",
      description: "Heavy bags, banana bags, and equipment bags",
    },
    {
      id: createId(),
      name: "Accessories",
      slug: "accessories",
      description: "Mouthguards, groin guards, and other accessories",
    },
  ];

  // Insert categories
  for (const category of initialCategories) {
    await db.insert(categories).values({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

export async function down(db: any): Promise<void> {
  // Remove all categories
  await db.delete(categories);
}
