"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Region = {
  id: string;
  name: string;
  slug?: string;
};

export function RegionsNav() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRegionId = searchParams.get("region");

  // Extract current region slug from pathname if we're on a region page
  const currentPathSegments = pathname.split("/").filter(Boolean);
  const isRegionPage = currentPathSegments[0] === "region";
  const currentRegionSlug = isRegionPage ? currentPathSegments[1] : null;

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch("/api/regions");
        if (!response.ok) throw new Error("Failed to fetch regions");
        const data = (await response.json()) as Region[];
        setRegions(data);
      } catch (error) {
        console.error("Error fetching regions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRegions();
  }, []);

  // Only show on events, homepage, or region pages
  if (
    !pathname.startsWith("/events") &&
    pathname !== "/" &&
    !pathname.startsWith("/region")
  ) {
    return null;
  }

  // For fallback to query params in case some regions don't have slugs yet
  const createQueryString = (regionId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("region", regionId);
    return params.toString();
  };

  return (
    <div className="border-b border-gray-200 bg-gray-100 py-2">
      <div className="mx-auto max-w-screen-xl px-4">
        <div className="overflow-x-auto">
          <ul className="flex space-x-4 whitespace-nowrap pb-1 text-sm">
            <li className="px-1 py-1 font-medium text-gray-500">Regions:</li>
            <li>
              <Link
                href="/"
                className={`inline-block rounded-full px-3 py-1 text-sm transition-colors ${
                  !currentRegionId && !currentRegionSlug
                    ? "bg-purple-100 font-medium text-purple-800"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </Link>
            </li>
            {isLoading ? (
              <li className="italic text-gray-500">Loading...</li>
            ) : (
              regions.map((region) => {
                // For each region, determine if we should use slug or query param
                const hasSlug = !!region.slug;
                const isActive =
                  currentRegionSlug === region.slug ||
                  currentRegionId === region.id;
                const href = hasSlug
                  ? `/region/${region.slug}`
                  : `/?${createQueryString(region.id)}`;

                return (
                  <li key={region.id}>
                    <Link
                      href={href}
                      className={`inline-block rounded-full px-3 py-1 text-sm transition-colors ${
                        isActive
                          ? "bg-purple-100 font-medium text-purple-800"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {region.name}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
