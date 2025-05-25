"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function ViewCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  // Query to get the course by ID
  const { data: course, error, isLoading } = api.trainingCourse.getById.useQuery(
    { id: courseId },
    {
      enabled: !!courseId,
    }
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          <p className="mt-4">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="rounded-lg bg-red-100 p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-800">Error Loading Course</h1>
          <p className="text-red-700">{error.message}</p>
          <Link 
            href="/admin/courses" 
            className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Return to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-4">
        <div className="rounded-lg bg-yellow-100 p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-yellow-800">Course Not Found</h1>
          <p className="text-yellow-700">The requested course could not be found.</p>
          <Link 
            href="/admin/courses" 
            className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Return to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Course Details</h1>
        <div className="flex space-x-3">
          <Link 
            href={`/admin/courses/${course.id}/edit`} 
            className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Edit Course
          </Link>
          <Link 
            href="/admin/courses" 
            className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Back to Courses
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main details */}
        <div className="col-span-2 rounded-lg bg-white p-6 shadow-md">
          <div className="mb-6 border-b pb-4">
            <h2 className="text-xl font-semibold">{course.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${course.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {course.isActive ? "Active" : "Inactive"}
              </span>
              {course.isFeatured && (
                <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                  Featured
                </span>
              )}
              {course.skillLevel && (
                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  {course.skillLevel}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-medium">Description</h3>
            <p className="text-gray-700">{course.description || "No description provided."}</p>
          </div>

          {/* Schedule */}
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-medium">Schedule & Duration</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p>{course.duration || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Schedule Details</p>
                <p>{course.scheduleDetails || "Not specified"}</p>
              </div>
            </div>
          </div>

          {/* Capacity and Price */}
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-medium">Enrollment Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Capacity</p>
                <p>{course.capacity || "Unlimited"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Price</p>
                <p className="text-lg font-semibold text-indigo-600">
                  ${course.price.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Images */}
          {course.imageUrls && course.imageUrls.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-medium">Images</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {course.imageUrls.map((url, index) => (
                  <div 
                    key={index} 
                    className={`relative rounded-lg border-2 ${index === course.primaryImageIndex ? 'border-indigo-500' : 'border-gray-200'}`}
                  >
                    <img 
                      src={url} 
                      alt={`Course image ${index + 1}`} 
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    {index === course.primaryImageIndex && (
                      <span className="absolute right-1 top-1 rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-800">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-medium">Details</h3>
          
          {/* Location */}
          <div className="mb-6 border-b pb-4">
            <h4 className="mb-2 text-sm font-medium text-gray-500">Location</h4>
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-500">Region</p>
              <p>{course.region?.name || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Venue</p>
              <p>{course.venue?.name || "Not specified"}</p>
            </div>
          </div>
          
          {/* Instructor */}
          <div className="mb-6 border-b pb-4">
            <h4 className="mb-2 text-sm font-medium text-gray-500">Instructor</h4>
            {course.instructor ? (
              <div className="flex items-center">
                {course.instructor.imageUrl && (
                  <img 
                    src={course.instructor.imageUrl} 
                    alt={course.instructor.name} 
                    className="mr-3 h-10 w-10 rounded-full object-cover"
                  />
                )}
                <p>{course.instructor.name}</p>
              </div>
            ) : (
              <p>No instructor assigned</p>
            )}
          </div>
          
          {/* System Details */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-500">System Details</h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-500">ID</p>
                <p className="text-sm">{course.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Slug</p>
                <p className="text-sm">{course.slug}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-sm">{new Date(course.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-sm">{new Date(course.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
