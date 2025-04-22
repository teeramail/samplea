"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import Image from "next/image";

// Define product type
interface ProductType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isFeatured: boolean;
  updatedAt: Date;
  imageUrls: string[] | null;
  // TypeScript doesn't know about thumbnailUrl yet since it was added later
  [key: string]: any;
}

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<'updatedAt' | 'name' | 'price'>('updatedAt');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState<boolean | undefined>(undefined);

  // Fetch products with pagination, sorting, and filtering
  const { data, isLoading, error, refetch } = api.product.listAll.useQuery({
    page,
    perPage,
    orderBy,
    orderDir,
    search: search || undefined,
    featured: featuredFilter,
  });

  // Toggle featured mutation
  const toggleMut = api.product.toggleFeatured.useMutation({
    onSuccess: () => void refetch(),
  });

  // Delete product mutation
  const deleteProduct = api.product.delete.useMutation({
    onSuccess: () => void refetch(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1); // Reset to first page when searching
  };

  const handleSort = (field: 'updatedAt' | 'name' | 'price') => {
    if (orderBy === field) {
      // Toggle direction if clicking the same field
      setOrderDir(orderDir === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setOrderBy(field);
      setOrderDir('desc');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate({ id });
    }
  };

  const renderSortIcon = (field: 'updatedAt' | 'name' | 'price') => {
    if (orderBy !== field) return null;
    
    return orderDir === 'asc' 
      ? <span className="ml-1">↑</span> 
      : <span className="ml-1">↓</span>;
  };

  if (isLoading) return <div className="p-4">Loading products...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error.message}</div>;

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <Link
          href="/admin/products/create"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          + New Product
        </Link>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="rounded-l-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-r-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={featuredFilter === undefined ? "" : featuredFilter.toString()}
            onChange={(e) => {
              const val = e.target.value;
              setFeaturedFilter(val === "" ? undefined : val === "true");
              setPage(1);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="">All Products</option>
            <option value="true">Featured Only</option>
            <option value="false">Non-Featured Only</option>
          </select>

          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {!data?.items.length ? (
        <div className="text-center py-8">
          No products found. {search && <button onClick={() => setSearch("")} className="text-indigo-600 hover:underline">Clear search</button>}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Name {renderSortIcon('name')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('price')}
                  >
                    Price {renderSortIcon('price')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Featured
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('updatedAt')}
                  >
                    Last Updated {renderSortIcon('updatedAt')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((product: ProductType) => {
                  const formattedDate = new Date(product.updatedAt).toLocaleDateString();
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative h-12 w-12">
                          {product.thumbnailUrl ? (
                            <Image
                              src={product.thumbnailUrl}
                              alt={product.name}
                              fill
                              className="object-cover rounded-md"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-xs text-gray-500">No image</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${product.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleMut.mutate({ id: product.id, isFeatured: !product.isFeatured })}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product.isFeatured
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {product.isFeatured ? "Yes" : "No"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formattedDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * perPage + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(page * perPage, data.pagination.totalCount)}
                </span>{" "}
                of <span className="font-medium">{data.pagination.totalCount}</span> products
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`rounded-md px-3 py-1 text-sm ${
                      pageNum === page
                        ? "bg-indigo-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pagination.totalPages}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
