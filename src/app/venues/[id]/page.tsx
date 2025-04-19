import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { venues, events } from "~/server/db/schema";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, id),
  });

  if (!venue) {
    return notFound();
  }

  // Get events at this venue
  const venueEvents = await db.query.events.findMany({
    where: (events, { gt, and, or, lte, eq: equals }) => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      return and(
        equals(events.venueId, venue.id),
        or(
          gt(events.date, now),
          and(
            gt(events.startTime, fifteenMinutesAgo),
            lte(events.startTime, now),
          ),
        ),
      );
    },
    orderBy: (events, { desc }) => [desc(events.date)],
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800">{venue.name}</h1>
          <p className="mt-2 text-gray-600">{venue.address}</p>

          <div className="mt-4 flex flex-wrap gap-4">
            {venue.capacity && (
              <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                Capacity: {venue.capacity}
              </div>
            )}
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">
              Upcoming Events
            </h2>

            {venueEvents.length > 0 ? (
              <div className="space-y-4">
                {venueEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-800">
                        {event.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {formatDate(event.date)}
                      </span>
                    </div>

                    <div className="mt-2">
                      <Link
                        href={`/events/${event.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View Event Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming events at this venue.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Link
          href="/venues"
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
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
          className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
