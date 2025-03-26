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
    where: eq(events.venueId, venue.id),
    orderBy: (events, { desc }) => [desc(events.date)],
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800">{venue.name}</h1>
          <p className="text-gray-600 mt-2">{venue.address}</p>
          
          <div className="mt-4 flex flex-wrap gap-4">
            {venue.capacity && (
              <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                Capacity: {venue.capacity}
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upcoming Events</h2>
            
            {venueEvents.length > 0 ? (
              <div className="space-y-4">
                {venueEvents.map((event) => (
                  <div 
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">{event.title}</h3>
                      <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
                    </div>
                    
                    <div className="mt-2">
                      <Link 
                        href={`/events/${event.id}`}
                        className="text-blue-600 hover:underline text-sm font-medium"
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
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-200"
        >
          <svg className="w-3.5 h-3.5 me-2 rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
          </svg>
          Back to Venues
        </Link>
        
        <Link 
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
        >
          Home
        </Link>
      </div>
    </main>
  );
} 