'use client';

import Link from "next/link";
import { api } from "~/trpc/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Pagination from "~/components/admin/Pagination";
import SortableHeader from "~/components/admin/SortableHeader";
import PageSizeSelector from "~/components/admin/PageSizeSelector";

// Define the interface for an event
interface Event {
  id: string;
  title: string;
  date: Date;
  venue?: {
    id: string;
    name: string;
  } | null;
  region?: {
    id: string;
    name: string;
  } | null;
  updatedAt?: Date;
}

// Define the response type from the API
interface EventsResponse {
  items?: Event[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

// Type guard to check if the response has items property
function hasItems(data: Event[] | EventsResponse | undefined): data is EventsResponse {
  return !!data && 'items' in data;
}

export default function EventsListPage() {
  const router = useRouter();
  // State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<'title' | 'date' | 'venue' | 'region' | 'updatedAt'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch the list of events with pagination
  const { data: eventsData, isLoading, error } = api.event.list.useQuery({
    page: currentPage,
    limit: itemsPerPage,
    sortField,
    sortDirection,
    query: searchQuery || undefined
  });

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  // Handle column sort
  const handleSort = (field: 'title' | 'date' | 'venue' | 'region' | 'updatedAt') => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  // Function to determine event status based on date
  const getEventStatus = (eventDate: Date) => {
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    
    if (eventDateTime > now) {
      return { label: "Upcoming", className: "bg-yellow-100 text-yellow-800" };
    } else {
      return { label: "Completed", className: "bg-green-100 text-green-800" };
    }
  };

  if (isLoading) return <div className="p-4">Loading events...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading events: {error.message}</div>;

  // Process the events data safely
  let events: Event[] = [];
  let totalCount = 0;
  let pageCount = 1;
  
  if (hasItems(eventsData)) {
    events = eventsData.items ?? [];
    totalCount = eventsData.totalCount;
    pageCount = eventsData.pageCount;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Events Management</h1>
        <Link 
          href="/admin/events/create" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add New Event
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-gray-700 font-medium mr-2">Total Events:</span>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {totalCount}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <svg 
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Items per page */}
            <PageSizeSelector 
              itemsPerPage={itemsPerPage} 
              onItemsPerPageChange={handleItemsPerPageChange} 
            />
          </div>
        </div>
      </div>

      {/* Desktop view - table layout */}
      <div className="overflow-x-auto shadow-sm rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                label="Title"
                field="title"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Date"
                field="date"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Venue"
                field="venue"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={handleSort}
              />
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <SortableHeader
                label="Last Updated"
                field="updatedAt"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={handleSort}
                className="text-center"
              />
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.length > 0 ? (
              events.map((event) => {
                const status = getEventStatus(event.date);
                return (
                  <tr 
                    key={event.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/events/${event.id}/view`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(event.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{event.venue?.name ?? "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {event.updatedAt ? new Date(event.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <Link 
                        href={`/admin/events/${event.id}/edit`} 
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                            // TODO: Add delete mutation
                            console.log(`Delete event ${event.id}`);
                          }
                        }} 
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No events found. Click &quot;Add New Event&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {events.length > 0 && pageCount > 1 && (
        <Pagination 
          currentPage={currentPage} 
          pageCount={pageCount} 
          onPageChange={handlePageChange} 
        />
      )}
    </div>
  );
}