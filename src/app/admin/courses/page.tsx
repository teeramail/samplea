'use client';

import Link from "next/link";
import { api } from "~/trpc/react";
// import toast from "react-hot-toast"; // Optional

// Define the type for a single course based on the router output
type CourseType = ReturnType<typeof api.trainingCourse.list.useQuery>['data'] extends { items: (infer T)[] } ? T : never;

// Reuse or import the ToggleSwitch component from the fighters page
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

export default function AdminCoursesPage() {
  // Fetch the list of training courses
  const { data: coursesData, isLoading, error, refetch } = api.trainingCourse.list.useQuery(); // Ensure list procedure exists

  // Mutation for toggling the featured status
  const toggleFeaturedMutation = api.trainingCourse.toggleFeatured.useMutation({
    onSuccess: () => {
      refetch();
      // toast.success("Course featured status updated");
    },
    onError: (error) => {
      console.error("Failed to update featured status:", error);
      // toast.error("Failed to update featured status");
    },
  });

  const handleToggleFeatured = (course: CourseType) => {
    if (!course) return;
    toggleFeaturedMutation.mutate({ id: course.id, isFeatured: !course.isFeatured });
  };

  if (isLoading) return <div className="p-4">Loading courses...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading courses: {error.message}</div>;
  
  // Adjust based on list procedure return type ({ items, nextCursor } or just array)
  const courses = coursesData?.items ?? coursesData ?? [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Training Courses</h1>
        <Link href="/admin/courses/new" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
          Add New Course
        </Link>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.region?.name ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.instructor?.name ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.price ? course.price.toFixed(2) : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {/* Optional: Add toggle for isActive if needed */}
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {course.isActive ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <ToggleSwitch
                    enabled={!!course.isFeatured} // Use !! to ensure boolean
                    onChange={() => handleToggleFeatured(course)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/admin/courses/${course.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</Link>
                  {/* Add delete button/logic here */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       {courses.length === 0 && (
          <div className="text-center py-4 text-gray-500">No courses found.</div>
      )}
    </div>
  );
} 