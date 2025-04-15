import { NextResponse } from "next/server";
import { db } from "../../../server/db";
import { venueTypes } from "../../../server/db/schema";

export async function GET() {
  try {
    // Fetch all venue types from the database
    const types = await db.select().from(venueTypes).orderBy(venueTypes.name);
    
    // If no venue types exist yet, seed the database with default types
    if (types.length === 0) {
      const defaultTypes = [
        { id: 'stadium', name: 'Stadium', description: 'Venue primarily used for hosting Muay Thai fights and events' },
        { id: 'gym', name: 'Gym', description: 'Training facility with equipment for general fitness and Muay Thai practice' },
        { id: 'muay_thai', name: 'Muay Thai', description: 'Specialized in Muay Thai training' },
        { id: 'kickboxing', name: 'Kickboxing', description: 'Specialized in kickboxing training' },
        { id: 'taekwondo', name: 'Taekwondo', description: 'Specialized in Taekwondo training' },
        { id: 'mma', name: 'MMA', description: 'Mixed martial arts training facility' },
        { id: 'boxing', name: 'Boxing', description: 'Boxing training and events' },
      ];
      
      // Insert default types
      await db.insert(venueTypes).values(defaultTypes);
      
      // Return the default types
      return NextResponse.json(defaultTypes);
    }
    
    return NextResponse.json(types);
  } catch (error) {
    console.error("Error fetching venue types:", error);
    return NextResponse.json(
      { error: "Failed to fetch venue types" },
      { status: 500 }
    );
  }
}
