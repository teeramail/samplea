import Link from "next/link";
import { db } from "~/server/db";
import { events, venues, fighters } from "~/server/db/schema";

export default async function AdminDashboardPage() {
  // Get counts for dashboard stats
  const [eventsCount, venuesCount, fightersCount] = await Promise.all([
    db.select({ count: events.id }).from(events).then(result => result.length),
    db.select({ count: venues.id }).from(venues).then(result => result.length),
    db.select({ count: fighters.id }).from(fighters).then(result => result.length),
  ]);

  // Get recent events
  const recentEvents = await db.query.events.findMany({
    orderBy: (events, { desc }) => [desc(events.createdAt)],
    limit: 5,
    with: {
      venue: true,
    },
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-purple-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-800 text-sm font-medium">Total Events</p>
                <p className="text-3xl font-bold text-purple-900">{eventsCount}</p>
              </div>
              <div className="bg-purple-200 p-3 rounded-full">
                <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/events" className="text-purple-800 hover:text-purple-900 text-sm font-medium hover:underline">
                View all events →
              </Link>
            </div>
          </div>
          
          <div className="bg-blue-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 text-sm font-medium">Total Venues</p>
                <p className="text-3xl font-bold text-blue-900">{venuesCount}</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-full">
                <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/venues" className="text-blue-800 hover:text-blue-900 text-sm font-medium hover:underline">
                View all venues →
              </Link>
            </div>
          </div>
          
          <div className="bg-red-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-800 text-sm font-medium">Total Fighters</p>
                <p className="text-3xl font-bold text-red-900">{fightersCount}</p>
              </div>
              <div className="bg-red-200 p-3 rounded-full">
                <svg className="w-8 h-8 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/fighters" className="text-red-800 hover:text-red-900 text-sm font-medium hover:underline">
                View all fighters →
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Recent Events</h2>
          <Link href="/admin/events" className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">
            View all
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(event.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{event.venue?.name || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/events/${event.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                        View
                      </Link>
                      <Link href={`/admin/events/${event.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
          </div>
          
          <div className="space-y-4">
            <Link 
              href="/admin/events/create" 
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800">Create New Event</h3>
                <p className="text-sm text-gray-500">Add a new event to the calendar</p>
              </div>
            </Link>
            
            <Link 
              href="/admin/venues/create" 
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800">Add New Venue</h3>
                <p className="text-sm text-gray-500">Register a new venue location</p>
              </div>
            </Link>
            
            <Link 
              href="/admin/fighters/create" 
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800">Register New Fighter</h3>
                <p className="text-sm text-gray-500">Add a new fighter profile</p>
              </div>
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">System Status</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between">
                <h3 className="text-lg font-medium text-gray-800">Database</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Connected to PostgreSQL database</p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between">
                <h3 className="text-lg font-medium text-gray-800">API Status</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">All API endpoints are responding normally</p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between">
                <h3 className="text-lg font-medium text-gray-800">Upcoming Maintenance</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Scheduled
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Regular maintenance: April 15th, 2024</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 