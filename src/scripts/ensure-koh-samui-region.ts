import { createId } from "@paralleldrive/cuid2";
import { db } from "~/server/db";
import { regions } from "~/server/db/schema";
import { eq } from "drizzle-orm";

async function ensureKohSamuiRegion() {
  console.log("Ensuring Koh Samui region exists with correct slug...");

  try {
    // Check if Koh Samui region already exists with the correct slug
    const existingKohSamui = await db.query.regions.findFirst({
      where: eq(regions.slug, "koh-samui"),
    });

    if (existingKohSamui) {
      console.log("✅ Koh Samui region already exists with correct slug:", existingKohSamui.name);
      return existingKohSamui;
    }

    // Check if there's an existing "Samui" region that we can update
    const existingSamui = await db.query.regions.findFirst({
      where: eq(regions.name, "Samui"),
    });

    if (existingSamui) {
      console.log("📝 Found existing 'Samui' region, updating to 'Koh Samui' with correct slug...");
      
      const updatedRegion = await db
        .update(regions)
        .set({
          name: "Koh Samui",
          slug: "koh-samui",
          description: "Beautiful island paradise in the Gulf of Thailand, famous for its stunning beaches and Muay Thai training camps",
          updatedAt: new Date(),
        })
        .where(eq(regions.id, existingSamui.id))
        .returning();

      console.log("✅ Successfully updated region to Koh Samui");
      return updatedRegion[0];
    }

    // Create new Koh Samui region if none exists
    console.log("🆕 Creating new Koh Samui region...");
    
    const newRegion = await db
      .insert(regions)
      .values({
        id: createId(),
        name: "Koh Samui",
        slug: "koh-samui",
        description: "Beautiful island paradise in the Gulf of Thailand, famous for its stunning beaches and Muay Thai training camps",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log("✅ Successfully created Koh Samui region");
    return newRegion[0];

  } catch (error) {
    console.error("❌ Error ensuring Koh Samui region:", error);
    throw error;
  }
}

// Run the script
ensureKohSamuiRegion()
  .then(() => {
    console.log("🎉 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });

export { ensureKohSamuiRegion }; 