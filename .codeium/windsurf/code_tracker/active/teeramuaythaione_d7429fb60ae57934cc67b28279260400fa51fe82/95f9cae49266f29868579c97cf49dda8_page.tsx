�_
import Link from "next/link";
import { db } from "~/server/db";
import { events, venues, fighters, posts, trainingCourses } from "~/server/db/schema";

export default async function AdminDashboardPage() {
  // Get counts for dashboard stats
  const [eventsCount, venuesCount, fightersCount, coursesCount, postsCount] = await Promise.all([
    db.select({ count: events.id }).from(events).then(result => result.length),
    db.select({ count: venues.id }).from(venues).then(result => result.length),
    db.select({ count: fighters.id }).from(fighters).then(result => result.length),
    db.select({ count: trainingCourses.id }).from(trainingCourses).then(result => result.length),
    db.select({ count: posts.id }).from(posts).then(result => result.length),
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

  // Quick action buttons
  const quickActions = [
    { name: 'Add Event', href: '/admin/events/create', icon: '📅', color: 'purple' },
    { name: 'Add Venue', href: '/admin/venues/create', icon: '🏢', color: 'blue' },
    { name: 'Add Fighter', href: '/admin/fighters/create', icon: '🥊', color: 'red' },
    { name: 'Add Blog Post', href: '/admin/posts/new', icon: '📰', color: 'amber' },
    { name: 'Add Course', href: '/admin/courses/create', icon: '📚', color: 'green' },
  ];

  // Featured content links
  const featuredLinks = [
    { name: 'Manage Featured Gyms', href: '/admin/venues', icon: '🏢' },
    { name: 'Manage Featured Courses', href: '/admin/courses', icon: '📚' },
    { name: 'Manage Featured News', href: '/admin/posts', icon: '📰' },
    { name: 'Manage Featured Fighters', href: '/admin/fighters', icon: '🥊' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Overview</h1>
      
      {/* Stat cards - more mobile friendly with smaller cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-purple-100 p-4 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <div className="bg-purple-200 p-2 rounded-full mr-3">
              <span className="text-xl">📅</span>
            </div>
            <div>
              <p className="text-purple-800 text-xs font-medium">Events</p>
              <p className="text-2xl font-bold text-purple-900">{eventsCount}</p>
            </div>
          </div>
          <Link href="/admin/events" className="text-purple-800 text-xs font-medium hover:underline">
            View all →
          </Link>
        </div>
        
        <div className="bg-blue-100 p-4 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <div className="bg-blue-200 p-2 rounded-full mr-3">
              <span className="text-xl">🏢</span>
            </div>
            <div>
              <p className="text-blue-800 text-xs font-medium">Venues</p>
              <p className="text-2xl font-bold text-blue-900">{venuesCount}</p>
            </div>
          </div>
          <Link href="/admin/venues" className="text-blue-800 text-xs font-medium hover:underline">
            View all →
          </Link>
        </div>
        
        <div className="bg-red-100 p-4 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <div className="bg-red-200 p-2 rounded-full mr-3">
              <span className="text-xl">🥊</span>
            </div>
            <div>
              <p className="text-red-800 text-xs font-medium">Fighters</p>
              <p className="text-2xl font-bold text-red-900">{fightersCount}</p>
            </div>
          </div>
          <Link href="/admin/fighters" className="text-red-800 text-xs font-medium hover:underline">
            View all →
          </Link>
        </div>
        
        <div className="bg-green-100 p-4 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <div className="bg-green-200 p-2 rounded-full mr-3">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <p className="text-green-800 text-xs font-medium">Courses</p>
              <p className="text-2xl font-bold text-green-900">{coursesCount}</p>
            </div>
          </div>
          <Link href="/admin/courses" className="text-green-800 text-xs font-medium hover:underline">
            View all →
          </Link>
        </div>
        
        <div className="bg-amber-100 p-4 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <div className="bg-amber-200 p-2 rounded-full mr-3">
              <span className="text-xl">📰</span>
            </div>
            <div>
              <p className="text-amber-800 text-xs font-medium">Blog Posts</p>
              <p className="text-2xl font-bold text-amber-900">{postsCount}</p>
            </div>
          </div>
          <Link href="/admin/posts" className="text-amber-800 text-xs font-medium hover:underline">
            View all →
          </Link>
        </div>
      </div>
      
      {/* Quick Actions - Mobile Friendly Buttons */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {quickActions.map((action) => (
            <Link 
              key={action.name}
              href={action.href}
              className={`p-3 rounded-lg shadow-sm bg-${action.color}-50 border border-${action.color}-200 flex flex-col items-center text-center hover:bg-${action.color}-100 transition-colors`}
            >
              <span className="text-2xl mb-1">{action.icon}</span>
              <span className={`text-sm font-medium text-${action.color}-800`}>{action.name}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Featured Content Management */}
      <div className="bg-indigo-50 p-4 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-indigo-800 mb-3">Manage Featured Content</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {featuredLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="bg-white p-3 rounded-lg shadow-sm hover:bg-indigo-100 transition-colors flex items-center"
            >
              <span className="text-2xl mr-2">{link.icon}</span>
              <span className="text-sm font-medium text-indigo-800">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Recent Events - Mobile responsive table */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Events</h2>
          <Link href="/admin/events" className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">
            View all
          </Link>
        </div>
        
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th scope="col" className="relative px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(event.date)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{event.venue?.name ?? "N/A"}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/admin/events/${event.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
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
                    <td colSpan={4} className="px-4 py-3 text-center text-sm text-gray-500">
                      No events found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* System Status */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">System Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <span className="text-green-700 text-sm">🔄</span>
              </div>
              <span className="text-sm font-medium">Database Connection</span>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <span className="text-green-700 text-sm">⚡</span>
              </div>
              <span className="text-sm font-medium">API Services</span>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Operational
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <span className="text-green-700 text-sm">⭐</span>
              </div>
              <span className="text-sm font-medium">Featured Content</span>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 
�_"(d7429fb60ae57934cc67b28279260400fa51fe822Vfile:///c:/work/projects/newpro/teeonedWinsurf/teeramuaythaione/src/app/admin/page.tsx:?file:///c:/work/projects/newpro/teeonedWinsurf/teeramuaythaione