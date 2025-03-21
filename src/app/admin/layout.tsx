import Link from "next/link";
import { type ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4 bg-purple-900 text-white">
                <h2 className="text-xl font-semibold">Admin Dashboard</h2>
              </div>
              <nav className="p-4">
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/admin"
                      className="block p-2 rounded hover:bg-gray-100 transition-colors"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li className="pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500 px-2">Events</span>
                    <ul className="mt-1 space-y-1">
                      <li>
                        <Link
                          href="/admin/events"
                          className="block p-2 rounded hover:bg-gray-100 transition-colors pl-4"
                        >
                          All Events
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/events/create"
                          className="block p-2 rounded hover:bg-gray-100 transition-colors pl-4"
                        >
                          Create Event
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li className="pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500 px-2">Venues</span>
                    <ul className="mt-1 space-y-1">
                      <li>
                        <Link
                          href="/admin/venues"
                          className="block p-2 rounded hover:bg-gray-100 transition-colors pl-4"
                        >
                          All Venues
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/venues/create"
                          className="block p-2 rounded hover:bg-gray-100 transition-colors pl-4"
                        >
                          Create Venue
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li className="pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500 px-2">Fighters</span>
                    <ul className="mt-1 space-y-1">
                      <li>
                        <Link
                          href="/admin/fighters"
                          className="block p-2 rounded hover:bg-gray-100 transition-colors pl-4"
                        >
                          All Fighters
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/fighters/create"
                          className="block p-2 rounded hover:bg-gray-100 transition-colors pl-4"
                        >
                          Create Fighter
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li className="pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500 px-2">Regions</span>
                    <ul className="mt-1 space-y-1">
                      <li>
                        <Link
                          href="/admin/regions"
                          className="block p-2 rounded hover:bg-gray-100 transition-colors pl-4"
                        >
                          All Regions
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/regions/create"
                          className="block p-2 rounded hover:bg-gray-100 transition-colors pl-4"
                        >
                          Create Region
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li className="pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500 px-2">Tickets</span>
                    <ul className="mt-1 space-y-1">
                      <li>
                        <Link
                          href="/admin/tickets"
                          className="block p-2 rounded hover:bg-gray-100 transition-colors pl-4"
                        >
                          All Tickets
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/ticket-types"
                          className="block p-2 rounded hover:bg-gray-100 transition-colors pl-4"
                        >
                          Ticket Types
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 