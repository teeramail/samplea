"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import Image from "next/image";

// Define instructor type
interface InstructorType {
  id: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  imageUrls: string[] | null;
  expertise: string[] | null;
  updatedAt: Date;
}

export default function AdminInstructorsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Fetch instructors
  const { data, isLoading, error, refetch } = api.instructor.list.useQuery({
    query: search || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  if (isLoading) return <div className="p-4">Loading instructors...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error.message}</div>;

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Instructors</h1>
        <Link
          href="/admin/instructors/create"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          + New Instructor
        </Link>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search instructors..."
            className="rounded-l-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-r-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Search
          </button>
        </form>
      </div>

      {!data?.items.length ? (
        <div className="text-center py-8">
          No instructors found. {search && <button onClick={() => setSearch("")} className="text-indigo-600 hover:underline">Clear search</button>}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Photo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expertise
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Images
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((instructor: InstructorType) => {
                  const formattedDate = new Date(instructor.updatedAt).toLocaleDateString();
                  const displayImage = instructor.thumbnailUrl || instructor.imageUrl;
                  const galleryCount = instructor.imageUrls?.length || 0;
                  
                  return (
                    <tr key={instructor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative h-12 w-12">
                          {displayImage ? (
                            <Image
                              src={displayImage}
                              alt={instructor.name}
                              fill
                              className="object-cover rounded-md"
                              sizes="(max-width: 48px) 100vw, 48px"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No photo</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{instructor.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {instructor.bio || "No bio provided"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {instructor.expertise && instructor.expertise.length > 0 ? (
                            instructor.expertise.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No expertise listed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {displayImage && <span className="text-green-600">✓ Thumbnail</span>}
                          {displayImage && galleryCount > 0 && <br />}
                          {galleryCount > 0 && (
                            <span className="text-blue-600">
                              {galleryCount} gallery image{galleryCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {!displayImage && galleryCount === 0 && (
                            <span className="text-gray-400">No images</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/instructors/${instructor.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/instructors/${instructor.id}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing {data.items.length} instructor{data.items.length !== 1 ? 's' : ''}
            {data.meta?.totalCount && ` of ${data.meta.totalCount} total`}
          </div>
        </>
      )}
    </div>
  );
} 