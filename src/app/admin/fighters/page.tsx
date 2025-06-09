"use client";

import Link from "next/link";
import Image from "next/image";
import { api } from "~/trpc/react";

// Explicit fighter type definition
type FighterType = {
  id: string;
  name: string;
  nickname: string | null;
  weightClass: string | null;
  record: string | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  country: string | null;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Define the possible response shape from the fighters list query
type FightersResponse = FighterType[];

// ToggleSwitch component
type ToggleSwitchProps = {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
};

function ToggleSwitch({ enabled, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      className={`${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      role="switch"
      aria-checked={enabled}
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
    >
      <span className="sr-only">Toggle featured</span>
      <span
        aria-hidden="true"
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
}

export default function AdminFightersPage() {
  // Use the fighter list query directly instead of through a custom hook
  const {
    data: fighters = [],
    isLoading,
    error,
    refetch,
  } = api.fighter.list.useQuery();

  // Mutation for toggling the featured status with safe error handling
  const toggleFeaturedMutation = api.fighter.toggleFeatured.useMutation({
    onSuccess: () => {
      void refetch(); // Refetch the list after successful update
    },
    onError: (err: unknown) => {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Unknown error";
      console.error("Failed to update featured status:", errorMessage);
    },
  });

  // Delete fighter mutation
  const deleteFighter = api.fighter.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
    onError: (err: unknown) => {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Unknown error";
      console.error("Failed to delete fighter:", errorMessage);
    },
  });

  const handleToggleFeatured = (fighter: FighterType) => {
    toggleFeaturedMutation.mutate({
      id: fighter.id,
      isFeatured: !fighter.isFeatured,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this fighter?")) {
      deleteFighter.mutate({ id });
    }
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
  if (fighters.length === 0)
    return <div className="p-4">No fighters found.</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Manage Fighters</h1>
        <Link
          href="/admin/fighters/create"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add New Fighter
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Image
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Weight Class
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Record
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Country
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Featured
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {fighters.map((fighter) => (
              <tr key={fighter.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="relative h-12 w-12">
                    {fighter.thumbnailUrl || fighter.imageUrl ? (
                      <Image
                        src={fighter.thumbnailUrl || fighter.imageUrl || ""}
                        alt={fighter.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-xs text-gray-500">No image</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {fighter.name}
                  </div>
                  {fighter.nickname && (
                    <div className="text-sm text-gray-500">
                      "{fighter.nickname}"
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {fighter.weightClass ?? "N/A"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {fighter.record ?? "N/A"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {fighter.country ?? "N/A"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">
                  <ToggleSwitch
                    enabled={fighter.isFeatured}
                    onChange={() => handleToggleFeatured(fighter)}
                    disabled={toggleFeaturedMutation.isPending}
                  />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <Link
                    href={`/admin/fighters/${fighter.id}/edit`}
                    className="mr-3 text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(fighter.id)}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteFighter.isPending}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {fighters.length === 0 && (
        <div className="py-4 text-center text-gray-500">No fighters found.</div>
      )}
    </div>
  );
}
