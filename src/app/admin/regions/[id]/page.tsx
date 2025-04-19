import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { regions } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import ImageWithFallback from "~/app/_components/ImageWithFallback";

export default async function RegionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch region with venues
  const region = await db.query.regions.findFirst({
    where: eq(regions.id, id),
    with: {
      venues: true,
    },
  });

  if (!region) {
    notFound();
  }

  // Helper to get primary image URL
  const getPrimaryImageUrl = (): string | null => {
    if (!region.imageUrls || region.imageUrls.length === 0) {
      return null;
    }

    const primaryIndex = region.primaryImageIndex ?? 0;
    return (
      region.imageUrls[
        primaryIndex < region.imageUrls.length ? primaryIndex : 0
      ] || null
    );
  };

  // Helper to check if image is primary
  const isPrimaryImage = (index: number): boolean => {
    return index === (region.primaryImageIndex ?? 0);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{region.name}</h1>
            {region.description && (
              <p className="mt-1 text-gray-600">{region.description}</p>
            )}
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/admin/regions/${region.id}/edit`}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Edit Region
            </Link>
            <Link
              href="/admin/regions"
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
            >
              Back to Regions
            </Link>
          </div>
        </div>

        {/* Region Images */}
        {region.imageUrls && region.imageUrls.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-lg border">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h3 className="text-lg font-medium text-gray-900">
                Region Images
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {region.imageUrls.map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <div
                      className={`overflow-hidden rounded-lg border-2 ${isPrimaryImage(index) ? "border-blue-500" : "border-gray-200"}`}
                    >
                      <ImageWithFallback
                        src={imageUrl || null}
                        alt={`${region.name} - Image ${index + 1}`}
                        fallbackSrc="https://via.placeholder.com/800x480?text=Image+Not+Found"
                        className="h-48 w-full object-cover"
                      />
                    </div>
                    {isPrimaryImage(index) && (
                      <div className="absolute left-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs text-white">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
            <h3 className="text-lg font-medium text-gray-900">
              Venues in {region.name}
            </h3>
            <Link
              href="/admin/venues/create"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add New Venue
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Address
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Capacity
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {region.venues && region.venues.length > 0 ? (
                  region.venues.map((venue) => (
                    <tr key={venue.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {venue.name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {venue.address}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {venue.capacity ?? "N/A"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <Link
                          href={`/admin/venues/${venue.id}`}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/venues/${venue.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No venues in this region yet.{" "}
                      <Link
                        href="/admin/venues/create"
                        className="text-blue-600 hover:underline"
                      >
                        Add a venue
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h3 className="text-lg font-medium text-gray-900">
              Region Information
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Region Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{region.name}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">
                  Description
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {region.description ?? "No description available"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
