import Link from "next/link";
import { db } from "~/server/db";
import ImageWithFallback from "~/app/_components/ImageWithFallback";

export default async function RegionsPage() {
  // Get all regions
  const allRegions = await db.query.regions.findMany({
    orderBy: (regions, { asc }) => [asc(regions.name)],
  });

  // Helper function to get primary image URL
  const getPrimaryImageUrl = (
    region: (typeof allRegions)[number],
  ): string | null => {
    if (!region.imageUrls || (region.imageUrls && region.imageUrls.length === 0)) {
      return null;
    }

    const primaryIndex = region.primaryImageIndex ?? 0;
    return (
      region.imageUrls[
        primaryIndex < region.imageUrls.length ? primaryIndex : 0
      ] || null
    );
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Regions</h1>
      <p className="mb-8 max-w-3xl text-gray-600">
        Browse Muay Thai events by region. Select a region to see all upcoming
        events in that location.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {allRegions.map((region) => {
          const imageUrl = getPrimaryImageUrl(region);

          return (
            <Link
              key={region.id}
              href={`/events?region=${region.id}`}
              className="flex flex-col overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
            >
              {/* Image section */}
              <div className="relative h-40">
                {imageUrl ? (
                  <ImageWithFallback
                    src={imageUrl}
                    alt={region.name}
                    fallbackSrc="https://via.placeholder.com/400x160?text=No+Image"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                    <span className="text-2xl text-gray-400">No Image</span>
                  </div>
                )}
              </div>

              {/* Content section */}
              <div className="flex flex-grow flex-col p-4">
                <h2 className="mb-2 text-xl font-bold text-purple-800">
                  {region.name}
                </h2>
                {region.description && (
                  <p className="flex-grow text-sm text-gray-600">
                    {region.description}
                  </p>
                )}
                <div className="mt-4 text-sm font-medium text-purple-600">
                  View events in this region →
                </div>
              </div>
            </Link>
          );
        })}

        {allRegions.length === 0 && (
          <div className="col-span-full rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              No regions found
            </h3>
            <p className="mt-2 text-gray-600">
              There are currently no regions available.
            </p>
          </div>
        )}
      </div>

      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
