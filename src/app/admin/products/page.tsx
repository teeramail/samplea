"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

// Define product type
interface ProductType {
  id: string;
  name: string;
  price: number;
  isFeatured: boolean;
}

export default function AdminProductsPage() {
  const { data: products, isLoading, error, refetch } = api.product.listAll.useQuery();

  const toggleMut = api.product.toggleFeatured.useMutation({
    onSuccess: () => void refetch(),
  });

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
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2 text-left">Name</th>
            <th className="border px-4 py-2 text-right">Price</th>
            <th className="border px-4 py-2 text-center">Featured</th>
            <th className="border px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products?.map((p: ProductType) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{p.name}</td>
              <td className="border px-4 py-2 text-right">${p.price.toFixed(2)}</td>
              <td className="border px-4 py-2 text-center">
                <input
                  type="checkbox"
                  checked={p.isFeatured}
                  onChange={() =>
                    toggleMut.mutate({ id: p.id, isFeatured: !p.isFeatured })
                  }
                />
              </td>
              <td className="border px-4 py-2 text-center">
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="text-indigo-600 hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
