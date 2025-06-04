import { db } from "~/server/db";
import { products } from "~/server/db/schema";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const sampleProducts = [
  {
    id: "prod_gloves_red",
    name: "Muay Thai Gloves - Red",
    description: "Premium leather Muay Thai gloves for training and competition. Made with high-quality materials for durability and comfort.",
    price: 49.99,
    thumbnailUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
    imageUrls: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center"],
    isFeatured: true,
    stock: 25,
  },
  {
    id: "prod_shorts_black_gold",
    name: "Muay Thai Shorts - Black/Gold",
    description: "Traditional Muay Thai shorts with gold trim. Lightweight and comfortable for training and competition.",
    price: 29.99,
    thumbnailUrl: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop&crop=center",
    imageUrls: ["https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=600&fit=crop&crop=center"],
    isFeatured: true,
    stock: 30,
  },
  {
    id: "prod_hand_wraps",
    name: "Hand Wraps - 180\"",
    description: "Professional grade hand wraps for protection and support. Essential for all Muay Thai training sessions.",
    price: 12.99,
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
    imageUrls: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center"],
    isFeatured: true,
    stock: 50,
  },
  {
    id: "prod_tshirt_thailand",
    name: "Muay Thai T-Shirt",
    description: "Cotton t-shirt with authentic Thailand Muay Thai design. Comfortable and stylish for everyday wear.",
    price: 24.99,
    thumbnailUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center",
    imageUrls: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=600&fit=crop&crop=center"],
    isFeatured: true,
    stock: 40,
  },
  {
    id: "prod_shin_guards",
    name: "Shin Guards - Professional",
    description: "Heavy-duty shin guards for sparring and training. Provides excellent protection and comfort.",
    price: 79.99,
    thumbnailUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
    imageUrls: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center"],
    isFeatured: false,
    stock: 15,
  },
  {
    id: "prod_headgear",
    name: "Training Headgear",
    description: "Protective headgear for sparring sessions. Lightweight with excellent visibility.",
    price: 59.99,
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
    imageUrls: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center"],
    isFeatured: false,
    stock: 20,
  },
];

async function seedProducts() {
  console.log("🌱 Seeding products...");
  
  try {
    // Insert products
    await db.insert(products).values(sampleProducts).onConflictDoNothing();
    
    console.log("✅ Products seeded successfully!");
    console.log(`📦 Added ${sampleProducts.length} products`);
    
    // Log the products that were added
    sampleProducts.forEach((product) => {
      console.log(`  - ${product.name} ($${product.price})`);
    });
    
  } catch (error) {
    console.error("❌ Error seeding products:", error);
  }
}

// Check if this script is being run directly (ES module way)
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  seedProducts()
    .then(() => {
      console.log("🎉 Seeding complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export { seedProducts }; 