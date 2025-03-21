"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const regionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  description: z.string().optional(),
});

type RegionFormData = z.infer<typeof regionSchema>;

// Thailand regions presets
const THAI_REGIONS = [
  "Bangkok",
  "Phuket",
  "Chiang Mai",
  "Koh Samui",
  "Pattaya",
  "Krabi",
  "Hua Hin",
  "Ayutthaya",
  "Kanchanaburi",
  "Pai",
  "Koh Pha Ngan",
  "Koh Tao",
  "Sukhothai",
  "Khao Lak",
  "Koh Chang",
  "Isaan",
  "Koh Lanta",
  "Chiang Rai",
  "Koh Phi Phi",
  "Mae Hong Son",
];

export default function CreateRegionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegionFormData>({
    resolver: zodResolver(regionSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const setPresetRegion = (regionName: string) => {
    setValue("name", regionName, { shouldValidate: true });
  };

  const onSubmit = async (data: RegionFormData) => {
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Submitting region data:", data);
      
      const response = await fetch("/api/regions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      let responseData;
      try {
        // Try to parse the response as JSON
        responseData = await response.json();
      } catch (e) {
        // If parsing fails, set responseData to an empty object or error message
        console.error("Failed to parse response as JSON:", e);
        responseData = { error: "Failed to parse server response" };
      }
      
      console.log("Response status:", response.status);
      console.log("Response data:", responseData);
      
      if (!response.ok) {
        // Handle the case where responseData might be empty
        let errorMessage = "Failed to create region";
        if (responseData && responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData && responseData.details) {
          errorMessage = responseData.details;
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (response.status === 400) {
          errorMessage = "Invalid data submitted. Please check your inputs.";
        }
        
        throw new Error(errorMessage);
      }
      
      console.log("Region created successfully:", responseData);
      router.push("/admin/regions");
      router.refresh();
    } catch (error) {
      console.error("Error creating region:", error);
      setError(error instanceof Error ? error.message : "Failed to create region. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Region</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Region Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., Bangkok, Phuket"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Common Regions in Thailand
          </label>
          <div className="flex flex-wrap gap-2">
            {THAI_REGIONS.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setPresetRegion(region)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {region}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (optional)
          </label>
          <textarea
            id="description"
            rows={3}
            {...register("description")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Brief description of the region"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/regions")}
            className="bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? "Creating..." : "Create Region"}
          </button>
        </div>
      </form>
    </div>
  );
} 