"use client";

import { z } from "zod";
import { useState, useEffect, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const regionUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  primaryImageIndex: z.number().int().min(0).optional(),
});

type RegionFormData = z.infer<typeof regionUpdateSchema>;

type FetchedRegionData = RegionFormData & {
  id: string;
  imageUrls?: string[] | null;
  primaryImageIndex?: number | null;
};

// Define type for the upload API response
type UploadResponse = {
  urls: string[];
};

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

export default function EditRegionPage() {
  const router = useRouter();
  const params = useParams();
  const regionId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedPrimaryIndex, setSelectedPrimaryIndex] = useState<number>(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegionFormData>({
    resolver: zodResolver(regionUpdateSchema),
    defaultValues: {
      name: "",
      description: "",
      primaryImageIndex: 0,
    },
  });

  useEffect(() => {
    if (!regionId) return;
    const fetchRegion = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const response = await fetch(`/api/regions/${regionId}`);
        if (!response.ok) {
          throw new Error(response.status === 404 ? "Region not found" : "Failed to fetch region");
        }
        const data = await response.json() as FetchedRegionData;
        
        reset({
          name: data.name,
          description: data.description ?? "",
          primaryImageIndex: data.primaryImageIndex ?? 0,
        });
        setCurrentImageUrls(data.imageUrls ?? []);
        setSelectedPrimaryIndex(data.primaryImageIndex ?? 0);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading region data.");
        console.error("Error fetching region:", err);
      } finally {
        setIsFetching(false);
      }
    };
    void fetchRegion();
  }, [regionId, reset]);

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setNewImageFiles(files);
    setCurrentImageUrls([]);
    setImagePreviews([]);

    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
           setImagePreviews(newPreviews);
           setSelectedPrimaryIndex(0); 
           setValue("primaryImageIndex", 0); 
        }
      };
      reader.readAsDataURL(file);
    });
    if (files.length === 0) {
       setImagePreviews([]);
    }
  };

  const handleSetPrimary = (index: number) => {
    setSelectedPrimaryIndex(index);
    setValue("primaryImageIndex", index, { shouldValidate: true });
  };

  const displayImages = imagePreviews.length > 0 ? imagePreviews : currentImageUrls;

  const onSubmit = async (data: RegionFormData) => {
    setIsLoading(true);
    setError(null);
    let finalImageUrls = currentImageUrls;

    try {
      if (newImageFiles.length > 0) {
        const uploadPromises = newImageFiles.map(file => uploadFile(file, "region"));
        const results = await Promise.all(uploadPromises);
        if (results.some(url => url === null)) {
           const failedIndices = results.map((url, index) => url === null ? index + 1 : -1).filter(i => i !== -1);
           throw new Error(`Failed to upload new region image(s): #${failedIndices.join(', ')}.`);
        }
        // Remove unnecessary assertion - filter already narrows type
        finalImageUrls = results.filter(url => url !== null);
      }
      
      const finalPrimaryIndex = 
        finalImageUrls.length > 0 && data.primaryImageIndex !== undefined && data.primaryImageIndex < finalImageUrls.length 
        ? data.primaryImageIndex 
        : 0;

      const regionUpdateData = {
        name: data.name,
        description: data.description,
        imageUrls: finalImageUrls,
        primaryImageIndex: finalPrimaryIndex,
      };

      console.log("Submitting final region update data:", regionUpdateData);

      const response = await fetch(`/api/regions/${regionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(regionUpdateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? `Failed to update region (status: ${response.status})`);
      }

      router.push(`/admin/regions/${regionId}`);
      router.refresh();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update region. Please try again.");
      console.error("Error updating region:", err);
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
      
      const response = await fetch(`/api/regions/${regionId}`, {
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

  if (isFetching) {
    return <div className="text-center py-10">Loading region data...</div>;
  }

  if (error && !isFetching && !isLoading) {
    return (
       <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md text-center">
           <p className="text-red-600 font-bold mb-4">Error: {error}</p>
           <Link href="/admin/regions" className="text-blue-600 hover:underline">
               Return to Regions List
           </Link>
       </div>
   ); 
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6 flex justify-between items-center">
         <h1 className="text-2xl font-bold text-gray-800">Edit Region</h1>
         <div className="flex space-x-4">
           <Link href={`/admin/regions/${regionId}`} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md">
             Cancel
           </Link>
           <button type="button" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md" disabled={isDeleting}>
             {isDeleting ? "Deleting..." : "Delete Region"}
           </button>
         </div>
       </div>

       {error && !isLoading && !isDeleting && (
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

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Region Images</label>
            {displayImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                    {displayImages.map((url, index) => (
                        <div key={url+index} className="relative aspect-square border rounded-md overflow-hidden group">
                            <Image 
                                src={url} 
                                alt={`Region image ${index + 1}`} 
                                fill 
                                className="object-cover" 
                                unoptimized
                            />
                            <button 
                                type="button"
                                onClick={() => handleSetPrimary(index)}
                                className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded text-xs transition-opacity duration-200 
                                           ${selectedPrimaryIndex === index 
                                             ? 'bg-green-600 text-white cursor-default' 
                                             : 'bg-gray-700 bg-opacity-60 text-white opacity-0 group-hover:opacity-100 hover:bg-opacity-80'}`}
                                disabled={selectedPrimaryIndex === index}
                            >
                                {selectedPrimaryIndex === index ? 'Primary' : 'Set Primary'}
                            </button>
                             <input type="hidden" {...register("primaryImageIndex", { valueAsNumber: true })} />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 mb-2">No images uploaded yet.</p>
            )}
             <label htmlFor="images" className="block text-sm font-medium text-gray-700">
                 {currentImageUrls.length > 0 ? 'Replace All' : 'Upload'} Images (Multiple allowed, max 5) 
                 <span className="text-xs text-gray-500 ml-1">(Max size: 120KB per image)</span>
             </label>
             <input 
                id="images" 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleImagesChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
             />
             {errors.primaryImageIndex && <p className="mt-1 text-sm text-red-600">{errors.primaryImageIndex.message}</p>} 
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
            disabled={isLoading ?? isFetching}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
} 