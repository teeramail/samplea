import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { events } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";
import { formatDateInThaiTimezone, formatTimeRangeInThaiTimezone, getUserTimezoneInfo } from "~/lib/timezoneUtils";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Fetch event details with venue, region and ticket types
  const { id } = await params;
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      venue: true,
      region: true,
      eventTickets: true, // Correct relation name from schema
    },
  });

  if (!event) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return formatDateInThaiTimezone(date);
  };

  const formatTimeRange = (startTime: Date | null, endTime: Date | null) => {
    return formatTimeRangeInThaiTimezone(startTime, endTime);
  };

  // Function to determine event status based on date
  const getEventStatus = (eventDate: Date) => {
    const now = new Date();
    const eventDateTime = new Date(eventDate);

    if (eventDateTime > now) {
      return { label: "Upcoming", className: "bg-yellow-100 text-yellow-800" };
    } else {
      return { label: "Completed", className: "bg-green-100 text-green-800" };
    }
  };

  const status = getEventStatus(event.date);

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Event Details</h1>
        <div className="space-x-2">
          <Link
            href={`/admin/events/${event.id}/edit`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Edit Event
          </Link>
          <Link
            href={`/admin/events/${event.id}/delete`}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Delete Event
          </Link>
          <Link
            href="/admin/events"
            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Back to Events
          </Link>
        </div>
      </div>

      {/* Timezone Information Banner */}
      <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Timezone Information</h3>
            <p className="text-sm text-blue-700">
              All event times are displayed in <strong>Thailand Time (GMT+7)</strong>
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-blue-600">
              Your timezone: {typeof window !== 'undefined' ? getUserTimezoneInfo().timezone : 'Loading...'}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="mb-4 text-xl font-semibold">{event.title}</h2>
            <div className="mb-2 flex items-center">
              <span className="w-24 font-medium text-gray-700">Date:</span>
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="w-24 font-medium text-gray-700">Time:</span>
              <span className="flex items-center">
                {formatTimeRange(event.startTime, event.endTime)}
                <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  Thailand Time (GMT+7)
                </span>
              </span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="w-24 font-medium text-gray-700">Venue:</span>
              {event.venue ? (
                <Link
                  href={`/admin/venues/${event.venue.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {event.venue.name ?? "N/A"}
                </Link>
              ) : (
                "N/A"
              )}
            </div>
            <div className="mb-2 flex items-center">
              <span className="w-24 font-medium text-gray-700">Region:</span>
              {event.region ? (
                <Link
                  href={`/admin/regions/${event.region.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {event.region.name ?? "N/A"}
                </Link>
              ) : (
                "N/A"
              )}
            </div>
            <div className="mb-4 flex items-center">
              <span className="w-24 font-medium text-gray-700">Status:</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
            </div>
            <div>
              <span className="mb-2 block font-medium text-gray-700">
                Description:
              </span>
              <p className="whitespace-pre-line text-gray-600">
                {event.description}
              </p>
            </div>
          </div>
        </div>
        <div>
          {event.imageUrl && (
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-4 text-lg font-semibold">Event Poster</h3>
              <Image
                src={event.imageUrl}
                alt={`${event.title} poster`}
                width={300}
                height={400}
                className="mb-6 rounded-lg object-cover shadow-md"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <h3 className="mb-4 text-lg font-semibold">Ticket Types</h3>
        {event.eventTickets && event.eventTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Seat Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Capacity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Sold
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Available
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {event.eventTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.seatType}
                      </div>
                      {ticket.description && (
                        <div className="text-xs text-gray-500">
                          {ticket.description}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {ticket.price.toLocaleString()} THB
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {ticket.capacity}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {ticket.soldCount}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {ticket.capacity - ticket.soldCount}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500">
            No ticket types defined
          </div>
        )}
      </div>
    </div>
  );
}
