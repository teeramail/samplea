'use client';

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
  { name: 'Dashboard', href: '/admin', group: null },
  
  { name: 'Events', group: 'events' },
  { name: 'All Events', href: '/admin/events', group: 'events' },
  { name: 'Create Event', href: '/admin/events/create', group: 'events' },
  
  { name: 'Venues', group: 'venues' },
  { name: 'All Venues', href: '/admin/venues', group: 'venues' },
  { name: 'Create Venue', href: '/admin/venues/create', group: 'venues' },
  
  { name: 'Fighters', group: 'fighters' },
  { name: 'All Fighters', href: '/admin/fighters', group: 'fighters' },
  { name: 'Create Fighter', href: '/admin/fighters/create', group: 'fighters' },
  
  { name: 'Regions', group: 'regions' },
  { name: 'All Regions', href: '/admin/regions', group: 'regions' },
  { name: 'Create Region', href: '/admin/regions/create', group: 'regions' },
  
  { name: 'Tickets', group: 'tickets' },
  { name: 'All Tickets', href: '/admin/tickets', group: 'tickets' },
  
  { name: 'Instructors', group: 'instructors' },
  { name: 'All Instructors', href: '/admin/instructors', group: 'instructors' },
  { name: 'Create Instructor', href: '/admin/instructors/create', group: 'instructors' },
  
  { name: 'Training Courses', group: 'courses' },
  { name: 'All Courses', href: '/admin/courses', group: 'courses' },
  { name: 'Create Course', href: '/admin/courses/create', group: 'courses' },
  
  { name: 'Blog Posts', group: 'posts' },
  { name: 'All Posts', href: '/admin/posts', group: 'posts' },
  { name: 'Create Post', href: '/admin/posts/new', group: 'posts' },
  
  { name: 'Enrollments', group: 'enrollments' },
  { name: 'All Enrollments', href: '/admin/enrollments', group: 'enrollments' },
];

// Top navigation sections for quick access to content management
const topNavSections = [
  { name: 'Events', href: '/admin/events', icon: '📅' },
  { name: 'Venues', href: '/admin/venues', icon: '🏢' },
  { name: 'Fighters', href: '/admin/fighters', icon: '🥊' },
  { name: 'Courses', href: '/admin/courses', icon: '📚' },
  { name: 'Blog', href: '/admin/posts', icon: '📰' },
];

// Featured content sections for quick access
const featuredSections = [
  { name: 'Featured Gyms', href: '/admin/venues', icon: '🏢' },
  { name: 'Featured Courses', href: '/admin/courses', icon: '📚' },
  { name: 'Featured News', href: '/admin/posts', icon: '📰' },
  { name: 'Featured Fighters', href: '/admin/fighters', icon: '🥊' },
];

function AdminSidebar({ isOpen, toggleSidebar }: { isOpen: boolean; toggleSidebar: () => void }) {
  const pathname = usePathname();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Determine active group based on the current pathname
  useEffect(() => {
    const activeItem = navItems.find(item => item.href && pathname.startsWith(item.href));
    if (activeItem) {
      setActiveGroup(activeItem.group);
    }
  }, [pathname]);

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 bg-purple-800 text-purple-100 transform transition-transform duration-300 ease-in-out w-64 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:static md:flex flex-col`}
    >
      <div className="flex items-center justify-between p-4 border-b border-purple-700">
        <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-white p-2 rounded-md hover:bg-purple-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                <li key={index} className={`${index > 0 ? 'mt-4 pt-2 border-t border-purple-700' : ''}`}>
                  <button
                    onClick={() => setActiveGroup(activeGroup === item.group ? null : item.group)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-t-md text-xs font-bold uppercase 
                    ${isExpanded 
                      ? 'bg-purple-950 text-white font-extrabold shadow-inner border-l-4 border-purple-400' 
                      : 'text-purple-300 hover:bg-purple-700 hover:text-white hover:border-l-4 hover:border-purple-400'}`}
                  >
                    <span>{item.name}</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="bg-purple-950/80 mb-3 pb-2 rounded-b-md border-b-2 border-purple-600">
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
              const previousItem = index > 0 ? navItems[index-1] : null;
              // If this is the first child of a group
              const isFirstChild = previousItem && previousItem.group === item.group && !previousItem.href;
              
              return (
                <li key={index} className={`${!show ? 'hidden' : ''}`}>
                  <Link 
                    href={item.href}
                    className={`flex items-center px-4 py-2.5 rounded-md ml-3 text-sm 
                    ${isActive 
                      ? 'bg-indigo-500 text-white font-medium shadow-sm' 
                      : activeGroup === item.group 
                        ? 'bg-purple-600 text-white hover:bg-purple-500 transition-colors duration-200' 
                        : 'hover:bg-purple-700 hover:text-white transition-colors duration-200'
                    }
                    ${isFirstChild ? '-mt-1 pt-1' : ''}`}
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
    const path = pathname.split('/');
    if (path.length > 2) {
      const section = path[2];
      const item = navItems.find(item => item.group === section && !item.href);
      return item ? item.name : 'Dashboard';
    }
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile header */}
      <div className="bg-white md:hidden shadow-md">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 p-2 rounded-md hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-medium text-purple-800">ThaiMuayThai Admin</span>
        </div>
      </div>

      {/* Content area with sidebar */}
      <div className="flex min-h-screen pt-0 md:pt-0">
        <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
        
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        <main className="flex-1 overflow-y-auto">
          {/* Top navigation for quick access */}
          <div className="bg-white shadow-sm mb-4 overflow-x-auto">
            <div className="flex px-4 py-3 space-x-4">
              {topNavSections.map((section) => (
                <Link
                  key={section.name}
                  href={section.href}
                  className={`whitespace-nowrap px-3 py-2 rounded-md font-medium text-sm ${
                    pathname.includes(section.href)
                      ? 'bg-purple-100 text-purple-800' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{section.icon}</span> {section.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Featured Content Quick Access */}
          {pathname.includes('/admin/venues') || pathname.includes('/admin/courses') || 
           pathname.includes('/admin/posts') || pathname.includes('/admin/fighters') ? (
            <div className="bg-indigo-50 mb-4 overflow-x-auto">
              <div className="flex px-4 py-3 space-x-2">
                <div className="text-indigo-600 font-medium py-2">Featured Content:</div>
                {featuredSections.map((section) => (
                  <Link
                    key={section.name}
                    href={section.href}
                    className={`whitespace-nowrap px-3 py-2 rounded-md text-sm ${
                      pathname.includes(section.href)
                        ? 'bg-indigo-100 text-indigo-800 font-medium' 
                        : 'text-indigo-600 hover:bg-indigo-100'
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
            <Link href="/admin" className="text-purple-800 hover:underline">Dashboard</Link>
            {pathname !== '/admin' && (
              <span className="text-gray-500"> / {getCurrentSection()}</span>
            )}
          </div>
          
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 