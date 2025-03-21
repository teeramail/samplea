"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RegionsNav() {
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRegionId = searchParams.get('region');

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch('/api/regions');
        if (!response.ok) throw new Error('Failed to fetch regions');
        const data = await response.json();
        setRegions(data);
      } catch (error) {
        console.error('Error fetching regions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegions();
  }, []);

  // Only show on events or homepage
  if (!pathname.startsWith('/events') && pathname !== '/') {
    return null;
  }

  const createQueryString = (regionId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('region', regionId);
    return params.toString();
  };

  return (
    <div className="bg-gray-100 py-2 border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="overflow-x-auto">
          <ul className="flex space-x-4 text-sm whitespace-nowrap pb-1">
            <li className="text-gray-500 font-medium py-1 px-1">Regions:</li>
            <li>
              <Link 
                href={pathname}
                className={`px-3 py-1 rounded-full inline-block text-sm transition-colors 
                ${!currentRegionId 
                  ? 'bg-purple-100 text-purple-800 font-medium' 
                  : 'text-gray-700 hover:bg-gray-200'}`}
              >
                All
              </Link>
            </li>
            {isLoading ? (
              <li className="text-gray-500 italic">Loading...</li>
            ) : (
              regions.map(region => (
                <li key={region.id}>
                  <Link
                    href={`${pathname}?${createQueryString(region.id)}`}
                    className={`px-3 py-1 rounded-full inline-block text-sm transition-colors
                    ${currentRegionId === region.id 
                      ? 'bg-purple-100 text-purple-800 font-medium' 
                      : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    {region.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 