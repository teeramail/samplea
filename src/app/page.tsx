import Link from "next/link";

import Image from "next/image";
import { format } from "date-fns";
import { MapPinIcon, BuildingLibraryIcon } from "@heroicons/react/24/outline";

// Import the server-side tRPC caller and direct DB access
import { api } from "~/trpc/server";
import { db } from "~/server/db";
import { desc, eq, and, sql, gte, asc } from "drizzle-orm";
import { venues, events, fighters, trainingCourses, posts, products, regions } from "~/server/db/schema";
// Import the type helper from the correct location
import type { RouterOutputs } from "~/trpc/react";
// Import Next.js config
import { logCacheConfig } from "./config";
import { convertToChristianEra, parseAndConvertDate } from "~/lib/dateUtils";
import { formatDateInThaiTimezone } from "~/lib/timezoneUtils";
import { unstable_cache } from 'next/cache';

// Helper function to get homepage data with error handling
const getHomepageData = async () => {
  try {
    return await Promise.all([
      // Upcoming events - direct DB query
      db.query.events.findMany({
        limit: 3,
        orderBy: [asc(events.date)],
        where: and(
          eq(events.status, 'SCHEDULED'),
          // Only future events - using SQL expression for date comparison
          // Using a raw SQL condition for date comparison
          sql`${events.date} > NOW()`
        ),
        with: {
          venue: true,
          region: true,
        },
      }),
      
      // Featured fighters - direct DB query
      db.query.fighters.findMany({
        limit: 3,
        where: eq(fighters.isFeatured, true),
        orderBy: [desc(fighters.updatedAt)],
      }),
      
      // Featured courses - direct DB query
      db.query.trainingCourses.findMany({
        limit: 2,
        where: eq(trainingCourses.isFeatured, true),
        orderBy: [desc(trainingCourses.updatedAt)],
        with: {
          venue: true,
          instructor: true,
        },
      }),
      
      // Featured posts - direct DB query
      db.query.posts.findMany({
        limit: 2,
        where: and(
          eq(posts.isFeatured, true),
          eq(posts.status, 'PUBLISHED')
        ),
        orderBy: [desc(posts.publishedAt)],
        with: {
          author: true,
          region: true,
        },
      }),
      
      // Recommended venues - direct DB query
      db.query.venues.findMany({
        limit: 12, // Limit to 12 venues for the homepage
        orderBy: [desc(venues.isFeatured), desc(venues.createdAt)], // Featured first, then newest
        with: {
          region: true,
          venueTypes: {
            with: {
              venueType: true,
            },
          },
        },
      }),
    ]);
  } catch (error) {
    console.error('Database connection error:', error);
    // Return empty arrays if database is not available
    return [[], [], [], [], []];
  }
};

// Helper function (consider moving to a utils file)
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "";
  // Use Thailand timezone formatting for consistency
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDateInThaiTimezone(dateObj);
};



// Define types for the fetched data
type EventType = RouterOutputs["event"]["getUpcoming"][number];
type FighterType = RouterOutputs["fighter"]["getFeatured"][number];
type CourseType = RouterOutputs["trainingCourse"]["getFeatured"][number];
type VenueType = RouterOutputs["venue"]["getFeatured"][number];
type PostType = RouterOutputs["post"]["getFeatured"][number];

// Define types for venue with types
interface VenueWithTypes extends VenueType {
  venueTypes: Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  primaryType?: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface VenuesByTypeResponse {
  venues: VenueWithTypes[];
  groupedVenues: Record<string, VenueWithTypes[]>;
}

// Force dynamic rendering to avoid build-time database connection issues
export const dynamic = 'force-dynamic';

// Next.js configuration is now in a separate file: src/app/config.ts
// This ensures proper handling of dynamic configuration

export default async function Home() {
  // Log cache configuration on server
  logCacheConfig();

  // Fetch all data using cached function for better performance
  const [upcomingEventsData, featuredFightersData, featuredCoursesData, featuredPostsData, recommendedVenues] = await getHomepageData();

  // Process venues to include their types
  const venuesWithTypes = recommendedVenues.map((venue) => ({
    ...venue,
    venueTypeNames: venue.venueTypes.map((vt) => vt.venueType.name),
  }));

  // Map the data to match the expected types from TRPC
  const upcomingEvents = upcomingEventsData;
  const featuredFighters = featuredFightersData;
  const featuredCourses = featuredCoursesData;
  const featuredPosts = featuredPostsData;
  
  // Check if we have venues to display
  const hasVenues = venuesWithTypes.length > 0;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      {/* Hero Section */}
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <h1 className="text-center text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          <span className="text-[hsl(280,100%,70%)]">Thai</span>Boxing
          <span className="text-[hsl(280,100%,70%)]">Hub</span>
        </h1>
        <p className="mb-4 max-w-2xl text-center text-xl">
          Your ultimate destination for authentic Muay Thai in Thailand. Find
          fights, book training sessions, learn techniques, and follow top
          fighters.
        </p>



        {/* Upcoming Events Section */}
        <section className="mt-8 w-full max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Upcoming Events</h2>
            <Link
              href="/events"
              className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
            >
              View All &rarr;
            </Link>
          </div>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {upcomingEvents.map((event: EventType) => (
                // --- USING SIMPLE DISPLAY HERE - REPLACE WITH <EventCard /> IF AVAILABLE ---
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group block overflow-hidden rounded-lg bg-white/10 shadow-lg transition-colors hover:bg-white/20"
                  prefetch={true}
                >
                  <div className="relative h-48 w-full bg-white/5">
                    {event.thumbnailUrl ? (
                      <Image
                        src={event.thumbnailUrl}
                        alt={`${event.title} thumbnail`}
                        fill
                        className="object-cover"
                        priority={true}
                        sizes="(max-width: 768px) 100vw, 33vw"
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
                        <BuildingLibraryIcon className="mr-1 h-4 w-4 shrink-0" />{" "}
                        {event.venue.name}
                      </div>
                    )}
                    {event.region && (
                      <div className="flex items-center text-sm text-gray-300">
                        <MapPinIcon className="mr-1 h-4 w-4 shrink-0" />{" "}
                        {event.region.name}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white/10 p-8 text-center">
              <p className="text-gray-300">No upcoming events found.</p>
            </div>
          )}
        </section>

        {/* Featured Fighters Section - DYNAMIC */}
        <section className="mt-16 w-full max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Featured Fighters</h2>
            <Link
              href="/fighters"
              className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
            >
              View All &rarr;
            </Link>
          </div>
          {featuredFighters && featuredFighters.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredFighters.map((fighter: FighterType) => (
                // --- REPLACE WITH <FighterCard /> IF AVAILABLE ---
                <div
                  key={fighter.id}
                  className="overflow-hidden rounded-lg bg-white/10 transition-colors hover:bg-white/20"
                >
                  {fighter.imageUrl && (
                    <div className="relative h-48 bg-white/5">
                      <Image
                        src={fighter.imageUrl}
                        alt={fighter.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="mb-2 text-xl font-bold">{fighter.name}</h3>
                    <div className="flex flex-col space-y-1 text-sm text-gray-300">
                      {fighter.record && <p>Record: {fighter.record}</p>}
                      {fighter.weightClass && (
                        <p>Class: {fighter.weightClass}</p>
                      )}
                      {/* Add Gym/Venue if available in query */}
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/fighters/${fighter.id}`}
                        className="inline-flex items-center text-sm font-medium text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
                      >
                        View Profile &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white/10 p-8 text-center">
              <p className="text-gray-300">
                No featured fighters available right now.
              </p>
            </div>
          )}
        </section>

        {/* Featured Training Courses Section - DYNAMIC */}
        <section className="mt-16 w-full max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Featured Training Courses</h2>
            <Link
              href="/training"
              className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
            >
              View All &rarr;
            </Link>
          </div>
          {featuredCourses && featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {featuredCourses.map((course) => (
                // --- REPLACE WITH <CourseCard /> IF AVAILABLE ---
                <Link
                  key={course.id}
                  href={`/training/${course.slug}`}
                  className="block rounded-lg bg-white/10 p-6 transition-colors hover:bg-white/20"
                >
                  <h3 className="mb-2 text-xl font-bold text-[hsl(280,100%,70%)]">
                    {course.title}
                  </h3>
                  <p className="mb-3 line-clamp-3 text-gray-300">
                    {course.description}
                  </p>
                  <div className="text-sm text-gray-400">
                    {course.venue && <p>Venue: {course.venue.name}</p>}
                    {course.instructor && (
                      <p>Instructor: {course.instructor.name}</p>
                    )}
                    {course.duration && <p>Duration: {course.duration}</p>}
                    <p>Price: ${course.price.toFixed(2)}</p>
                  </div>
                  <div className="mt-4 font-medium text-[hsl(280,100%,70%)]">
                    Learn More &rarr;
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white/10 p-8 text-center">
              <p className="text-gray-300">
                No featured training courses available right now.
              </p>
            </div>
          )}
        </section>

        {/* Recommended Gyms Section - Simple List */}
        <section className="mt-16 w-full max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Recommended Gyms</h2>
            <Link
              href="/venues"
              className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
            >
              View All &rarr;
            </Link>
          </div>
          {hasVenues ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {venuesWithTypes.map((venue) => (
                <Link
                  key={venue.id}
                  href={`/venues/${venue.id}`}
                  className={`block ${venue.isFeatured ? "bg-white/20 ring-2 ring-[hsl(280,100%,70%)]" : "bg-white/10"} overflow-hidden rounded-lg transition-colors hover:bg-white/20`}
                >
                  {venue.thumbnailUrl ? (
                    <div className="relative h-36 overflow-hidden bg-white/5">
                      <Image
                        src={venue.thumbnailUrl}
                        alt={venue.name}
                        fill
                        className="object-cover"
                      />
                      {venue.isFeatured && (
                        <div className="absolute right-0 top-0 m-2 rounded-md bg-[hsl(280,100%,70%)] px-2 py-1 text-xs text-white">
                          Featured
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative flex h-36 items-center justify-center overflow-hidden bg-white/5">
                      <BuildingLibraryIcon className="h-16 w-16 text-white/30" />
                      {venue.isFeatured && (
                        <div className="absolute right-0 top-0 m-2 rounded-md bg-[hsl(280,100%,70%)] px-2 py-1 text-xs text-white">
                          Featured
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="mb-1 truncate text-lg font-bold">
                      {venue.name}
                    </h4>
                    {venue.region && (
                      <div className="flex items-center truncate text-sm text-gray-400">
                        <MapPinIcon className="mr-1 h-4 w-4" />
                        <span>{venue.region.name}</span>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {venue.venueTypeNames.slice(0, 2).map((typeName, idx) => (
                        <span
                          key={idx}
                          className="inline-block rounded-full bg-[hsl(280,70%,30%)] px-2 py-1 text-xs text-white"
                        >
                          {typeName}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white/10 p-8 text-center">
              <p className="text-gray-300">
                No recommended gyms available right now.
              </p>
            </div>
          )}
        </section>

        {/* Featured Merchandise Section - STATIC MOCK DATA */}
        <section className="mt-16 w-full max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Featured Merchandise</h2>
            <Link href="/products" className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]">
              View All Products &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {/* Mock Product 1 */}
            <div className="block rounded-lg bg-white/10 p-5 transition-colors hover:bg-white/20">
              <div className="mb-3 h-48 w-full rounded-md bg-gray-700"></div>
              <h3 className="text-xl font-bold">Muay Thai Gloves - Red</h3>
              <p className="mt-1 text-lg">$49.99</p>
            </div>
            {/* Mock Product 2 */}
            <div className="block rounded-lg bg-white/10 p-5 transition-colors hover:bg-white/20">
              <div className="mb-3 h-48 w-full rounded-md bg-gray-700"></div>
              <h3 className="text-xl font-bold">Muay Thai Shorts - Black/Gold</h3>
              <p className="mt-1 text-lg">$29.99</p>
            </div>
            {/* Mock Product 3 */}
            <div className="block rounded-lg bg-white/10 p-5 transition-colors hover:bg-white/20">
              <div className="mb-3 h-48 w-full rounded-md bg-gray-700"></div>
              <h3 className="text-xl font-bold">Hand Wraps - 180"</h3>
              <p className="mt-1 text-lg">$12.99</p>
            </div>
            {/* Mock Product 4 */}
            <div className="block rounded-lg bg-white/10 p-5 transition-colors hover:bg-white/20">
              <div className="mb-3 h-48 w-full rounded-md bg-gray-700"></div>
              <h3 className="text-xl font-bold">Muay Thai T-Shirt</h3>
              <p className="mt-1 text-lg">$24.99</p>
            </div>
          </div>
        </section>

        {/* Latest Muay Thai News Section - DYNAMIC */}
        <section className="mt-16 w-full max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Latest Muay Thai News</h2>
            <Link
              href="/blog"
              className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
            >
              Read All &rarr;
            </Link>
          </div>
          {featuredPosts && featuredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {featuredPosts.map((post: PostType) => (
                // --- REPLACE WITH <BlogPostCard /> IF AVAILABLE ---
                <Link
                  key={post.id}
                  href={post.slug.startsWith("http") ? post.slug : `/blog/${post.slug}`}
                  className="block rounded-lg bg-white/10 p-5 transition-colors hover:bg-white/20"
                >
                  <span className="text-xs text-gray-300">
                    {formatDate(post.publishedAt ?? post.createdAt)}
                  </span>
                  <h3 className="my-2 line-clamp-2 text-xl font-bold">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="line-clamp-3 text-sm text-gray-300">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-4 inline-flex items-center text-sm font-medium text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]">
                    Read More &rarr;
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white/10 p-8 text-center">
              <p className="text-gray-300">
                No news articles available right now.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
