import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { 
  MapPinIcon, 
  BuildingLibraryIcon, 
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  GlobeAltIcon,
  TagIcon
} from "@heroicons/react/24/outline";
import { db } from "~/server/db";
import { eq, and, or, gt, lte, sql } from "drizzle-orm";
import { venues } from "~/server/db/schema";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch venue with all related data (excluding events for now)
  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, id),
    with: {
      region: true,
      venueTypes: {
        with: {
          venueType: true,
        },
      },
      trainingCourses: {
        where: (courses) => eq(courses.isActive, true),
        orderBy: (courses, { desc }) => [desc(courses.updatedAt)],
        limit: 4,
        with: {
          instructor: true,
        },
      },
    },
  });

  if (!venue) {
    return notFound();
  }

  // Fetch upcoming events in the same region as this venue
  const regionalEvents = await db.query.events.findMany({
    where: (events) => {
      const now = new Date();
      return and(
        eq(events.regionId, venue.regionId),
        gt(events.date, now)
      );
    },
    orderBy: (events, { asc }) => [asc(events.date)],
    limit: 6,
    with: {
      venue: true,
      region: true,
    },
  });

  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM dd, yyyy");
  };

  const formatTime = (time: Date) => {
    return format(new Date(time), "h:mm a");
  };

  const socialMediaLinks = venue.socialMediaLinks as Record<string, string> | null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      {/* Header Section */}
      <div className="relative">
        {venue.thumbnailUrl ? (
          <div className="relative h-80 w-full">
            <Image
              src={venue.thumbnailUrl}
              alt={venue.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#15162c] via-[#15162c]/50 to-transparent" />
          </div>
        ) : (
          <div className="flex h-80 w-full items-center justify-center bg-white/10">
            <BuildingLibraryIcon className="h-32 w-32 text-white/30" />
          </div>
        )}
        
        {/* Venue Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {venue.venueTypes.map((vt) => (
                <span
                  key={vt.venueType.id}
                  className="inline-flex items-center rounded-full bg-[hsl(280,70%,30%)] px-3 py-1 text-sm font-medium text-white"
                >
                  <TagIcon className="mr-1 h-4 w-4" />
                  {vt.venueType.name}
                </span>
              ))}
              {venue.isFeatured && (
                <span className="inline-flex items-center rounded-full bg-[hsl(280,100%,70%)] px-3 py-1 text-sm font-medium text-white">
                  ⭐ Featured
                </span>
              )}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              {venue.name}
            </h1>
            {venue.region && (
              <div className="mt-2 flex items-center text-xl text-gray-300">
                <MapPinIcon className="mr-2 h-5 w-5" />
                <span>{venue.region.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Venue Details */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Basic Information */}
            <section className="mb-8 rounded-lg bg-white/10 p-6">
              <h2 className="mb-4 text-2xl font-bold">Venue Information</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPinIcon className="mr-3 mt-1 h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">{venue.address}</span>
                </div>
                
                {venue.capacity && (
                  <div className="flex items-center">
                    <UserGroupIcon className="mr-3 h-5 w-5 text-gray-400" />
                    <span className="text-gray-300">Capacity: {venue.capacity} people</span>
                  </div>
                )}

                {venue.googleMapsUrl && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="mr-3 h-5 w-5 text-gray-400" />
                    <a
                      href={venue.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)] hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                )}
              </div>

              {venue.remarks && (
                <div className="mt-6">
                  <h3 className="mb-2 text-lg font-semibold">About</h3>
                  <p className="text-gray-300">{venue.remarks}</p>
                </div>
              )}
            </section>

            {/* Training Courses */}
            {venue.trainingCourses && venue.trainingCourses.length > 0 && (
              <section className="mb-8 rounded-lg bg-white/10 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Training Courses</h2>
                  <Link
                    href="/courses"
                    className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
                  >
                    View All &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {venue.trainingCourses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className="block rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10"
                    >
                      <h3 className="mb-2 font-semibold text-[hsl(280,100%,70%)]">
                        {course.title}
                      </h3>
                      <p className="mb-2 line-clamp-2 text-sm text-gray-300">
                        {course.description}
                      </p>
                      {course.instructor && (
                        <p className="text-sm text-gray-400">
                          Instructor: {course.instructor.name}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-lg font-bold text-[hsl(280,100%,70%)]">
                          ${course.price.toFixed(2)}
                        </span>
                        {course.duration && (
                          <span className="text-sm text-gray-400">
                            {course.duration}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Events */}
            <section className="mb-8 rounded-lg bg-white/10 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Upcoming Events in {venue.region?.name || 'Region'}
                </h2>
                <Link
                  href="/events"
                  className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
                >
                  View All &rarr;
                </Link>
              </div>

              {regionalEvents && regionalEvents.length > 0 ? (
                <div className="space-y-4">
                  {regionalEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="block rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="mb-2 text-lg font-semibold text-[hsl(280,100%,70%)]">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="mb-2 line-clamp-2 text-sm text-gray-300">
                              {event.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <div className="flex items-center">
                              <CalendarIcon className="mr-1 h-4 w-4" />
                              {formatDate(event.date)}
                            </div>
                            <div className="flex items-center">
                              <ClockIcon className="mr-1 h-4 w-4" />
                              {formatTime(event.startTime)}
                            </div>
                            {event.venue && (
                              <div className="flex items-center">
                                <BuildingLibraryIcon className="mr-1 h-4 w-4" />
                                {event.venue.name}
                              </div>
                            )}
                          </div>
                        </div>
                        {event.thumbnailUrl && (
                          <div className="ml-4 h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={event.thumbnailUrl}
                              alt={event.title}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No upcoming events in this region.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Social Media Links */}
            {socialMediaLinks && Object.keys(socialMediaLinks).length > 0 && (
              <section className="mb-8 rounded-lg bg-white/10 p-6">
                <h3 className="mb-4 text-xl font-bold">Connect With Us</h3>
                <div className="space-y-3">
                  {Object.entries(socialMediaLinks).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)] hover:underline"
                    >
                      <GlobeAltIcon className="mr-2 h-4 w-4" />
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Additional Images */}
            {venue.imageUrls && venue.imageUrls.length > 0 && (
              <section className="mb-8 rounded-lg bg-white/10 p-6">
                <h3 className="mb-4 text-xl font-bold">Gallery</h3>
                <div className="grid grid-cols-2 gap-2">
                  {venue.imageUrls.slice(0, 4).map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative aspect-square overflow-hidden rounded-lg"
                    >
                      <Image
                        src={imageUrl}
                        alt={`${venue.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                {venue.imageUrls.length > 4 && (
                  <p className="mt-2 text-sm text-gray-400">
                    +{venue.imageUrls.length - 4} more images
                  </p>
                )}
              </section>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/venues"
            className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
          >
            <svg
              className="me-2 h-3.5 w-3.5 rotate-180"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 10"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 5h12m0 0L9 1m4 4L9 9"
              />
            </svg>
            Back to Venues
          </Link>

          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-[hsl(280,100%,70%)] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(280,100%,80%)] focus:outline-none focus:ring-4 focus:ring-[hsl(280,100%,70%)]/25"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
