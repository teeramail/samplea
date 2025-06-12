"use client";

import Link from "next/link";
import Image from "next/image";
import { api } from "~/trpc/react";
import { useState } from "react";
import Pagination from "~/components/admin/Pagination";
import SortableHeader from "~/components/admin/SortableHeader";
import PageSizeSelector from "~/components/admin/PageSizeSelector";

// Explicit fighter type definition
type FighterType = {
  id: string;
  name: string;
  nickname: string | null;
  weightClass: string | null;
  record: string | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  imageUrls: string[] | null;
  country: string | null;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Define the response type from the API
interface FightersResponse {
  items?: FighterType[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

// Type guard to check if the response has items property
function hasItems(
  data: FighterType[] | FightersResponse | undefined,
): data is FightersResponse {
  return !!data && "items" in data;
}

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
  // State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<
    "name" | "weightClass" | "country" | "record" | "createdAt" | "updatedAt"
  >("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // Use the new paginated fighter list query
  const {
    data: fightersData,
    isLoading,
    error,
    refetch,
  } = api.fighter.list.useQuery({
    page: currentPage,
    limit: itemsPerPage,
    sortField,
    sortDirection,
    query: searchQuery ?? undefined,
    featuredOnly: showFeaturedOnly,
  });

  // Get the query client for manual refetching
  const utils = api.useUtils();

  // Mutation for toggling the featured status with safe error handling
  const toggleFeaturedMutation = api.fighter.toggleFeatured.useMutation({
    onSuccess: () => {
      void utils.fighter.list.invalidate(); // Invalidate the paginated list
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
      void utils.fighter.list.invalidate(); // Invalidate the paginated list
    },
    onError: (err: unknown) => {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Unknown error";
      console.error("Failed to delete fighter:", errorMessage);
    },
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
  const handleSort = (
    field: "name" | "weightClass" | "country" | "record" | "createdAt" | "updatedAt",
  ) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

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

  // Process the fighters data safely
  let fighters: FighterType[] = [];
  let totalCount = 0;
  let pageCount = 1;

  if (hasItems(fightersData)) {
    fighters = fightersData.items ?? [];
    totalCount = fightersData.totalCount;
    pageCount = fightersData.pageCount;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manage Fighters</h1>
        <Link
          href="/admin/fighters/create"
          className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          Add New Fighter
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="mr-2 font-medium text-gray-700">
                Total Fighters:
              </span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                {totalCount}
              </span>
            </div>
            
            {/* Featured Only Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured-only"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <label htmlFor="featured-only" className="ml-2 text-sm text-gray-700">
                Featured only
              </label>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search fighters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-md border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>

            {/* Page Size Selector */}
            <PageSizeSelector
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </div>
      </div>

      {/* Fighters Table */}
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
              <SortableHeader
                label="Name"
                field="name"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Weight Class"
                field="weightClass"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Record"
                field="record"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Country"
                field="country"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={handleSort}
              />
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
            {fighters.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No fighters found.
                </td>
              </tr>
            ) : (
              fighters.map((fighter) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
