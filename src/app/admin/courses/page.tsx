'use client';

import Link from "next/link";
import { api } from "~/trpc/react";
import { useState } from "react";
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

export default function AdminCoursesPage() {
  // State for filtering
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch the list of training courses
  const { data: coursesData, isLoading, error, refetch } = api.trainingCourse.list.useQuery(); 

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
  
  // Filter courses based on search and featured filter
  const filterCourses = (courses: CourseType[]) => {
    return courses.filter(course => {
      const matchesSearch = !searchQuery || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (course.region?.name && course.region.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFeatured = !showFeaturedOnly || course.isFeatured;
      
      return matchesSearch && matchesFeatured;
    });
  };

  if (isLoading) return <div className="p-4">Loading courses...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading courses: {error.message}</div>;
  
  // Adjust based on list procedure return type
  const allCourses = coursesData?.items || [];
  const courses = filterCourses(allCourses);
  const featuredCount = allCourses.filter(course => course.isFeatured).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Manage Training Courses</h1>
        <Link href="/admin/courses/create" className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add New Course
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-gray-700 font-medium mr-2">Featured Courses:</span>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {featuredCount} of {allCourses.length}
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
                placeholder="Search courses..."
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
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{course.region?.name ?? 'N/A'}</p>
                <p className="text-sm text-gray-500">{course.instructor?.name ? `Instructor: ${course.instructor.name}` : ''}</p>
                <p className="text-sm text-gray-500">{course.price ? `Price: ${course.price.toFixed(2)}` : ''}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center mb-2">
                  <span className="text-sm text-gray-600 mr-2">Featured</span>
                  <ToggleSwitch
                    enabled={!!course.isFeatured}
                    onChange={() => handleToggleFeatured(course)}
                  />
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${course.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <Link href={`/admin/courses/${course.id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium mt-2">
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
              <tr key={course.id} className={`${course.isFeatured ? 'bg-indigo-50' : ''} hover:bg-gray-50`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.region?.name ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.instructor?.name ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.price ? course.price.toFixed(2) : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
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
         <div className="text-center py-8 bg-white rounded-lg shadow-sm">
           <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
           </svg>
           <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
           {searchQuery && (
             <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
           )}
           {!searchQuery && showFeaturedOnly && (
             <p className="mt-1 text-sm text-gray-500">No featured courses yet. Toggle the switch to feature a course.</p>
           )}
           {!searchQuery && !showFeaturedOnly && (
             <p className="mt-1 text-sm text-gray-500">Get started by adding a new course.</p>
           )}
         </div>
      )}
    </div>
  );
} 