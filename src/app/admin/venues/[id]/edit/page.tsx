"use client";

import { z } from "zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

const venueSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(2, "Address must be at least 2 characters"),
  capacity: z.string().optional(),
  regionId: z.string().min(1, "Please select a region"),
});

type VenueFormData = z.infer<typeof venueSchema>;

interface Region {
  id: string;
  name: string;
}

export default function EditVenuePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venue, setVenue] = useState<VenueFormData | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: "",
      address: "",
      capacity: "",
      regionId: "",
    },
  });

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setIsLoadingRegions(true);
        const response = await fetch("/api/regions");
        
        if (!response.ok) {
          throw new Error("Failed to fetch regions");
        }
        
        const data = await response.json();
        setRegions(data);
      } catch (error) {
        console.error("Error fetching regions:", error);
        setError("Error loading regions. Please try again.");
      } finally {
        setIsLoadingRegions(false);
      }
    };

    fetchRegions();
  }, []);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/venues/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch venue");
        }
        
        const data = await response.json();
        setVenue(data);
        reset({
          name: data.name,
          address: data.address,
          capacity: data.capacity ? String(data.capacity) : "",
          regionId: data.regionId || "",
        });
      } catch (error) {
        setError("Error loading venue data. Please try again.");
        console.error("Error fetching venue:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenue();
  }, [id, reset]);

  const onSubmit = async (data: VenueFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const venueData = {
        ...data,
        capacity: data.capacity ? parseInt(data.capacity) : null,
      };

      const response = await fetch(`/api/venues/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venueData),
      });

      if (!response.ok) {
        throw new Error("Failed to update venue");
      }

      router.push(`/admin/venues/${id}`);
      router.refresh();
    } catch (error) {
      setError("Failed to update venue. Please try again.");
      console.error("Error updating venue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this venue? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      
      const response = await fetch(`/api/venues/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete venue");
      }

      router.push("/admin/venues");
      router.refresh();
    } catch (error) {
      setError("Failed to delete venue. Please try again.");
      console.error("Error deleting venue:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && !venue) {
    return <div className="text-center py-10">Loading venue data...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Edit Venue</h1>
        <div className="flex space-x-4">
          <Link
            href={`/admin/venues/${id}`}
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
            {isDeleting ? "Deleting..." : "Delete Venue"}
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
            Venue Name *
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
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <input
            id="address"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            {...register("address")}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
            Capacity
          </label>
          <input
            id="capacity"
            type="number"
            placeholder="Leave empty if unknown"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            {...register("capacity")}
          />
          {errors.capacity && (
            <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="regionId" className="block text-sm font-medium text-gray-700 mb-1">
            Region *
          </label>
          <div className="flex gap-2">
            <select
              id="regionId"
              disabled={isLoadingRegions}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              {...register("regionId")}
            >
              <option value="">Select a region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <Link
              href="/admin/regions/create"
              className="flex-shrink-0 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              +
            </Link>
          </div>
          {errors.regionId && (
            <p className="mt-1 text-sm text-red-600">{errors.regionId.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
            disabled={isLoading || isLoadingRegions}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
} 