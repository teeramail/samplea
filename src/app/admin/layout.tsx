import Link from "next/link";
import { type ReactNode } from "react";
// Authentication imports removed for development
// import { getServerAuthSession } from '~/server/auth';
// import { redirect } from 'next/navigation';

// Placeholder for Icons - Install react-icons if not already: npm install react-icons
// import { 
//   HomeIcon, CalendarIcon, LocationMarkerIcon, UserGroupIcon, GlobeIcon, TicketIcon, AcademicCapIcon, UsersIcon, ClipboardListIcon
// } from '@heroicons/react/outline'; // Or solid

const navItems = [
  { name: 'Dashboard', href: '/admin', /* icon: HomeIcon */ },
  { name: 'Events', section: true },
  { name: 'All Events', href: '/admin/events', /* icon: CalendarIcon */ },
  { name: 'Create Event', href: '/admin/events/create', /* icon: CalendarIcon */ },
  { name: 'Venues', section: true },
  { name: 'All Venues', href: '/admin/venues', /* icon: LocationMarkerIcon */ },
  { name: 'Create Venue', href: '/admin/venues/create', /* icon: LocationMarkerIcon */ },
  { name: 'Fighters', section: true },
  { name: 'All Fighters', href: '/admin/fighters', /* icon: UserGroupIcon */ },
  { name: 'Create Fighter', href: '/admin/fighters/create', /* icon: UserGroupIcon */ },
  { name: 'Regions', section: true },
  { name: 'All Regions', href: '/admin/regions', /* icon: GlobeIcon */ },
  { name: 'Create Region', href: '/admin/regions/create', /* icon: GlobeIcon */ },
  { name: 'Tickets', section: true },
  { name: 'All Tickets', href: '/admin/tickets', /* icon: TicketIcon */ },
  // { name: 'Ticket Types', href: '/admin/ticket-types', /* icon: TicketIcon */ }, // Decide if needed
  { name: 'Instructors', section: true },
  { name: 'All Instructors', href: '/admin/instructors', /* icon: UsersIcon */ },
  { name: 'Create Instructor', href: '/admin/instructors/create', /* icon: UsersIcon */ },
  { name: 'Courses', section: true },
  { name: 'All Courses', href: '/admin/courses', /* icon: AcademicCapIcon */ },
  { name: 'Create Course', href: '/admin/courses/create', /* icon: AcademicCapIcon */ },
  { name: 'Enrollments', section: true },
  { name: 'All Enrollments', href: '/admin/enrollments', /* icon: ClipboardListIcon */ },
];

async function AdminSidebar() {
  // We could make the active link highlighting dynamic later using usePathname
  return (
    <aside className="w-64 bg-purple-800 text-purple-100 p-4 flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-white">Admin Dashboard</h2>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className={`${item.section ? 'mt-4 pt-4 border-t border-purple-700' : ''}`}>
              {item.section ? (
                <span className="text-xs font-bold uppercase text-purple-300 px-2">{item.name}</span>
              ) : (
                <Link href={item.href ?? '#'}
                  className="flex items-center px-2 py-2 rounded hover:bg-purple-700 hover:text-white transition-colors duration-200">
                    {/* {item.icon && <item.icon className="h-5 w-5 mr-3" />} */}
                    <span>{item.name}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      {/* Optional: Footer with user info or logout */}
    </aside>
  );
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // --- Authentication Check Temporarily Disabled ---
  // const session = await getServerAuthSession();
  // // Protect admin routes - Adjust logic based on your user role setup
  // if (!session?.user || session.user.role !== 'admin') {
  //   redirect('/api/auth/signin'); // Or redirect to an unauthorized page
  // }
  // --- End Authentication Check ---

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
} 