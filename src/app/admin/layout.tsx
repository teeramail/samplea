"use client";

import Link from "next/link";
import { type ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
// Authentication imports removed for development
// import { getServerAuthSession } from '~/server/auth';
// import { redirect } from 'next/navigation';

// Placeholder for Icons - Install react-icons if not already: npm install react-icons
// import {
//   HomeIcon, CalendarIcon, LocationMarkerIcon, UserGroupIcon, GlobeIcon, TicketIcon, AcademicCapIcon, UsersIcon, ClipboardListIcon
// } from '@heroicons/react/outline'; // Or solid

// Navigation structure
const navItems = [
  { name: "Dashboard", href: "/admin", group: null },

  { name: "Events", group: "events" },
  { name: "All Events", href: "/admin/events", group: "events" },
  { name: "Create Event", href: "/admin/events/create", group: "events" },

  { name: "Event Templates", group: "event-templates" },
  {
    name: "All Templates",
    href: "/admin/event-templates",
    group: "event-templates",
  },
  {
    name: "Create Template",
    href: "/admin/event-templates/create",
    group: "event-templates",
  },
  {
    name: "Generate Events",
    href: "/admin/event-templates/generate",
    group: "event-templates",
  },

  { name: "Venues", group: "venues" },
  { name: "All Venues", href: "/admin/venues", group: "venues" },
  { name: "Create Venue", href: "/admin/venues/create", group: "venues" },

  { name: "Fighters", group: "fighters" },
  { name: "All Fighters", href: "/admin/fighters", group: "fighters" },
  { name: "Create Fighter", href: "/admin/fighters/create", group: "fighters" },

  { name: "Regions", group: "regions" },
  { name: "All Regions", href: "/admin/regions", group: "regions" },
  { name: "Create Region", href: "/admin/regions/create", group: "regions" },

  { name: "Tickets", group: "tickets" },
  { name: "All Tickets", href: "/admin/tickets", group: "tickets" },

  { name: "Instructors", group: "instructors" },
  { name: "All Instructors", href: "/admin/instructors", group: "instructors" },
  {
    name: "Create Instructor",
    href: "/admin/instructors/create",
    group: "instructors",
  },

  { name: "Training Courses", group: "courses" },
  { name: "All Courses", href: "/admin/courses", group: "courses" },
  { name: "Create Course", href: "/admin/courses/create", group: "courses" },

  { name: "Blog Posts", group: "posts" },
  { name: "All Posts", href: "/admin/posts", group: "posts" },
  { name: "Create Post", href: "/admin/posts/new", group: "posts" },

  { name: "Enrollments", group: "enrollments" },
  { name: "All Enrollments", href: "/admin/enrollments", group: "enrollments" },

  { name: "Products", group: "products" },
  { name: "All Products", href: "/admin/products", group: "products" },
  { name: "Create Product", href: "/admin/products/create", group: "products" },
  
  { name: "Categories", group: "categories" },
  { name: "All Categories", href: "/admin/categories", group: "categories" },
  { name: "Create Category", href: "/admin/categories/create", group: "categories" },
];

// Top navigation sections for quick access to content management
const topNavSections = [
  { name: "Events", href: "/admin/events", icon: "📅" },
  { name: "Event Templates", href: "/admin/event-templates", icon: "🔄" },
  { name: "Venues", href: "/admin/venues", icon: "🏢" },
  { name: "Fighters", href: "/admin/fighters", icon: "🥊" },
  { name: "Courses", href: "/admin/courses", icon: "📚" },
  { name: "Blog", href: "/admin/posts", icon: "📰" },
  { name: "Products", href: "/admin/products", icon: "🛍️" },
  { name: "Categories", href: "/admin/categories", icon: "🏷️" },
];

// Featured content sections for quick access
const featuredSections = [
  { name: "Featured Gyms", href: "/admin/venues", icon: "🏢" },
  { name: "Featured Courses", href: "/admin/courses", icon: "📚" },
  { name: "Featured News", href: "/admin/posts", icon: "📰" },
  { name: "Featured Fighters", href: "/admin/fighters", icon: "🥊" },
  { name: "Featured Products", href: "/admin/products", icon: "🛍️" },
];

function AdminSidebar({
  isOpen,
  toggleSidebar,
}: {
  isOpen: boolean;
  toggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Determine active group based on the current pathname
  useEffect(() => {
    const activeItem = navItems.find(
      (item) => item.href && pathname.startsWith(item.href),
    );
    if (activeItem) {
      setActiveGroup(activeItem.group);
    }
  }, [pathname]);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-purple-800 text-purple-100 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } flex-col md:static md:flex md:translate-x-0`}
    >
      <div className="flex items-center justify-between border-b border-purple-700 p-4">
        <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 text-white hover:bg-purple-700 md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <nav className="flex-grow overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            // If it's a section header
            if (item.group && !item.href) {
              const isExpanded = activeGroup === item.group;
              return (
                <li
                  key={index}
                  className={`${index > 0 ? "mt-4 border-t border-purple-700 pt-2" : ""}`}
                >
                  <button
                    onClick={() =>
                      setActiveGroup(
                        activeGroup === item.group ? null : item.group,
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-t-md px-3 py-2.5 text-xs font-bold uppercase ${
                      isExpanded
                        ? "border-l-4 border-purple-400 bg-purple-950 font-extrabold text-white shadow-inner"
                        : "text-purple-300 hover:border-l-4 hover:border-purple-400 hover:bg-purple-700 hover:text-white"
                    }`}
                  >
                    <span>{item.name}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180 transform" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="mb-3 rounded-b-md border-b-2 border-purple-600 bg-purple-950/80 pb-2">
                      {/* This is a spacer to visually group the expanded section */}
                    </div>
                  )}
                </li>
              );
            }

            // If it's a menu item
            if (item.href) {
              // Only show if no group or if it's in the active group
              const show = !item.group || activeGroup === item.group;
              const isActive = pathname === item.href;
              const previousItem = index > 0 ? navItems[index - 1] : null;
              // If this is the first child of a group
              const isFirstChild =
                previousItem &&
                previousItem.group === item.group &&
                !previousItem.href;

              return (
                <li key={index} className={`${!show ? "hidden" : ""}`}>
                  <Link
                    href={item.href}
                    className={`ml-3 flex items-center rounded-md px-4 py-2.5 text-sm ${
                      isActive
                        ? "bg-indigo-500 font-medium text-white shadow-sm"
                        : activeGroup === item.group
                          ? "bg-purple-600 text-white transition-colors duration-200 hover:bg-purple-500"
                          : "transition-colors duration-200 hover:bg-purple-700 hover:text-white"
                    } ${isFirstChild ? "-mt-1 pt-1" : ""}`}
                  >
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            }

            return null;
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Get current section name for breadcrumb
  const getCurrentSection = () => {
    const path = pathname.split("/");
    if (path.length > 2) {
      const section = path[2];
      const item = navItems.find(
        (item) => item.group === section && !item.href,
      );
      return item ? item.name : "Dashboard";
    }
    return "Dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile header */}
      <div className="bg-white shadow-md md:hidden">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="text-lg font-medium text-purple-800">
            ThaiMuayThai Admin
          </span>
        </div>
      </div>

      {/* Content area with sidebar */}
      <div className="flex min-h-screen pt-0 md:pt-0">
        <AdminSidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(false)}
        />

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 overflow-y-auto">
          {/* Top navigation for quick access */}
          <div className="mb-4 overflow-x-auto bg-white shadow-sm">
            <div className="flex space-x-4 px-4 py-3">
              {topNavSections.map((section) => (
                <Link
                  key={section.name}
                  href={section.href}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                    pathname.includes(section.href)
                      ? "bg-purple-100 text-purple-800"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-1">{section.icon}</span> {section.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Featured Content Quick Access */}
          {pathname.includes("/admin/venues") ||
          pathname.includes("/admin/courses") ||
          pathname.includes("/admin/posts") ||
          pathname.includes("/admin/fighters") ||
          pathname.includes("/admin/products") ? (
            <div className="mb-4 overflow-x-auto bg-indigo-50">
              <div className="flex space-x-2 px-4 py-3">
                <div className="py-2 font-medium text-indigo-600">
                  Featured Content:
                </div>
                {featuredSections.map((section) => (
                  <Link
                    key={section.name}
                    href={section.href}
                    className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                      pathname.includes(section.href)
                        ? "bg-indigo-100 font-medium text-indigo-800"
                        : "text-indigo-600 hover:bg-indigo-100"
                    }`}
                  >
                    <span className="mr-1">{section.icon}</span> {section.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Simple breadcrumb */}
          <div className="px-6 py-2 text-sm">
            <Link href="/admin" className="text-purple-800 hover:underline">
              Dashboard
            </Link>
            {pathname !== "/admin" && (
              <span className="text-gray-500"> / {getCurrentSection()}</span>
            )}
          </div>

          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
