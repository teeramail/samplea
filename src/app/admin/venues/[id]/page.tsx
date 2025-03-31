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
  params 
}: { 
  params: Promise<{ id: string }> 
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
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{venue.name}</h1>
          <div className="flex space-x-3">
            <Link
              href={`/admin/venues/${venue.id}/edit`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
            >
              Edit Venue
            </Link>
            <Link
              href="/admin/venues"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
            >
              Back to Venues
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            {venue.thumbnailUrl && (
                <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                        <h3 className="text-lg font-medium text-gray-900">Thumbnail</h3>
                    </div>
                    <div className="p-4 flex justify-center">
                        <Image 
                            src={venue.thumbnailUrl}
                            alt={`${venue.name} Thumbnail`}
                            width={200} // Adjust size as needed
                            height={150} // Adjust size as needed
                            className="object-cover rounded-md"
                            unoptimized // Remove if you configure image optimization domains
                        />
                    </div>
                </div>
            )}

            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-lg font-medium text-gray-900">Venue Details</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{venue.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                    <dd className="mt-1 text-sm text-gray-900">{venue.capacity ?? "Not specified"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Region</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {venue.region ? (
                        <Link href={`/admin/regions/${venue.region.id}`} className="text-blue-600 hover:underline">
                          {venue.region.name}
                        </Link>
                      ) : (
                        "Not specified"
                      )}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">{venue.address}</dd>
                  </div>
                   {venue.latitude !== null && venue.longitude !== null && (
                      <>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Latitude</dt>
                            <dd className="mt-1 text-sm text-gray-900">{venue.latitude}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Longitude</dt>
                            <dd className="mt-1 text-sm text-gray-900">{venue.longitude}</dd>
                          </div>
                      </>
                   )}
                </dl>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
             {venue.imageUrls && venue.imageUrls.length > 0 && (
                <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                        <h3 className="text-lg font-medium text-gray-900">Venue Images</h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {venue.imageUrls.map((url, index) => (
                            <div key={index} className="relative aspect-square">
                                <Image 
                                    src={url}
                                    alt={`${venue.name} Image ${index + 1}`}
                                    fill // Use fill for aspect ratio control
                                    className="object-cover rounded-md"
                                    unoptimized // Remove if you configure image optimization domains
                                />
                            </div>
                        ))}
                    </div>
                </div>
             )}

             <div className="border rounded-lg overflow-hidden shadow-sm">
               <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                 <h3 className="text-lg font-medium text-gray-900">Recent Events</h3>
                 <Link href={`/admin/events/create?venueId=${venue.id}&regionId=${venue.regionId}`} className="text-sm text-blue-600 hover:text-blue-800">
                   + Add Event
                 </Link>
               </div>
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {venue.events?.length > 0 ? (
                      venue.events.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(event.date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/admin/events/${event.id}`} className="text-blue-600 hover:text-blue-900">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
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
