import Link from "next/link";
import { db } from "~/server/db";
import {
  events,
  venues,
  fighters,
  posts,
  trainingCourses,
  products,
} from "~/server/db/schema";

export default async function AdminDashboardPage() {
  // Get counts for dashboard stats
  const [eventsCount, venuesCount, fightersCount, coursesCount, postsCount, productsCount] =
    await Promise.all([
      db
        .select({ count: events.id })
        .from(events)
        .then((result) => result.length),
      db
        .select({ count: venues.id })
        .from(venues)
        .then((result) => result.length),
      db
        .select({ count: fighters.id })
        .from(fighters)
        .then((result) => result.length),
      db
        .select({ count: trainingCourses.id })
        .from(trainingCourses)
        .then((result) => result.length),
      db
        .select({ count: posts.id })
        .from(posts)
        .then((result) => result.length),
      db
        .select({ count: products.id })
        .from(products)
        .then((result) => result.length),
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
    {
      name: "Add Event",
      href: "/admin/events/create",
      icon: "📅",
      color: "purple",
    },
    {
      name: "Add Venue",
      href: "/admin/venues/create",
      icon: "🏢",
      color: "blue",
    },
    {
      name: "Add Fighter",
      href: "/admin/fighters/create",
      icon: "🥊",
      color: "red",
    },
    {
      name: "Add Blog Post",
      href: "/admin/posts/new",
      icon: "📰",
      color: "amber",
    },
    {
      name: "Add Course",
      href: "/admin/courses/create",
      icon: "📚",
      color: "green",
    },
    {
      name: "Add Product",
      href: "/admin/products/create",
      icon: "🛍️",
      color: "teal",
    },
  ];

  // Featured content links
  const featuredLinks = [
    { name: "Manage Featured Gyms", href: "/admin/venues", icon: "🏢" },
    { name: "Manage Featured Courses", href: "/admin/courses", icon: "📚" },
    { name: "Manage Featured News", href: "/admin/posts", icon: "📰" },
    { name: "Manage Featured Fighters", href: "/admin/fighters", icon: "🥊" },
    { name: "Manage Featured Products", href: "/admin/products", icon: "🛍️" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">
        Dashboard Overview
      </h1>

      {/* Stat cards - more mobile friendly with smaller cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg bg-purple-100 p-4 shadow-sm">
          <div className="mb-2 flex items-center">
            <div className="mr-3 rounded-full bg-purple-200 p-2">
              <span className="text-xl">📅</span>
            </div>
            <div>
              <p className="text-xs font-medium text-purple-800">Events</p>
              <p className="text-2xl font-bold text-purple-900">
                {eventsCount}
              </p>
            </div>
          </div>
          <Link
            href="/admin/events"
            className="text-xs font-medium text-purple-800 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="rounded-lg bg-blue-100 p-4 shadow-sm">
          <div className="mb-2 flex items-center">
            <div className="mr-3 rounded-full bg-blue-200 p-2">
              <span className="text-xl">🏢</span>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-800">Venues</p>
              <p className="text-2xl font-bold text-blue-900">{venuesCount}</p>
            </div>
          </div>
          <Link
            href="/admin/venues"
            className="text-xs font-medium text-blue-800 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="rounded-lg bg-red-100 p-4 shadow-sm">
          <div className="mb-2 flex items-center">
            <div className="mr-3 rounded-full bg-red-200 p-2">
              <span className="text-xl">🥊</span>
            </div>
            <div>
              <p className="text-xs font-medium text-red-800">Fighters</p>
              <p className="text-2xl font-bold text-red-900">{fightersCount}</p>
            </div>
          </div>
          <Link
            href="/admin/fighters"
            className="text-xs font-medium text-red-800 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="rounded-lg bg-green-100 p-4 shadow-sm">
          <div className="mb-2 flex items-center">
            <div className="mr-3 rounded-full bg-green-200 p-2">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <p className="text-xs font-medium text-green-800">Courses</p>
              <p className="text-2xl font-bold text-green-900">
                {coursesCount}
              </p>
            </div>
          </div>
          <Link
            href="/admin/courses"
            className="text-xs font-medium text-green-800 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="rounded-lg bg-amber-100 p-4 shadow-sm">
          <div className="mb-2 flex items-center">
            <div className="mr-3 rounded-full bg-amber-200 p-2">
              <span className="text-xl">📰</span>
            </div>
            <div>
              <p className="text-xs font-medium text-amber-800">Blog Posts</p>
              <p className="text-2xl font-bold text-amber-900">{postsCount}</p>
            </div>
          </div>
          <Link
            href="/admin/posts"
            className="text-xs font-medium text-amber-800 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="rounded-lg bg-teal-100 p-4 shadow-sm">
          <div className="mb-2 flex items-center">
            <div className="mr-3 rounded-full bg-teal-200 p-2">
              <span className="text-xl">🛍️</span>
            </div>
            <div>
              <p className="text-xs font-medium text-teal-800">Products</p>
              <p className="text-2xl font-bold text-teal-900">{productsCount}</p>
            </div>
          </div>
          <Link
            href="/admin/products"
            className="text-xs font-medium text-teal-800 hover:underline"
          >
            View all →
          </Link>
        </div>
      </div>

      {/* Quick Actions - Mobile Friendly Buttons */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className={`rounded-lg p-3 shadow-sm bg-${action.color}-50 border border-${action.color}-200 flex flex-col items-center text-center hover:bg-${action.color}-100 transition-colors`}
            >
              <span className="mb-1 text-2xl">{action.icon}</span>
              <span className={`text-sm font-medium text-${action.color}-800`}>
                {action.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Content Management */}
      <div className="mb-6 rounded-lg bg-indigo-50 p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-indigo-800">
          Manage Featured Content
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {featuredLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center rounded-lg bg-white p-3 shadow-sm transition-colors hover:bg-indigo-100"
            >
              <span className="mr-2 text-2xl">{link.icon}</span>
              <span className="text-sm font-medium text-indigo-800">
                {link.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Events - Mobile responsive table */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Recent Events</h2>
          <Link
            href="/admin/events"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Title
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Venue
                  </th>
                  <th scope="col" className="relative px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {event.title}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="text-sm text-gray-500">
                          {formatDate(event.date)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="text-sm text-gray-500">
                          {event.venue?.name ?? "N/A"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="mr-3 text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-center text-sm text-gray-500"
                    >
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
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          System Status
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-green-100 p-2">
                <span className="text-sm text-green-700">🔄</span>
              </div>
              <span className="text-sm font-medium">Database Connection</span>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-green-100 p-2">
                <span className="text-sm text-green-700">⚡</span>
              </div>
              <span className="text-sm font-medium">API Services</span>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              Operational
            </span>
          </div>

          <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-green-100 p-2">
                <span className="text-sm text-green-700">⭐</span>
              </div>
              <span className="text-sm font-medium">Featured Content</span>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
