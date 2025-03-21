"use client";

import { z } from "zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

const regionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

type RegionFormData = z.infer<typeof regionSchema>;

export default function EditRegionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<RegionFormData | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegionFormData>({
    resolver: zodResolver(regionSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchRegion = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/regions/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch region");
        }
        
        const data = await response.json();
        setRegion(data);
        reset({
          name: data.name,
          description: data.description || "",
        });
      } catch (error) {
        setError("Error loading region data. Please try again.");
        console.error("Error fetching region:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegion();
  }, [id, reset]);

  const onSubmit = async (data: RegionFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/regions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update region");
      }

      router.push(`/admin/regions/${id}`);
      router.refresh();
    } catch (error) {
      setError("Failed to update region. Please try again.");
      console.error("Error updating region:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this region? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      
      const response = await fetch(`/api/regions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete region");
      }

      router.push("/admin/regions");
      router.refresh();
    } catch (error) {
      setError("Failed to delete region. Please try again.");
      console.error("Error deleting region:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && !region) {
    return <div className="text-center py-10">Loading region data...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Edit Region</h1>
        <div className="flex space-x-4">
          <Link
            href={`/admin/regions/${id}`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Region"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Region Name *
          </label>
          <input
            id="name"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            {...register("description")}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
} 