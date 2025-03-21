import Link from "next/link";
import { db } from "~/server/db";
import { events, venues, regions } from "~/server/db/schema";
import { eq, desc, and } from "drizzle-orm";

type EventsPageProps = {
  searchParams: { region?: string };
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { region: regionId } = searchParams;
  
  // Query builder for events
  let query = db.query.events.findMany({
    orderBy: (events, { desc }) => [desc(events.date)],
    with: {
      venue: true,
      region: true,
    },
  });
  
  // If region filter is provided, filter by region
  if (regionId) {
    query = db.query.events.findMany({
      where: eq(events.regionId, regionId),
      orderBy: (events, { desc }) => [desc(events.date)],
      with: {
        venue: true,
        region: true,
      },
    });
  }
  
  // Execute query
  const eventsList = await query;
  
  // Get the region name if a filter is active
  let activeRegionName = '';
  if (regionId) {
    const region = await db.query.regions.findFirst({
      where: eq(regions.id, regionId),
    });
    if (region) {
      activeRegionName = region.name;
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">
        {activeRegionName ? `Events in ${activeRegionName}` : 'All Upcoming Events'}
      </h1>
      
      {activeRegionName && (
        <p className="text-gray-600 mb-6">
          Showing Muay Thai events in the {activeRegionName} region
        </p>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        {eventsList.length > 0 ? (
          eventsList.map((event) => (
            <div 
              key={event.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{event.title}</h2>
                    {event.description && (
                      <p className="text-gray-600 mt-2">{event.description}</p>
                    )}
                  </div>
                  <div className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                    {formatDate(event.date)}
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{formatTime(event.startTime)}</span>
                  </div>
                  
                  {event.venue && (
                    <div className="flex items-center text-gray-700">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span>{event.venue.name}</span>
                    </div>
                  )}
                  
                  {event.region && (
                    <div className="flex items-center text-gray-700">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>{event.region.name}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Link 
                    href={`/events/${event.id}`}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300"
                  >
                    View Details
                    <svg className="w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">
              {activeRegionName 
                ? `There are currently no scheduled events in ${activeRegionName}.` 
                : 'There are currently no scheduled events.'}
            </p>
            <div className="mt-4">
              <Link
                href="/events"
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                View all events
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <Link 
          href="/"
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
} 