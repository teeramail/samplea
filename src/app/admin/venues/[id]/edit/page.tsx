"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

// --- Re-use or redefine schema (ensure it matches create/backend) ---
const venueUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  capacity: z.coerce.number().int().min(0, "Capacity must be non-negative"),
  regionId: z.string().min(1, "Please select a region"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  // Image URLs are handled separately in submission logic
});

type VenueFormData = Omit<z.infer<typeof venueUpdateSchema>, 'thumbnailUrl' | 'imageUrls'>;

// Type for the fetched venue data (might include more fields like region object)
type FetchedVenueData = VenueFormData & {
    id: string;
    thumbnailUrl?: string | null;
    imageUrls?: string[] | null;
    region?: { id: string; name: string }; // Assuming region is included
};

type Region = {
    id: string;
    name: string;
};

// Define type for the upload API response
type UploadResponse = {
  urls: string[];
};

// --- Actual upload function (copy from create page or import) ---
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
      console.error("Upload failed:", response.status, await response.text());
      return null;
    }
    // Use type assertion here
    const result = await response.json() as UploadResponse;
    // Check result.urls and return first, or null
    if (result.urls && Array.isArray(result.urls) && result.urls.length > 0) {
      return result.urls[0] ?? null; // Use ?? to handle potential undefined
    } else {
      console.error("Upload API response error or no URLs:", result);
      return null;
    }
  } catch (error) {
    console.error("Upload fetch error:", error);
    return null;
  }
}

export default function EditVenuePage() {
  const router = useRouter();
  const params = useParams();
  const venueId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  
  // State for images
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string | null | undefined>(null);
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset, // Use reset to populate form after fetch
    formState: { errors },
  } = useForm<VenueFormData>({
    resolver: zodResolver(venueUpdateSchema),
    defaultValues: { // Initial empty defaults
      name: "",
      address: "",
      capacity: 0,
      regionId: "",
      latitude: undefined,
      longitude: undefined,
    },
  });

  // Fetch regions
  useEffect(() => {
    const fetchRegions = async () => {
      setIsLoadingRegions(true);
      try {
        const response = await fetch("/api/regions");
        if (!response.ok) throw new Error("Failed to fetch regions");
        const data = await response.json() as Region[];
        setRegions(data);
      } catch (err) {
        console.error("Error fetching regions:", err);
        setError("Failed to load regions.");
      } finally {
        setIsLoadingRegions(false);
      }
    };
    void fetchRegions();
  }, []);

  // Fetch venue data
  useEffect(() => {
    if (!venueId) return;
    const fetchVenue = async () => {
      setIsFetching(true);
      setError("");
      try {
        const response = await fetch(`/api/venues/${venueId}`);
        if (!response.ok) {
          if (response.status === 404) {
             throw new Error("Venue not found");
          }
          throw new Error("Failed to fetch venue data");
        }
        const data = await response.json() as FetchedVenueData;
        
        // Populate form with fetched data
        reset({
            name: data.name,
            address: data.address,
            capacity: data.capacity ?? 0, // Handle null capacity
            regionId: data.regionId,
            latitude: data.latitude ?? undefined,
            longitude: data.longitude ?? undefined,
        });
        // Set current image states
        setCurrentThumbnailUrl(data.thumbnailUrl);
        setCurrentImageUrls(data.imageUrls ?? []);

      } catch (err) {
        console.error("Error fetching venue:", err);
        setError(err instanceof Error ? err.message : "Failed to load venue data.");
      } finally {
        setIsFetching(false);
      }
    };
    void fetchVenue();
  }, [venueId, reset]);

  // --- File Handlers (ensure they clear previews appropriately) ---
  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file); // Store the file to be uploaded
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string); // Show preview
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailFile(null); // Clear file if selection cancelled
      setThumbnailPreview(null); // Clear preview
    }
  };

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
     const files = e.target.files ? Array.from(e.target.files) : [];
    setImageFiles(files); // Store files to be uploaded
    setImagePreviews([]); // Clear old previews

    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
           setImagePreviews(newPreviews); // Show previews
        }
      };
      reader.readAsDataURL(file);
    });
     // If no files selected, clear previews
    if (files.length === 0) {
       setImagePreviews([]);
    }
  };

  // --- onSubmit Handler --- 
  const onSubmit = async (data: VenueFormData) => {
    setIsLoading(true);
    setError("");
    
    let finalThumbnailUrl = currentThumbnailUrl; // Assume current URL initially
    let finalImageUrls = currentImageUrls; // Assume current URLs initially

    try {
      // 1. Upload NEW Thumbnail (if selected)
      if (thumbnailFile) {
        const uploadedUrl = await uploadFile(thumbnailFile, "venue");
        if (!uploadedUrl) {
          throw new Error("Failed to upload new thumbnail image.");
        }
        finalThumbnailUrl = uploadedUrl; // Use the new URL
      }

      // 2. Upload NEW Venue Images (if selected)
      // NOTE: This REPLACES all existing images if new ones are selected.
      // Modify logic if you want to add/remove specific images.
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(file => uploadFile(file, "venue"));
        const results = await Promise.all(uploadPromises);
        
        if (results.some(url => url === null)) {
           const failedIndices = results.map((url, index) => url === null ? index + 1 : -1).filter(i => i !== -1);
           throw new Error(`Failed to upload new venue image(s): #${failedIndices.join(', ')}.`);
        }
        // Remove unnecessary assertion - filter already narrows type
        finalImageUrls = results.filter(url => url !== null); // Use the new URLs
      }

      // 3. Prepare final data for venue update API
      const venueUpdateData = {
        ...data,
        latitude: data.latitude === undefined || isNaN(data.latitude) ? null : data.latitude,
        longitude: data.longitude === undefined || isNaN(data.longitude) ? null : data.longitude,
        thumbnailUrl: finalThumbnailUrl, // Use determined URL
        imageUrls: finalImageUrls, // Use determined URLs
      };
      
      console.log("Submitting final venue update data:", venueUpdateData);

      // 4. Send data to venue update API (PUT request)
      const response = await fetch(`/api/venues/${venueId}`, {
        method: "PUT", // Use PUT for full update
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venueUpdateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update venue (status: ${response.status})`);
      }
      
      // Redirect on success
      router.push("/admin/venues"); 
      // Optionally add a success notification here

    } catch (error) {
      console.error("Error updating venue:", error);
      setError(error instanceof Error ? error.message : "Failed to update venue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching || isLoadingRegions) {
    return <div className="text-center py-10">Loading venue data...</div>;
  }

  if (error && !isFetching) {
     return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-red-600 font-bold mb-4">Error: {error}</p>
            <Link href="/admin/venues" className="text-blue-600 hover:underline">
                Return to Venues List
            </Link>
        </div>
    ); 
  }

  // --- JSX for the form --- 
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Venue</h1>
      
      {error && (
         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
             <span className="block sm:inline">{error}</span>
         </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Input */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Venue Name</label>
          <input id="name" type="text" {...register("name")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        {/* Region Select */}
        <div>
          <label htmlFor="regionId" className="block text-sm font-medium text-gray-700">Region</label>
          <select id="regionId" {...register("regionId")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" disabled={isLoadingRegions}>
            <option value="">Select a region</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
          {errors.regionId && <p className="mt-1 text-sm text-red-600">{errors.regionId.message}</p>}
        </div>

        {/* Address Input */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
          <textarea id="address" rows={3} {...register("address")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
        </div>

        {/* Lat/Lon Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude (Optional)</label>
            <input id="latitude" type="number" step="any" {...register("latitude")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>}
          </div>
          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude (Optional)</label>
            <input id="longitude" type="number" step="any" {...register("longitude")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>}
          </div>
        </div>

        {/* Capacity Input */}
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity</label>
          <input id="capacity" type="number" {...register("capacity")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
          {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>}
        </div>
        
        {/* Thumbnail Management */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Thumbnail</label>
            {currentThumbnailUrl ? (
                <img src={currentThumbnailUrl} alt="Current thumbnail" className="h-24 w-auto rounded-md object-cover mb-2"/>
            ) : (
                <p className="text-sm text-gray-500 mb-2">No current thumbnail.</p>
            )}
            <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">
                {currentThumbnailUrl ? 'Replace' : 'Upload'} Thumbnail Image
            </label>
            <input id="thumbnail" type="file" accept="image/*" onChange={handleThumbnailChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {thumbnailPreview && (
                <div className="mt-2">
                <p className="text-sm font-medium text-gray-600">New thumbnail preview:</p>
                <img src={thumbnailPreview} alt="New thumbnail preview" className="h-24 w-auto rounded-md object-cover mt-1"/>
                </div>
            )}
        </div>

        {/* Venue Images Management */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Venue Images</label>
            {currentImageUrls.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-2">
                    {currentImageUrls.map((url, index) => (
                        <img key={index} src={url} alt={`Current venue image ${index + 1}`} className="h-24 w-auto rounded-md object-cover"/>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 mb-2">No current venue images.</p>
            )}
             <label htmlFor="images" className="block text-sm font-medium text-gray-700">
                {currentImageUrls.length > 0 ? 'Replace All' : 'Upload'} Venue Images (Multiple allowed)
            </label>
            <input id="images" type="file" accept="image/*" multiple onChange={handleImagesChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {imagePreviews.length > 0 && (
                 <div className="mt-2">
                    <p className="text-sm font-medium text-gray-600">New images preview:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                    {imagePreviews.map((preview, index) => (
                        <img key={index} src={preview} alt={`New venue image preview ${index + 1}`} className="h-24 w-auto rounded-md object-cover"/>
                    ))}
                    </div>
                </div>
            )}
        </div>

        {/* Submission Buttons */}
        <div className="flex justify-end space-x-3 border-t pt-6">
          <Link href="/admin/venues" className="bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Cancel
          </Link>
          <button type="submit" disabled={isLoading || isFetching} className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
} 