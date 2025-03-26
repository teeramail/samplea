"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const venueSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  capacity: z.number().min(1, "Capacity is required"),
  regionId: z.string().min(1, "Please select a region"),
});

type VenueFormData = z.infer<typeof venueSchema>;

export default function CreateVenuePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: "",
      address: "",
      capacity: 0,
      regionId: "",
    },
  });

  // Fetch regions when component mounts
  useEffect(() => {
    const fetchRegions = async () => {
      setIsLoadingRegions(true);
      try {
        const response = await fetch("/api/regions");
        if (!response.ok) {
          throw new Error("Failed to load regions");
        }
        const data = await response.json();
        setRegions(data);
      } catch (error) {
        console.error("Error fetching regions:", error);
        setError("Failed to load regions. Please try again later.");
      } finally {
        setIsLoadingRegions(false);
      }
    };
    
    fetchRegions();
  }, []);

  const onSubmit = async (data: VenueFormData) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Capacity is already a number now, no need to parse
      const venueData = {
        ...data,
      };
      
      const response = await fetch("/api/venues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venueData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create venue");
      }
      
      router.push("/admin/venues");
    } catch (error) {
      console.error("Error creating venue:", error);
      setError("Failed to create venue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewRegion = () => {
    router.push("/admin/regions/create");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Venue</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Venue Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., Lumpinee Stadium, Rajadamnern Stadium"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="regionId" className="block text-sm font-medium text-gray-700">
              Region
            </label>
            <button
              type="button"
              onClick={handleCreateNewRegion}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add New Region
            </button>
          </div>
          <select
            id="regionId"
            {...register("regionId")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isLoadingRegions}
          >
            <option value="">Select a region</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {isLoadingRegions && (
            <p className="mt-1 text-sm text-gray-500">Loading regions...</p>
          )}
          {errors.regionId && (
            <p className="mt-1 text-sm text-red-600">{errors.regionId.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="address"
            rows={3}
            {...register("address")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Full address of the venue"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Capacity
          </label>
          <input
            type="number"
            {...register("capacity", { required: true, valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.capacity && (
            <p className="mt-1 text-sm text-red-600">Capacity is required</p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/venues")}
            className="bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? "Creating..." : "Create Venue"}
          </button>
        </div>
      </form>
    </div>
  );
} 