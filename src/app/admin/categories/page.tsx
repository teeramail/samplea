"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

// Define the interface for a category
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  imageUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { data, isLoading, refetch } = api.category.list.useQuery({
    page,
    limit: itemsPerPage,
    sortField,
    sortDirection,
    search: search.length > 0 ? search : undefined,
  });

  const deleteCategory = api.category.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    // Prevent row click event if delete button is clicked
    if (e) {
      e.stopPropagation();
    }
    
    if (window.confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      await deleteCategory.mutate({ id });
    }
  };
  
  // Handle row click to navigate to edit page
  const handleRowClick = (id: string) => {
    router.push(`/admin/categories/edit/${id}`);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setPage(1); // Reset to first page when changing items per page
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      // Default to descending for date fields, ascending for others
      setSortDirection(field === "updatedAt" || field === "createdAt" ? "desc" : "asc");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col justify-between sm:flex-row">
        <h1 className="mb-4 text-2xl font-bold sm:mb-0">Product Categories</h1>
        <Link
          href="/admin/categories/create"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create New Category
        </Link>
      </div>

      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        {/* Search */}
        <div className="w-full sm:w-1/2">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <button
              type="submit"
              className="rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Search
            </button>
          </form>
        </div>
        
        {/* Items per page selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
            Show:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                <button
                  className="flex items-center"
                  onClick={() => handleSort("name")}
                >
                  Category
                  {sortField === "name" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </button>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Thumbnail
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                <button
                  className="flex items-center"
                  onClick={() => handleSort("updatedAt")}
                >
                  Last Updated
                  {sortField === "updatedAt" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </button>
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
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No categories found
                </td>
              </tr>
            ) : (
              data?.items.map((category) => (
                <tr 
                  key={category.id} 
                  onClick={() => handleRowClick(category.id)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <span className="text-sm text-gray-500">{category.slug}</span>
                      {category.description && (
                        <span className="mt-1 text-sm text-gray-500">
                          {category.description.length > 50
                            ? `${category.description.substring(0, 50)}...`
                            : category.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {category.thumbnailUrl ? (
                      <div className="h-12 w-12 overflow-hidden rounded-md">
                        <img
                          src={category.thumbnailUrl}
                          alt={category.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No thumbnail</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(category.updatedAt).toLocaleDateString()}
                    <br />
                    <span className="text-xs text-gray-400">
                      {new Date(category.updatedAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/admin/categories/edit/${category.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={(e) => handleDelete(category.id, e)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className={`rounded-md px-3 py-1 ${page === 1 ? "cursor-not-allowed text-gray-400" : "text-gray-600 hover:bg-gray-100"}`}
            >
              First
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className={`rounded-md px-3 py-1 ${page === 1 ? "cursor-not-allowed text-gray-400" : "text-gray-600 hover:bg-gray-100"}`}
            >
              &lt;
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, data.meta.totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (data.meta.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= data.meta.totalPages - 2) {
                pageNum = data.meta.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`rounded-md px-3 py-1 ${page === pageNum ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === data.meta.totalPages}
              className={`rounded-md px-3 py-1 ${page === data.meta.totalPages ? "cursor-not-allowed text-gray-400" : "text-gray-600 hover:bg-gray-100"}`}
            >
              &gt;
            </button>
            <button
              onClick={() => setPage(data.meta.totalPages)}
              disabled={page === data.meta.totalPages}
              className={`rounded-md px-3 py-1 ${page === data.meta.totalPages ? "cursor-not-allowed text-gray-400" : "text-gray-600 hover:bg-gray-100"}`}
            >
              Last
            </button>
          </nav>
        </div>
      )}
      
      <div className="mt-4 text-center text-sm text-gray-700">
        {data && (
          <span>
            Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, data.meta.totalItems)} of {data.meta.totalItems} categories
          </span>
        )}
      </div>
    </div>
  );
}
