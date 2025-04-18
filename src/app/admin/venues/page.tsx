'use client';

import Link from "next/link";
import { api } from "~/trpc/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
// import toast from "react-hot-toast"; // Optional

// Define the interface for a venue
interface Venue {
  id: string;
  name: string;
  isFeatured: boolean;
  address?: string;
  region?: {
    name?: string;
  } | null;
  updatedAt?: Date;
  // Add other properties as needed
}

// Define the response type from the API
interface VenuesResponse {
  items?: Venue[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

// Type guard to check if the response has items property
function hasItems(data: Venue[] | VenuesResponse | undefined): data is VenuesResponse {
  return !!data && 'items' in data;
}

// Mobile-friendly toggle switch
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <button
      type="button"
      className={`${enabled ? 'bg-indigo-600' : 'bg-gray-300'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span className="sr-only">{enabled ? 'Disable' : 'Enable'}</span>
      <span
        className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
      />
    </button>
  );
}

export default function AdminVenuesPage() {
  const router = useRouter();
  // State for filtering and pagination
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<'name' | 'region' | 'address' | 'featured' | 'updatedAt'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch the list of venues with pagination
  const { data: venuesData, isLoading, error, refetch } = api.venue.list.useQuery({
    page: currentPage,
    limit: itemsPerPage,
    sortField,
    sortDirection,
    query: searchQuery || undefined
  });

  // Mutation for toggling the featured status
  const toggleFeaturedMutation = api.venue.toggleFeatured.useMutation({
    onSuccess: () => {
      void refetch();
      // toast.success("Venue featured status updated");
    },
    onError: (error) => {
      console.error("Failed to update featured status:", error);
      // toast.error("Failed to update featured status");
    },
  });
  
  // Delete venue mutation
  const deleteVenueMutation = api.venue.delete.useMutation({
    onSuccess: () => {
      void refetch();
      // toast.success("Venue deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete venue:", error);
      // toast.error("Failed to delete venue");
    },
  });

  const handleToggleFeatured = (venue: Venue) => {
    if (!venue) return;
    toggleFeaturedMutation.mutate({ id: venue.id, isFeatured: !venue.isFeatured });
  };

  // Filter venues for featured-only filter (server handles sorting and search)
  const filterVenues = (venues: Venue[]): Venue[] => {
    if (!showFeaturedOnly) return venues;
    
    return venues.filter(venue => !!venue.isFeatured);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleDeleteVenue = (venueId: string) => {
    if (confirm("Are you sure you want to delete this venue? This action cannot be undone.")) {
      deleteVenueMutation.mutate({ id: venueId });
    }
  };
  
  // Handle column sort
  const handleSort = (field: 'name' | 'region' | 'address' | 'featured' | 'updatedAt') => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  if (isLoading) return <div className="p-4">Loading venues...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading venues: {error.message}</div>;

  // Process the venues data safely
  let venues: Venue[] = [];
  let totalCount = 0;
  let pageCount = 1;
  
  if (hasItems(venuesData)) {
    venues = filterVenues(venuesData.items ?? []);
    totalCount = venuesData.totalCount;
    pageCount = venuesData.pageCount;
  }
  
  const featuredCount = venues.filter(venue => venue.isFeatured).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Manage Venues / Gyms</h1>
        <Link href="/admin/venues/create" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg">](http://www.w3.org/2000/svg">)
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add New Venue
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-gray-700 font-medium mr-2">Featured Gyms:</span>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {featuredCount} of {totalCount}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Featured Filter */}
            <div className="flex items-center">
              <label htmlFor="featured-filter" className="text-sm text-gray-700 mr-2">
                Show Featured Only
              </label>
              <ToggleSwitch 
                enabled={showFeaturedOnly} 
                onChange={setShowFeaturedOnly} 
              />
            </div>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search venues..."
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
            <div className="flex items-center">
              <label htmlFor="items-per-page" className="text-sm text-gray-700 mr-2">
                Items per page:
              </label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm py-1 px-2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view - card layout */}
      <div className="lg:hidden space-y-4">
        {venues.map((venue) => (
          <div key={venue.id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{venue.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{venue.region?.name ?? 'N/A'}</p>
                <p className="text-sm text-gray-500 truncate max-w-xs">{venue.address}</p>
                {venue.updatedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Updated: {new Date(venue.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center mb-2">
                  <span className="text-sm text-gray-600 mr-2">Featured</span>
                  <ToggleSwitch
                    enabled={!!venue.isFeatured}
                    onChange={() => handleToggleFeatured(venue)}
                  />
                </div>
                <div className="flex space-x-3">
                  <Link href={`/admin/venues/${venue.id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDeleteVenue(venue.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view - table layout */}
      <div className="hidden lg:block overflow-x-auto shadow-sm rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Name
                {sortField === 'name' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('region')}
              >
                Region
                {sortField === 'region' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('address')}
              >
                Address
                {sortField === 'address' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('featured')}
              >
                Featured
                {sortField === 'featured' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('updatedAt')}
              >
                Last Updated
                {sortField === 'updatedAt' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {venues.map((venue) => (
              <tr 
                key={venue.id} 
                className={`${venue.isFeatured ? 'bg-indigo-50' : ''} hover:bg-gray-50 cursor-pointer`}
                onClick={() => router.push(`/admin/venues/${venue.id}/view`)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{venue.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venue.region?.name ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{venue.address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    enabled={!!venue.isFeatured}
                    onChange={() => handleToggleFeatured(venue)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {venue.updatedAt ? new Date(venue.updatedAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/admin/venues/${venue.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-3" onClick={(e) => e.stopPropagation()}>Edit</Link>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVenue(venue.id);
                    }} 
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {venues.length === 0 && (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No venues found</h3>
          {searchQuery && (
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
          )}
          {!searchQuery && showFeaturedOnly && (
            <p className="mt-1 text-sm text-gray-500">No featured venues yet. Toggle the switch to feature a venue.</p>
          )}
          {!searchQuery && !showFeaturedOnly && (
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new venue.</p>
          )}
        </div>
      )}
      
      {/* Pagination */}
      {venues.length > 0 && pageCount > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              &lt;
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (pageCount <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pageCount - 2) {
                pageNum = pageCount - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded-md ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pageCount}
              className={`px-3 py-1 rounded-md ${currentPage === pageCount ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              &gt;
            </button>
            <button
              onClick={() => handlePageChange(pageCount)}
              disabled={currentPage === pageCount}
              className={`px-3 py-1 rounded-md ${currentPage === pageCount ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Last
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}