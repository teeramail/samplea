"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { useState, useMemo } from "react";
// import toast from "react-hot-toast"; // Optional

// Define the type for a single course based on the router output
type CourseType = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  isActive: boolean;
  isFeatured: boolean;
  region?: { name: string } | null;
  instructor?: { name: string } | null;
  venue?: { name: string } | null;
};

type SortField = 'title' | 'region' | 'instructor' | 'price' | 'isActive' | 'isFeatured';
type SortDirection = 'asc' | 'desc';

// Mobile-friendly toggle switch
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
      className={`${enabled ? "bg-indigo-600" : "bg-gray-300"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span className="sr-only">{enabled ? "Disable" : "Enable"}</span>
      <span
        className={`${enabled ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </button>
  );
}

// Sortable table header component
function SortableHeader({
  field,
  children,
  sortField,
  sortDirection,
  onSort,
}: {
  field: SortField;
  children: React.ReactNode;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = sortField === field;
  
  return (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          <svg 
            className={`h-3 w-3 ${isActive && sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-400'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
          </svg>
          <svg 
            className={`h-3 w-3 -mt-1 ${isActive && sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-400'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </th>
  );
}

export default function AdminCoursesPage() {
  // State for filtering and sorting
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch the list of training courses with includeInactive: true for admin
  const {
    data: coursesData,
    isLoading,
    error,
    refetch,
  } = api.trainingCourse.list.useQuery({ includeInactive: true });

  // Mutation for toggling the featured status
  const toggleFeaturedMutation = api.trainingCourse.toggleFeatured.useMutation({
    onSuccess: () => {
      void refetch();
      // toast.success("Course featured status updated");
    },
    onError: (error) => {
      console.error("Failed to update featured status:", error);
      // toast.error("Failed to update featured status");
    },
  });

  const handleToggleFeatured = (course: CourseType) => {
    if (!course) return;
    toggleFeaturedMutation.mutate({
      id: course.id,
      isFeatured: !course.isFeatured,
    });
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    const allCourses = coursesData?.items || [];
    
    // Filter courses
    let filtered = allCourses.filter((course) => {
      const matchesSearch =
        !searchQuery || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.region?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFeatured = !showFeaturedOnly || course.isFeatured;

      return matchesSearch && matchesFeatured;
    });

    // Sort courses
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'region':
            aValue = a.region?.name?.toLowerCase() || '';
            bValue = b.region?.name?.toLowerCase() || '';
            break;
          case 'instructor':
            aValue = a.instructor?.name?.toLowerCase() || '';
            bValue = b.instructor?.name?.toLowerCase() || '';
            break;
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'isActive':
            aValue = a.isActive ? 1 : 0;
            bValue = b.isActive ? 1 : 0;
            break;
          case 'isFeatured':
            aValue = a.isFeatured ? 1 : 0;
            bValue = b.isFeatured ? 1 : 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [coursesData?.items, searchQuery, showFeaturedOnly, sortField, sortDirection]);

  if (isLoading) return <div className="p-4">Loading courses...</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        Error loading courses: {error.message}
      </div>
    );

  // Adjust based on list procedure return type
  const allCourses = coursesData?.items || [];
  const courses = filteredAndSortedCourses;
  const featuredCount = allCourses.filter((course) => course.isFeatured).length;

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Manage Training Courses
        </h1>
        <Link
          href="/admin/courses/create"
          className="flex items-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
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
          Add New Course
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center">
            <span className="mr-2 font-medium text-gray-700">
              Featured Courses:
            </span>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
              {featuredCount} of {allCourses.length}
            </span>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {/* Featured Filter */}
            <div className="flex items-center">
              <label
                htmlFor="featured-filter"
                className="mr-2 text-sm text-gray-700"
              >
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
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-md border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view - card layout */}
      <div className="space-y-4 lg:hidden">
        {courses.map((course) => (
          <div key={course.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {course.title}
                </h3>
                <p className="mb-2 text-sm text-gray-500">
                  {course.region?.name ?? "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  {course.instructor?.name
                    ? `Instructor: ${course.instructor.name}`
                    : ""}
                </p>
                <p className="text-sm text-gray-500">
                  {course.price ? `Price: ${course.price.toFixed(2)}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className="mb-2 flex items-center">
                  <span className="mr-2 text-sm text-gray-600">Featured</span>
                  <ToggleSwitch
                    enabled={!!course.isFeatured}
                    onChange={() => handleToggleFeatured(course)}
                  />
                </div>
                <div className="mt-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${course.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {course.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <Link
                  href={`/admin/courses/${course.id}/edit`}
                  className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-900"
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view - table layout */}
      <div className="hidden overflow-x-auto rounded-lg shadow-sm lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                field="title"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Title
              </SortableHeader>
              <SortableHeader
                field="region"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Region
              </SortableHeader>
              <SortableHeader
                field="instructor"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Instructor
              </SortableHeader>
              <SortableHeader
                field="price"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Price
              </SortableHeader>
              <SortableHeader
                field="isActive"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                <div className="text-center">Active</div>
              </SortableHeader>
              <SortableHeader
                field="isFeatured"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                <div className="text-center">Featured</div>
              </SortableHeader>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {courses.map((course) => (
              <tr
                key={course.id}
                className={`${course.isFeatured ? "bg-indigo-50" : ""} hover:bg-gray-50 cursor-pointer`}
                onClick={() => window.location.href = `/admin/courses/${course.id}/view`}
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {course.title}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {course.region?.name ?? "N/A"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {course.instructor?.name ?? "N/A"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {course.price ? course.price.toFixed(2) : "N/A"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${course.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {course.isActive ? "Yes" : "No"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">
                  <ToggleSwitch
                    enabled={!!course.isFeatured} // Use !! to ensure boolean
                    onChange={() => handleToggleFeatured(course)}
                  />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="mr-3 text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>
                  {/* Add delete button/logic here */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {courses.length === 0 && (
        <div className="rounded-lg bg-white py-8 text-center shadow-sm">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            ></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No courses found
          </h3>
          {searchQuery && (
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter.
            </p>
          )}
          {!searchQuery && showFeaturedOnly && (
            <p className="mt-1 text-sm text-gray-500">
              No featured courses yet. Toggle the switch to feature a course.
            </p>
          )}
          {!searchQuery && !showFeaturedOnly && (
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new course.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
