"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default function InstructorViewPage({ params }: Props) {
  const router = useRouter();
  const { data: instructor, isLoading, error } = api.instructor.getById.useQuery({
    id: params.id,
  });

  if (isLoading) return <div className="p-4">Loading instructor...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error.message}</div>;
  if (!instructor) return <div className="p-4">Instructor not found</div>;

  const displayImage = instructor.thumbnailUrl || instructor.imageUrl;
  const galleryImages = instructor.imageUrls || [];

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Instructor Details</h1>
        <div className="flex gap-2">
          <Link
            href={`/admin/instructors/${instructor.id}/edit`}
            className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Edit
          </Link>
          <button
            onClick={() => router.back()}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Basic Information */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-lg font-medium text-gray-900">{instructor.name}</p>
              </div>

              {instructor.bio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{instructor.bio}</p>
                </div>
              )}

              {instructor.expertise && instructor.expertise.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expertise</label>
                  <div className="flex flex-wrap gap-2">
                    {instructor.expertise.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <label className="block font-medium">Created</label>
                  <p>{new Date(instructor.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block font-medium">Last Updated</label>
                  <p>{new Date(instructor.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Images */}
          {galleryImages.length > 0 && (
            <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Gallery Images</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {galleryImages.map((imageUrl, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={imageUrl}
                      alt={`${instructor.name} - Image ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Image */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Profile Image</h2>
            <div className="flex justify-center">
              {displayImage ? (
                <div className="relative h-48 w-48">
                  <Image
                    src={displayImage}
                    alt={instructor.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="192px"
                  />
                </div>
              ) : (
                <div className="h-48 w-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No profile image</span>
                </div>
              )}
            </div>
          </div>

          {/* Image Summary */}
          <div className="rounded-lg border bg-gray-50 p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Image Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Profile Image:</span>
                <span className={displayImage ? "text-green-600" : "text-gray-400"}>
                  {displayImage ? "✓ Uploaded" : "Not uploaded"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gallery Images:</span>
                <span className={galleryImages.length > 0 ? "text-green-600" : "text-gray-400"}>
                  {galleryImages.length > 0 ? `${galleryImages.length} image(s)` : "No images"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/admin/instructors/${instructor.id}/edit`}
                className="block w-full rounded bg-indigo-600 px-4 py-2 text-center text-white hover:bg-indigo-700"
              >
                Edit Instructor
              </Link>
              <Link
                href="/admin/instructors"
                className="block w-full rounded border border-gray-300 bg-white px-4 py-2 text-center text-gray-700 hover:bg-gray-50"
              >
                Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 