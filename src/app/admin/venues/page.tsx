'use client';

import Link from "next/link";
import { api } from "~/trpc/react";
import { useState } from "react";
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
  // Add other properties as needed
}

// Define the response type from the API
interface VenuesResponse {
  items?: Venue[];
  nextCursor?: string;
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
  // State for filtering
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch the list of venues
  const { data: venuesData, isLoading, error, refetch } = api.venue.list.useQuery();

  // Mutation for toggling the featured status
  const toggleFeaturedMutation = api.venue.toggleFeatured.useMutation({
    onSuccess: () => {
      refetch();
      // toast.success("Venue featured status updated");
    },
    onError: (error) => {
      console.error("Failed to update featured status:", error);
      // toast.error("Failed to update featured status");
    },
  });

  const handleToggleFeatured = (venue: Venue) => {
    if (!venue) return;
    toggleFeaturedMutation.mutate({ id: venue.id, isFeatured: !venue.isFeatured });
  };

  // Filter venues based on search and featured filter
  const filterVenues = (venues: Venue[]): Venue[] => {
    return venues.filter((venue) => {
      const matchesSearch = searchQuery === '' || 
        (venue.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (venue.region?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      const matchesFeatured = !showFeaturedOnly || !!venue.isFeatured;
      
      return matchesSearch && matchesFeatured;
    });
  };

  if (isLoading) return <div className="p-4">Loading venues...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading venues: {error.message}</div>;
  
  // Process the venues data safely
  let allVenues: Venue[] = [];
  if (hasItems(venuesData)) {
    allVenues = venuesData.items ?? [];
  } else if (Array.isArray(venuesData)) {
    allVenues = venuesData;
  }
  
  const venues = filterVenues(allVenues);
  const featuredCount = allVenues.filter(venue => venue.isFeatured).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Manage Venues / Gyms</h1>
        <Link href="/admin/venues/new" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              {featuredCount} of {allVenues.length}
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
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center mb-2">
                  <span className="text-sm text-gray-600 mr-2">Featured</span>
                  <ToggleSwitch
                    enabled={!!venue.isFeatured}
                    onChange={() => handleToggleFeatured(venue)}
                  />
                </div>
                <Link href={`/admin/venues/${venue.id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                  Edit
                </Link>
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {venues.map((venue) => (
              <tr key={venue.id} className={`${venue.isFeatured ? 'bg-indigo-50' : ''} hover:bg-gray-50`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{venue.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venue.region?.name ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{venue.address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <ToggleSwitch
                    enabled={!!venue.isFeatured} // Use !! to ensure boolean
                    onChange={() => handleToggleFeatured(venue)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/admin/venues/${venue.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</Link>
                  {/* Add delete button/logic here */}
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
    </div>
  );
} 