'use client'; // This needs to be a client component to use hooks

import Link from "next/link";
import { api } from "~/trpc/react";
import { useState, useEffect } from "react"; // For handling toggle state
// Optional: Add a toast library for feedback (e.g., react-hot-toast)
// import toast from "react-hot-toast";

// Define the type for a single fighter based on the router output
type FighterType = ReturnType<typeof api.fighter.list.useQuery>['data'] extends (infer T)[] ? T : never;

// Simple Toggle Switch Component (or use a library like Headless UI)
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

export default function AdminFightersPage() {
  // Fetch the list of fighters
  const { data: fightersData, isLoading, error, refetch } = api.fighter.list.useQuery(); // Assuming a list procedure exists

  // Mutation for toggling the featured status
  const toggleFeaturedMutation = api.fighter.toggleFeatured.useMutation({
    onSuccess: () => {
      refetch(); // Refetch the list after successful update
      // toast.success("Fighter featured status updated"); // Optional success message
    },
    onError: (error) => {
      console.error("Failed to update featured status:", error);
      // toast.error("Failed to update featured status"); // Optional error message
    },
  });

  const handleToggleFeatured = (fighter: FighterType) => {
    toggleFeaturedMutation.mutate({ id: fighter.id, isFeatured: !fighter.isFeatured });
  };

  if (isLoading) return <div className="p-4">Loading fighters...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading fighters: {error.message}</div>;
  if (!fightersData) return <div className="p-4">No fighters found.</div>;

  // Use fightersData.items if your list procedure returns { items, nextCursor }
  const fighters = fightersData.items ?? fightersData; // Adjust based on your list procedure's return type

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Fighters</h1>
        <Link href="/admin/fighters/new" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
          Add New Fighter
        </Link>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record</th>
              {/* Add other relevant columns */}
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fighters.map((fighter) => (
              <tr key={fighter.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fighter.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fighter.record ?? 'N/A'}</td>
                {/* Add other data cells */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <ToggleSwitch
                    enabled={fighter.isFeatured}
                    onChange={() => handleToggleFeatured(fighter)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/admin/fighters/${fighter.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</Link>
                  {/* Add delete button/logic here */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {fighters.length === 0 && (
          <div className="text-center py-4 text-gray-500">No fighters found.</div>
      )}
    </div>
  );
} 