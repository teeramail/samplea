import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { venues } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image"; // Import Image component

// Define the expected type for venue data, including new fields
type VenueDetail = {
  id: string;
  name: string;
  address: string;
  capacity: number | null;
  regionId: string;
  latitude: number | null;
  longitude: number | null;
  thumbnailUrl: string | null;
  imageUrls: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  region: { id: string; name: string } | null;
  events: { id: string; title: string; date: Date }[] | null;
};

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch venue with region information
  const venue: VenueDetail | undefined = await db.query.venues.findFirst({
    where: eq(venues.id, id),
    with: {
      region: true,
      events: {
        limit: 5,
        orderBy: (events, { desc }) => [desc(events.date)],
      },
    },
  });

  if (!venue) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">{venue.name}</h1>
          <div className="flex space-x-3">
            <Link
              href={`/admin/venues/${venue.id}/edit`}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Edit Venue
            </Link>
            <Link
              href="/admin/venues"
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
            >
              Back to Venues
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-1">
            {venue.thumbnailUrl && (
              <div className="overflow-hidden rounded-lg border shadow-sm">
                <div className="border-b bg-gray-50 px-4 py-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Thumbnail
                  </h3>
                </div>
                <div className="flex justify-center p-4">
                  <Image
                    src={venue.thumbnailUrl}
                    alt={`${venue.name} Thumbnail`}
                    width={200} // Adjust size as needed
                    height={150} // Adjust size as needed
                    className="rounded-md object-cover"
                    unoptimized // Remove if you configure image optimization domains
                  />
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border shadow-sm">
              <div className="border-b bg-gray-50 px-4 py-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Venue Details
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{venue.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Capacity
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {venue.capacity ?? "Not specified"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Region
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {venue.region ? (
                        <Link
                          href={`/admin/regions/${venue.region.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {venue.region.name}
                        </Link>
                      ) : (
                        "Not specified"
                      )}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {venue.address}
                    </dd>
                  </div>
                  {venue.latitude !== null && venue.longitude !== null && (
                    <>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Latitude
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {venue.latitude}
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Longitude
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {venue.longitude}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:col-span-2">
            {venue.imageUrls && venue.imageUrls.length > 0 && (
              <div className="overflow-hidden rounded-lg border shadow-sm">
                <div className="border-b bg-gray-50 px-4 py-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Venue Images
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4">
                  {venue.imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={url}
                        alt={`${venue.name} Image ${index + 1}`}
                        fill // Use fill for aspect ratio control
                        className="rounded-md object-cover"
                        unoptimized // Remove if you configure image optimization domains
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border shadow-sm">
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Events
                </h3>
                <Link
                  href={`/admin/events/create?venueId=${venue.id}&regionId=${venue.regionId}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Event
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Event
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Date
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {venue.events && venue.events.length > 0 ? (
                      venue.events.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {event.title}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {formatDate(event.date)}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <Link
                              href={`/admin/events/${event.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No events at this venue yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
