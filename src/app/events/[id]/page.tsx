import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { events } from "~/server/db/schema";
import { formatDateInThaiTimezone, formatTimeRangeInThaiTimezone } from "~/lib/timezoneUtils";
import TicketSelection from "./TicketSelection";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      venue: true,
      region: true,
      eventTickets: true,
    },
  });

  if (!event) {
    return notFound();
  }

  const eventTickets = event.eventTickets;

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return formatDateInThaiTimezone(date);
  };

  const formatTimeRange = (startTime: Date | null, endTime: Date | null) => {
    return formatTimeRangeInThaiTimezone(startTime, endTime);
  };

  const getEventStatus = (eventDate: Date | null) => {
    const now = new Date();

    if (!eventDate) {
      return { label: "Unknown", className: "bg-gray-100 text-gray-800" };
    }

    const eventDateTime = new Date(eventDate);

    if (eventDateTime > now) {
      return { label: "Upcoming", className: "bg-yellow-100 text-yellow-800" };
    } else {
      return { label: "Completed", className: "bg-green-100 text-green-800" };
    }
  };

  const status = getEventStatus(event.date);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="p-6">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Event Details
          </h1>

          {/* Timezone Information */}
          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All event times are displayed in Thailand Time (GMT+7)
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-gray-50 p-4">
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
                  Thailand Time
                </span>
              </span>
            </div>

            <div className="mb-2 flex items-center">
              <span className="w-24 font-medium text-gray-700">Venue:</span>
              {event.venue && (
                <Link
                  href={`/venues/${event.venue.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {event.venue.name}
                </Link>
              )}
            </div>

            <div className="mb-2 flex items-center">
              <span className="w-24 font-medium text-gray-700">Region:</span>
              <span>{event.region?.name}</span>
            </div>

            <div className="mb-4 flex items-center">
              <span className="w-24 font-medium text-gray-700">Status:</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            {event.description && (
              <div>
                <span className="mb-2 block font-medium text-gray-700">
                  Description:
                </span>
                <p className="whitespace-pre-line text-gray-600">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <h3 className="mb-4 text-lg font-semibold">Ticket Types</h3>

            {eventTickets && eventTickets.length > 0 ? (
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {eventTickets.map((ticket) => (
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
                            {ticket.price} THB
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No ticket information available.</p>
            )}
          </div>

          <TicketSelection
            tickets={eventTickets || []}
            eventId={event.id}
            eventTitle={event.title}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Link
          href="/events"
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
          Back to Events
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
