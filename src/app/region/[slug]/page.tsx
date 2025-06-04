import Link from "next/link";
import { db } from "~/server/db";
import { events, regions } from "~/server/db/schema";
import { desc, asc, eq, gte, and } from "drizzle-orm";
import Image from "next/image";
import { MapPinIcon, BuildingLibraryIcon } from "@heroicons/react/24/outline";
import { notFound } from "next/navigation";
import { format, startOfDay, parseISO, isAfter } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { unstable_cache } from 'next/cache';
import { convertToChristianEra, parseAndConvertDate } from "~/lib/dateUtils";

// Define types for the event data
type UpcomingEvent = {
  id: string;
  title: string;
  date: Date;
  thumbnailUrl: string | null;
  venue: { name: string } | null;
  region: { name: string } | null;
};

type RegionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Calculate time until next revalidation (10 PM Thai time daily)
function getRevalidateSeconds(): number {
  const thaiTimeZone = "Asia/Bangkok";
  const now = new Date();
  const thaiNow = toZonedTime(now, thaiTimeZone);
  
  // Set revalidation time to 10 PM Thai time
  const revalidationTime = new Date(thaiNow);
  revalidationTime.setHours(22, 0, 0, 0); // 10 PM
  
  // If it's already past 10 PM, set for tomorrow
  if (thaiNow > revalidationTime) {
    revalidationTime.setDate(revalidationTime.getDate() + 1);
  }
  
  // Calculate seconds until revalidation time
  return Math.floor((revalidationTime.getTime() - thaiNow.getTime()) / 1000);
}

// Function to get events for a specific region - only today and upcoming events in Thai time
async function getRegionEvents(regionId: string) {
  try {
    // Get current date time
    const now = new Date();
    
    // For debugging
    console.log(`Current JS Date: ${now.toISOString()}`);
    
    // Create a date object at midnight today in UTC
    // This ensures we only filter by the date portion, not time
    const todayAtMidnightUTC = new Date(now);
    todayAtMidnightUTC.setUTCHours(0, 0, 0, 0);
    
    console.log(`Today at midnight UTC for DB query: ${todayAtMidnightUTC.toISOString()}`);
    
    const regionEvents = await db.query.events.findMany({
      columns: {
        id: true,
        title: true,
        date: true,
        thumbnailUrl: true,
      },
      with: {
        venue: { columns: { name: true } },
        region: { columns: { name: true } },
      },
      where: and(
        eq(events.regionId, regionId),
        gte(events.date, todayAtMidnightUTC), // Filter by today and future dates
        eq(events.status, 'SCHEDULED') // Only show scheduled events
      ),
      orderBy: [asc(events.date)], // Sort by nearest upcoming events first
      limit: 8, // Limit to 8 events
    });
    
    console.log(`Found ${regionEvents.length} upcoming events in region`);
    
    // Extra validation layer - filter out any past events that might have slipped through
    // and ensure they're sorted by date ascending (nearest first)
    const validEvents = regionEvents
      .filter(event => {
        // Handle potential Buddhist Era dates
        const eventDate = new Date(event.date);
        const convertedDate = convertToChristianEra(eventDate);
        return convertedDate >= now;
      })
      .sort((a, b) => {
        const dateA = convertToChristianEra(new Date(a.date)).getTime();
        const dateB = convertToChristianEra(new Date(b.date)).getTime();
        return dateA - dateB;
      });
    
    console.log(`After filtering: ${validEvents.length} valid upcoming events`);
    
    return validEvents;
  } catch (error) {
    console.error("Error fetching region events:", error);
    return [];
  }
}

// Create a cached data fetcher for region pages that revalidates at 10 PM Thai time daily
const getRegionPageData = unstable_cache(
  async (slug: string) => {
    // Find the region by slug
    const region = await db.query.regions.findFirst({
      where: eq(regions.slug, slug),
    });

    // If region not found, return null
    if (!region) {
      return null;
    }

    // Get events for this region
    const regionEvents = await getRegionEvents(region.id);

    return {
      region,
      regionEvents,
    };
  },
  ['region-page-data'],
  {
    revalidate: getRevalidateSeconds(),
    tags: ['region-page'],
  }
);

// Set page-level revalidation
export const revalidate = 3600; // Revalidate every hour (3600 seconds)

// Generate static params for all regions
export async function generateStaticParams() {
  const allRegions = await db.query.regions.findMany();
  return allRegions.map((region) => ({
    slug: region.slug,
  }));
}

export default async function RegionPage({ params }: RegionPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // Get cached data for this region
  const data = await getRegionPageData(slug);
  
  // If region not found, return 404
  if (!data || !data.region) {
    notFound();
  }
  
  const { region, regionEvents } = data;

  // Format date function with Thai time zone
  const formatDate = (date: string | Date) => {
    // Convert string inputs to Date and handle Buddhist Era
    const dateObj = typeof date === 'string' ? parseAndConvertDate(date) : convertToChristianEra(date);
    const thaiTimeZone = "Asia/Bangkok";
    const thaiDate = toZonedTime(dateObj, thaiTimeZone);

    return format(thaiDate, "MMMM d, yyyy");
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <div className="max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight">
            Muay Thai in{" "}
            <span className="text-[hsl(280,100%,70%)]">{region.name}</span>
          </h1>

          {region.description && (
            <p className="mb-4 text-center text-xl">{region.description}</p>
          )}
        </div>

        {/* Region Events Section */}
        <section className="mt-8 w-full max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Upcoming Events in {region.name}</h2>
            <Link
              href={`/events?region=${region.slug}`}
              className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
            >
              View All Events &rarr;
            </Link>
          </div>

          {regionEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {regionEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group block overflow-hidden rounded-lg bg-white/10 shadow-lg transition-colors hover:bg-white/20"
                >
                  <div className="relative h-48 w-full bg-white/5">
                    {event.thumbnailUrl ? (
                      <Image
                        src={event.thumbnailUrl}
                        alt={`${event.title} thumbnail`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/10 text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-16 w-16"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-2 text-sm text-[hsl(280,100%,70%)]">
                      {formatDate(event.date)}
                    </div>
                    <h3 className="mb-3 text-xl font-bold transition-colors group-hover:text-[hsl(280,100%,70%)]">
                      {event.title}
                    </h3>
                    {event.venue && (
                      <div className="mb-1 flex items-center text-sm text-gray-300">
                        <BuildingLibraryIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                        {event.venue.name}
                      </div>
                    )}
                    {event.region && (
                      <div className="flex items-center text-sm text-gray-300">
                        <MapPinIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                        {event.region.name}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white/10 p-8 text-center">
              <h3 className="mb-2 text-xl font-medium">
                No events found in {region.name}
              </h3>
              <p className="mb-4 text-gray-300">
                There are no scheduled events in this region at the moment.
              </p>
              <Link
                href="/events"
                className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
              >
                Browse all events
              </Link>
            </div>
          )}
        </section>

        {/* About Region Section */}
        <section className="mt-16 w-full max-w-5xl rounded-lg bg-white/5 p-8">
          <h2 className="mb-4 text-2xl font-bold">
            About Muay Thai in {region.name}
          </h2>
          <div className="text-gray-300">
            <p className="mb-4">
              {region.name} offers unique opportunities to experience authentic
              Muay Thai in Thailand. Whether you're looking to attend exciting
              events, train at a local gym, or learn about the cultural
              significance of Muay Thai in this region, we'll help you find the
              perfect Muay Thai experience.
            </p>
            <p>
              Browse all the upcoming events in {region.name} above, or explore
              our offerings for training packages and experiences in this
              beautiful part of Thailand.
            </p>
          </div>
        </section>

        {/* Call to Action */}
        <div className="mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="/training"
          >
            <h3 className="text-2xl font-bold">
              Train in {region.name} &rarr;
            </h3>
            <div className="text-lg">
              Discover Muay Thai training camps and gyms in {region.name}.
            </div>
          </Link>

          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="/venues"
          >
            <h3 className="text-2xl font-bold">
              Venues in {region.name} &rarr;
            </h3>
            <div className="text-lg">
              Explore Muay Thai stadiums and venues across {region.name}.
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
