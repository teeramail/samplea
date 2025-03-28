import Link from "next/link";
import { db } from "~/server/db";
import { regions } from "~/server/db/schema";
import { asc } from "drizzle-orm";
import ImageWithFallback from "~/app/_components/ImageWithFallback";

export const dynamic = 'force-dynamic'; // Disable cache for this page

export default async function RegionsListPage() {
  // Fetch all regions
  const allRegions = await db.query.regions.findMany({
    orderBy: [asc(regions.name)],
  });

  // Helper function to get primary image URL
  const getPrimaryImageUrl = (region: typeof allRegions[number]): string | null => {
    if (!region.imageUrls || region.imageUrls.length === 0) {
      return null;
    }
    
    const primaryIndex = region.primaryImageIndex ?? 0;
    return region.imageUrls[primaryIndex < region.imageUrls.length ? primaryIndex : 0] || null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Regions Management</h1>
        <Link 
          href="/admin/regions/create" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add New Region
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allRegions.length > 0 ? (
              allRegions.map((region) => (
                <tr key={region.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex-shrink-0 h-10 w-10">
                      {getPrimaryImageUrl(region) ? (
                        <ImageWithFallback
                          src={getPrimaryImageUrl(region)}
                          alt={region.name}
                          fallbackSrc="https://via.placeholder.com/40?text=No+Image"
                          className="h-10 w-10 object-cover"
                          rounded={true}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{region.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 truncate max-w-xs">{region.description ?? "—"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/regions/${region.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                      View
                    </Link>
                    <Link href={`/admin/regions/${region.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      Edit
                    </Link>
                    <Link href={`/admin/regions/${region.id}/delete`} className="text-red-600 hover:text-red-900">
                      Delete
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No regions found. Click "Add New Region" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 