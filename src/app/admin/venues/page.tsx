'use client';

import Link from "next/link";
import { api } from "~/trpc/react";
// import toast from "react-hot-toast"; // Optional

// Define the type for a single venue based on the router output
type VenueType = ReturnType<typeof api.venue.list.useQuery>['data'] extends (infer T)[] ? T : never; // Adjust if list returns { items, ... }

// Reuse or import the ToggleSwitch component
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <button
      type="button"
      className={`${enabled ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span
        aria-hidden="true"
        className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
}

export default function AdminVenuesPage() {
  // Fetch the list of venues
  const { data: venuesData, isLoading, error, refetch } = api.venue.list.useQuery(); // Ensure list procedure exists

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

  const handleToggleFeatured = (venue: VenueType) => {
    if (!venue) return;
    toggleFeaturedMutation.mutate({ id: venue.id, isFeatured: !venue.isFeatured });
  };

  if (isLoading) return <div className="p-4">Loading venues...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading venues: {error.message}</div>;
  
  // Adjust based on list procedure return type ({ items, nextCursor } or just array)
  const venues = venuesData?.items ?? venuesData ?? [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Venues / Gyms</h1>
        <Link href="/admin/venues/new" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
          Add New Venue
        </Link>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
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
              <tr key={venue.id}>
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
          <div className="text-center py-4 text-gray-500">No venues found.</div>
      )}
    </div>
  );
} 