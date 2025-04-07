"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

// Explicit fighter type definition
type FighterType = {
  id: string;
  name: string;
  nickname: string | null;
  weightClass: string | null;
  record: string | null;
  imageUrl: string | null;
  country: string | null;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Define the possible response shape from the fighters list query
type FightersResponse = FighterType[];

// Explicitly type the TRPC query result to prevent unsafe member access
/* 
const useFighterListQuery = () =>
  api.fighter.list.useQuery() as {
    data: FightersResponse | undefined;
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
  };
*/

// Simple Toggle Switch Component
function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`${
        enabled ? "bg-indigo-600" : "bg-gray-200"
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span
        aria-hidden="true"
        className={`${
          enabled ? "translate-x-5" : "translate-x-0"
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
}

export default function AdminFightersPage() {
  // Use the fighter list query directly instead of through a custom hook
  const { data: fighters = [], isLoading, error, refetch } = api.fighter.list.useQuery();

  // Mutation for toggling the featured status with safe error handling
  const toggleFeaturedMutation = api.fighter.toggleFeatured.useMutation({
    onSuccess: () => {
      void refetch(); // Refetch the list after successful update
      // Optionally, display a success message
    },
    onError: (err: unknown) => {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Unknown error";
      console.error("Failed to update featured status:", errorMessage);
      // Optionally, display an error message
    },
  });

  const handleToggleFeatured = (fighter: FighterType) => {
    toggleFeaturedMutation.mutate({
      id: fighter.id,
      isFeatured: !fighter.isFeatured,
    });
  };

  // Check loading/error states first
  if (isLoading) return <div className="p-4">Loading fighters...</div>;
  
  if (error) {
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "Error loading fighters";
    return (
      <div className="p-4 text-red-600">
        Error loading fighters: {errorMessage}
      </div>
    );
  }
  
  // Now check if fighters were found
  if (fighters.length === 0) return <div className="p-4">No fighters found.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Fighters</h1>
        <Link
          href="/admin/fighters/new"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          Add New Fighter
        </Link>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Record
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Featured
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fighters.map((fighter) => (
              <tr key={fighter.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {fighter.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {fighter.record ?? "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <ToggleSwitch
                    enabled={fighter.isFeatured}
                    onChange={() => handleToggleFeatured(fighter)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/admin/fighters/${fighter.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Edit
                  </Link>
                  {/* Add delete button/logic here if needed */}
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
