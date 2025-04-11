import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { events } from "~/server/db/schema";
import TicketSelection from './TicketSelection';

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
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: Date | null) => {
    if (!time) return 'N/A';
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Event Details</h1>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">{event.title}</h2>
            
            <div className="flex items-center mb-2">
              <span className="font-medium text-gray-700 w-24">Date:</span>
              <span>{formatDate(event.date)}</span>
            </div>
            
            <div className="flex items-center mb-2">
              <span className="font-medium text-gray-700 w-24">Time:</span>
              <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
            </div>
            
            <div className="flex items-center mb-2">
              <span className="font-medium text-gray-700 w-24">Venue:</span>
              {event.venue && (
                <Link href={`/venues/${event.venue.id}`} className="text-blue-600 hover:underline">
                  {event.venue.name}
                </Link>
              )}
            </div>
            
            <div className="flex items-center mb-2">
              <span className="font-medium text-gray-700 w-24">Region:</span>
              <span>{event.region?.name}</span>
            </div>
            
            <div className="flex items-center mb-4">
              <span className="font-medium text-gray-700 w-24">Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                {status.label}
              </span>
            </div>
            
            {event.description && (
              <div>
                <span className="font-medium text-gray-700 block mb-2">Description:</span>
                <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">Ticket Types</h3>
            
            {eventTickets && eventTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seat Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eventTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{ticket.seatType}</div>
                          {ticket.description && (
                            <div className="text-xs text-gray-500">{ticket.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ticket.price} THB</div>
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