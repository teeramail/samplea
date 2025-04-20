import { NextRequest, NextResponse } from "next/server";
import { generateUpcomingEvents } from "~/cron/generate-events";

// Secret key to protect the endpoint (should match the key in your cron job service)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify the request is authorized via secret key
    const authHeader = request.headers.get("authorization");
    
    if (!CRON_SECRET) {
      console.error("CRON_SECRET environment variable is not defined");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }
    
    // Validate secret key
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      console.warn("Unauthorized cron job attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get days parameter (default to 30 days)
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 30;
    
    // Generate events for the next X days
    const result = await generateUpcomingEvents(days);
    
    return NextResponse.json({
      success: true,
      message: `Successfully generated ${result.generatedCount} events from ${result.templates} templates`,
      ...result
    });
  } catch (error) {
    console.error("Error in events generation cron job:", error);
    return NextResponse.json(
      { error: "Failed to generate events" },
      { status: 500 }
    );
  }
} 