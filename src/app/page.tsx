import Link from "next/link";

import Image from "next/image";
import { format } from 'date-fns';
import { MapPinIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';

// Import the server-side tRPC caller and direct DB access
import { api } from "~/trpc/server";
import { db } from "~/server/db";
import { desc, eq } from "drizzle-orm";
import { venues } from "~/server/db/schema";
// Import the type helper from the correct location
import type { RouterOutputs } from "~/trpc/react";

// Helper function (consider moving to a utils file)
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return '';
  return format(new Date(date), "MMM dd, yyyy");
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

export default async function Home() {
  // Fetch all data in parallel
  const [upcomingEvents, featuredFighters, featuredCourses, featuredPosts] = await Promise.all([
    api.event.getUpcoming({ limit: 3 }), // Assuming this router/procedure exists now
    api.fighter.getFeatured({ limit: 3 }),
    api.trainingCourse.getFeatured({ limit: 2 }),
    api.post.getFeatured({ limit: 2 }),
  ]);
  
  // Fetch venues directly from the database - similar to the venues page
  // This ensures consistency between the homepage and venues page
  const recommendedVenues = await db.query.venues.findMany({
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
  });
  
  // Process venues to include their types
  const venuesWithTypes = recommendedVenues.map(venue => ({
    ...venue,
    venueTypeNames: venue.venueTypes.map(vt => vt.venueType.name),
  }));
  
  // Check if we have venues to display
  const hasVenues = venuesWithTypes.length > 0;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      {/* Hero Section */}
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-center sm:text-[5rem]">
          <span className="text-[hsl(280,100%,70%)]">Thai</span>Boxing
          <span className="text-[hsl(280,100%,70%)]">Hub</span>
        </h1>
        <p className="text-xl text-center max-w-2xl mb-4">
          Your ultimate destination for authentic Muay Thai in Thailand. Find fights, book training sessions, learn techniques, and follow top fighters.
        </p>

        {/* Upcoming Events Section */}
        <section className="w-full max-w-5xl mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Upcoming Events</h2>
            <Link href="/events" className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]">View All &rarr;</Link>
          </div>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {upcomingEvents.map((event: EventType) => (
                 // --- USING SIMPLE DISPLAY HERE - REPLACE WITH <EventCard /> IF AVAILABLE ---
                <Link key={event.id} href={`/events/${event.id}`} className="block bg-white/10 rounded-lg overflow-hidden hover:bg-white/20 transition-colors shadow-lg group">
                  <div className="relative w-full h-48 bg-white/5">
                    {event.thumbnailUrl ? (
                      <Image src={event.thumbnailUrl} alt={`${event.title} thumbnail`} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/10 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-sm text-[hsl(280,100%,70%)] mb-2">{formatDate(event.date)}</div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-[hsl(280,100%,70%)] transition-colors">{event.title}</h3>
                    {event.venue && <div className="flex items-center text-gray-300 text-sm mb-1"><BuildingLibraryIcon className="w-4 h-4 mr-1 shrink-0" /> {event.venue.name}</div>}
                    {event.region && <div className="flex items-center text-gray-300 text-sm"><MapPinIcon className="w-4 h-4 mr-1 shrink-0" /> {event.region.name}</div>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-8 text-center">
              <p className="text-gray-300">No upcoming events found.</p>
            </div>
          )}
        </section>

        {/* Featured Fighters Section - DYNAMIC */}
        <section className="w-full max-w-5xl mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Featured Fighters</h2>
            <Link href="/fighters" className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]">View All &rarr;</Link>
          </div>
          {featuredFighters && featuredFighters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredFighters.map((fighter: FighterType) => (
                 // --- REPLACE WITH <FighterCard /> IF AVAILABLE ---
                 <div key={fighter.id} className="bg-white/10 rounded-lg overflow-hidden hover:bg-white/20 transition-colors">
                   {fighter.imageUrl && (
                     <div className="relative h-48 bg-white/5">
                       <Image src={fighter.imageUrl} alt={fighter.name} fill className="object-cover" />
                     </div>
                   )}
                   <div className="p-5">
                     <h3 className="text-xl font-bold mb-2">{fighter.name}</h3>
                     <div className="flex flex-col space-y-1 text-gray-300 text-sm">
                        {fighter.record && <p>Record: {fighter.record}</p>}
                        {fighter.weightClass && <p>Class: {fighter.weightClass}</p>}
                        {/* Add Gym/Venue if available in query */} 
                     </div>
                     <div className="mt-4">
                       <Link href={`/fighters/${fighter.id}`} className="inline-flex items-center text-sm font-medium text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]">
                         View Profile &rarr;
                       </Link>
                     </div>
                   </div>
                 </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-8 text-center">
              <p className="text-gray-300">No featured fighters available right now.</p>
            </div>
          )}
        </section>

        {/* Featured Training Courses Section - DYNAMIC */}
        <section className="w-full max-w-5xl mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Featured Training Courses</h2>
            <Link href="/training" className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]">View All &rarr;</Link>
          </div>
          {featuredCourses && featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredCourses.map((course: CourseType) => (
                // --- REPLACE WITH <CourseCard /> IF AVAILABLE ---
                <Link key={course.id} href={`/training/${course.slug}`} className="block bg-white/10 rounded-lg p-6 hover:bg-white/20 transition-colors">
                  <h3 className="text-xl font-bold mb-2 text-[hsl(280,100%,70%)]">{course.title}</h3>
                  <p className="text-gray-300 mb-3 line-clamp-3">{course.description}</p>
                  <div className="text-sm text-gray-400">
                    {course.venue && <p>Venue: {course.venue.name}</p>}
                    {course.instructor && <p>Instructor: {course.instructor.name}</p>}
                    {course.duration && <p>Duration: {course.duration}</p>}
                    <p>Price: ${course.price.toFixed(2)}</p>
                  </div>
                  <div className="mt-4 text-[hsl(280,100%,70%)] font-medium">Learn More &rarr;</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-8 text-center">
              <p className="text-gray-300">No featured training courses available right now.</p>
            </div>
          )}
        </section>

        {/* Recommended Gyms Section - Simple List */}
        <section className="w-full max-w-5xl mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Recommended Gyms</h2>
            <Link href="/venues" className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]">View All &rarr;</Link>
          </div>
          {hasVenues ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {venuesWithTypes.map((venue) => (
                <Link key={venue.id} href={`/venues/${venue.id}`} 
                      className={`block ${venue.isFeatured ? 'bg-white/20 ring-2 ring-[hsl(280,100%,70%)]' : 'bg-white/10'} rounded-lg overflow-hidden hover:bg-white/20 transition-colors`}>
                  {venue.thumbnailUrl ? (
                    <div className="relative h-36 overflow-hidden bg-white/5">
                      <Image src={venue.thumbnailUrl} alt={venue.name} fill className="object-cover" />
                      {venue.isFeatured && (
                        <div className="absolute top-0 right-0 bg-[hsl(280,100%,70%)] text-white text-xs px-2 py-1 m-2 rounded-md">
                          Featured
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-36 overflow-hidden bg-white/5 flex items-center justify-center">
                      <BuildingLibraryIcon className="h-16 w-16 text-white/30" />
                      {venue.isFeatured && (
                        <div className="absolute top-0 right-0 bg-[hsl(280,100%,70%)] text-white text-xs px-2 py-1 m-2 rounded-md">
                          Featured
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="text-lg font-bold mb-1 truncate">{venue.name}</h4>
                    {venue.region && (
                      <div className="flex items-center text-sm text-gray-400 truncate">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span>{venue.region.name}</span>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {venue.venueTypeNames.slice(0, 2).map((typeName, idx) => (
                        <span key={idx} className="inline-block px-2 py-1 text-xs rounded-full bg-[hsl(280,70%,30%)] text-white">
                          {typeName}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-8 text-center">
              <p className="text-gray-300">No recommended gyms available right now.</p>
            </div>
          )}
        </section>

        {/* Latest Muay Thai News Section - DYNAMIC */}
        <section className="w-full max-w-5xl mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Latest Muay Thai News</h2>
            <Link href="/blog" className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]">Read All &rarr;</Link>
          </div>
          {featuredPosts && featuredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {featuredPosts.map((post: PostType) => (
                 // --- REPLACE WITH <BlogPostCard /> IF AVAILABLE ---
                 <Link key={post.id} href={`/blog/${post.slug}`} className="block bg-white/10 rounded-lg p-5 hover:bg-white/20 transition-colors">
                   <span className="text-xs text-gray-300">{formatDate(post.publishedAt ?? post.createdAt)}</span>
                   <h3 className="text-xl font-bold my-2 line-clamp-2">{post.title}</h3>
                   {post.excerpt && <p className="text-gray-300 text-sm line-clamp-3">{post.excerpt}</p>}
                   <div className="inline-flex items-center mt-4 text-sm font-medium text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]">
                     Read More &rarr;
                   </div>
                 </Link>
               ))}
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-8 text-center">
              <p className="text-gray-300">No news articles available right now.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
