import Link from "next/link";
import { db } from "~/server/db";

export default async function RegionsPage() {
  // Get all regions
  const allRegions = await db.query.regions.findMany({
    orderBy: (regions, { asc }) => [asc(regions.name)],
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Regions</h1>
      <p className="text-gray-600 max-w-3xl mb-8">
        Browse Muay Thai events by region. Select a region to see all upcoming events in that location.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {allRegions.map((region) => (
          <Link 
            key={region.id}
            href={`/events?region=${region.id}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all p-6 flex flex-col"
          >
            <h2 className="text-xl font-bold text-purple-800 mb-2">{region.name}</h2>
            {region.description && (
              <p className="text-gray-600 text-sm flex-grow">{region.description}</p>
            )}
            <div className="mt-4 text-sm text-purple-600 font-medium">
              View events in this region →
            </div>
          </Link>
        ))}
        
        {allRegions.length === 0 && (
          <div className="col-span-full bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">No regions found</h3>
            <p className="text-gray-600 mt-2">There are currently no regions available.</p>
          </div>
        )}
      </div>
      
      <div className="mt-10">
        <Link 
          href="/"
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
} 