"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

import SortableHeader from "~/components/admin/SortableHeader";
import Pagination from "~/components/admin/Pagination";
import PageSizeSelector from "~/components/admin/PageSizeSelector";

export default function EventTemplatesListPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>("templateName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInputValue, setSearchInputValue] = useState<string>("");

  // Fetch templates with pagination, sorting, and filtering
  const { data: templatesData, isLoading, error, refetch } = api.eventTemplate.list.useQuery({
    page: currentPage,
    limit: itemsPerPage,
    sortField,
    sortDirection,
    query: searchQuery || undefined
  });

  // Handle sort click
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle search
  const handleSearch = () => {
    setSearchQuery(searchInputValue);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle search input keypress
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle row click to navigate to detail view
  const handleRowClick = (id: string) => {
    router.push(`/admin/event-templates/${id}/edit`);
  };

  // Toggle template active status
  const toggleActiveMutation = api.eventTemplate.toggleActive.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleToggleActive = (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    toggleActiveMutation.mutate({ id, isActive: !currentStatus });
  };

  // Calculate pagination values
  const pageCount = templatesData?.meta.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Event Templates</h1>
        <div className="flex space-x-2">
          <Link 
            href="/admin/event-templates/create"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
          >
            Create New Template
          </Link>
          <Link 
            href="/admin/event-templates/generate"
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium"
          >
            Generate Events
          </Link>
        </div>
      </div>

      {/* Search and filter controls */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative">
              <input
                type="text"
                placeholder="Search templates..."
                className="w-full p-2 border rounded-md pl-10"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <div className="absolute left-3 top-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <button
                className="absolute right-3 top-2 text-sm text-blue-600 hover:text-blue-800"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>
          <div>
            <PageSizeSelector 
              value={itemsPerPage} 
              onChange={handlePageSizeChange} 
              options={[10, 20, 50, 100]} 
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">Error loading templates</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader
                    label="Template Name"
                    field="templateName"
                    currentSortField={sortField}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Venue"
                    field="venueName"
                    currentSortField={sortField}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Region"
                    field="regionName"
                    currentSortField={sortField}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Active"
                    field="isActive"
                    currentSortField={sortField}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templatesData?.items.length ? (
                  templatesData.items.map((template: any) => (
                    <tr 
                      key={template.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(template.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{template.templateName}</div>
                        <div className="text-xs text-gray-500">
                          {template.recurringDaysOfWeek.map((day: number) => [
                            'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
                          ][day]).join(', ')} at {template.defaultStartTime.slice(0, 5)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{template.venue?.name ?? "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{template.region?.name ?? "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={(e) => handleToggleActive(template.id, template.isActive, e)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${template.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                        >
                          {template.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          href={`/admin/event-templates/${template.id}/edit`} 
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No event templates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {templatesData && templatesData.items.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, templatesData.meta.totalItems)} of {templatesData.meta.totalItems} templates
            </div>
            <Pagination 
              currentPage={currentPage} 
              pageCount={pageCount} 
              onPageChange={handlePageChange} 
            />
          </div>
        )}
      </div>
    </div>
  );
}