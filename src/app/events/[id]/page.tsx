import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { events } from "~/server/db/schema";

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
    },
  });

  if (!event) {
    return notFound();
  }

  // In a real app, you'd fetch the fights/fighters for this event
  // For now, we'll just get a few random fighters to display
  const eventFighters = await db.query.fighters.findMany({
    limit: 6,
  });

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
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 text-white">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <div className="mt-2 flex flex-wrap gap-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>{formatDate(event.date)}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{formatTime(event.startTime)}</span>
            </div>
            
            {event.venue && (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <Link href={`/venues/${event.venue.id}`} className="hover:underline">
                  {event.venue.name}
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {event.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">About this event</h2>
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Fight Card</h2>
            
            {eventFighters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Group fighters into pairs to simulate fights */}
                {Array.from({ length: Math.floor(eventFighters.length / 2) }, (_, i) => (
                  <div 
                    key={i}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col items-center">
                        <Link 
                          href={`/fighters/${eventFighters[i*2]?.id}`}
                          className="text-lg font-medium text-blue-600 hover:underline"
                        >
                          {eventFighters[i*2]?.name}
                        </Link>
                        {eventFighters[i*2]?.weightClass && (
                          <span className="text-xs text-gray-500">{eventFighters[i*2]?.weightClass}</span>
                        )}
                      </div>
                      
                      <div className="text-red-600 font-bold">VS</div>
                      
                      <div className="flex flex-col items-center">
                        <Link 
                          href={`/fighters/${eventFighters[i*2+1]?.id}`}
                          className="text-lg font-medium text-blue-600 hover:underline"
                        >
                          {eventFighters[i*2+1]?.name}
                        </Link>
                        {eventFighters[i*2+1]?.weightClass && (
                          <span className="text-xs text-gray-500">{eventFighters[i*2+1]?.weightClass}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Fight card to be announced.</p>
            )}
          </div>
          
          <div>
            <button
              className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300"
            >
              Buy Tickets
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex gap-4">
        <Link 
          href="/events"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-200"
        >
          <svg className="w-3.5 h-3.5 me-2 rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
          </svg>
          Back to Events
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