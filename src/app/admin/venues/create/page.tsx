"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const venueSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  capacity: z.coerce.number().int().min(0, "Capacity must be non-negative"),
  regionId: z.string().min(1, "Please select a region"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

type VenueFormData = Omit<z.infer<typeof venueSchema>, 'thumbnailUrl' | 'imageUrls'>;

// Define type for the upload API response
type UploadResponse = {
  urls: string[];
};

// Helper function to upload a single file
async function uploadFile(file: File, entityType: string): Promise<string | null> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("entityType", entityType);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("Upload failed with status:", response.status);
      const errorText = await response.text();
      console.error("Upload error details:", errorText);
      return null;
    }

    // Use type assertion here
    const result = await response.json() as UploadResponse;
    // Check result.urls and return first, or null
    if (result.urls && Array.isArray(result.urls) && result.urls.length > 0) {
      return result.urls[0] ?? null; // Use ?? to handle potential undefined
    } else {
      console.error("Upload API response missing urls or urls array is empty:", result);
      return null;
    }
  } catch (error) {
    console.error("Error during file upload fetch:", error);
    return null;
  }
}

export default function CreateVenuePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
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
      latitude: undefined,
      longitude: undefined,
    },
  });

  // Fetch regions when component mounts
  useEffect(() => {
    const fetchRegions = async () => {
      setIsLoadingRegions(true);
      try {
        const response = await fetch("/api/regions");
        if (!response.ok) {
          throw new Error("Failed to fetch regions");
        }
        const data = await response.json() as { id: string; name: string }[];
        setRegions(data);
      } catch (error) {
        console.error("Error fetching regions:", error);
        setError("Failed to load regions. Please try again later.");
      } finally {
        setIsLoadingRegions(false);
      }
    };
    
    void fetchRegions();
  }, []);

  // Handle Thumbnail File Selection
  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(null);
    }
  };

  // Handle Multiple Image File Selection
  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImageFiles(files);
    
    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        // Only update state when all files are read
        if (newPreviews.length === files.length) {
           setImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
     // If no files selected, clear previews
    if (files.length === 0) {
       setImagePreviews([]);
    }
  };

  const onSubmit = async (data: VenueFormData) => {
    setIsLoading(true);
    setError("");
    
    let uploadedThumbnailUrl: string | null = null;
    const uploadedImageUrls: string[] = [];

    try {
      // 1. Upload Thumbnail (if selected)
      if (thumbnailFile) {
        uploadedThumbnailUrl = await uploadFile(thumbnailFile, "venue");
        if (!uploadedThumbnailUrl) {
          throw new Error("Failed to upload thumbnail image. Please try again.");
        }
      }

      // 2. Upload Venue Images (if selected)
      if (imageFiles.length > 0) {
        const results: (string | null)[] = [];
        for (const file of imageFiles) {
          const url = await uploadFile(file, "venue");
          results.push(url);
        }
        
        // Check if all uploads were successful
        if (results.some(url => url === null)) {
           const failedIndices = results.map((url, index) => url === null ? index + 1 : -1).filter(i => i !== -1);
           throw new Error(`Failed to upload venue image(s): #${failedIndices.join(', ')}. Please try again.`);
        }
        uploadedImageUrls.push(...results.filter(url => url !== null)); 
      }

      // 3. Prepare final data for venue creation API
      const venueData = {
        ...data,
        latitude: data.latitude === undefined || isNaN(data.latitude) ? null : data.latitude,
        longitude: data.longitude === undefined || isNaN(data.longitude) ? null : data.longitude,
        thumbnailUrl: uploadedThumbnailUrl,
        imageUrls: uploadedImageUrls,
      };
      
      console.log("Submitting final venue data:", venueData);

      // 4. Send data to venue creation API
      const response = await fetch("/api/venues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venueData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create venue");
      }
      
      router.push("/admin/venues");

    } catch (error) {
      console.error("Error creating venue:", error);
      setError(error instanceof Error ? error.message : "Failed to create venue. Please check uploads and try again.");
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
              Latitude (Optional)
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              {...register("latitude")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., 13.7563"
            />
            {errors.latitude && (
              <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
              Longitude (Optional)
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              {...register("longitude")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., 100.5018"
            />
            {errors.longitude && (
              <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
            Capacity
          </label>
          <input
            id="capacity"
            type="number"
            {...register("capacity")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.capacity && (
            <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">
            Thumbnail Image (for listings)
          </label>
          <input 
            id="thumbnail"
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {thumbnailPreview && (
            <div className="mt-2">
              <img src={thumbnailPreview} alt="Thumbnail preview" className="h-24 w-auto rounded-md object-cover"/>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-700">
            Venue Images (Multiple allowed)
          </label>
          <input 
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {imagePreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <img key={index} src={preview} alt={`Venue image preview ${index + 1}`} className="h-24 w-auto rounded-md object-cover"/>
              ))}
            </div>
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