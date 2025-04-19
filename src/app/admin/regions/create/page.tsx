"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";

// Maximum file size: 120KB
const MAX_FILE_SIZE = 120 * 1024;
// Maximum number of images
const MAX_IMAGES = 5;

const regionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  slug: z.string().min(2, "Slug must be at least 2 characters long"),
  description: z.string().optional(),
});

// Function to convert a name to a URL-friendly slug
const nameToSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .trim();
};

type RegionFormData = z.infer<typeof regionSchema>;

// Thailand regions presets
const THAI_REGIONS: string[] = [
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
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegionFormData>({
    resolver: zodResolver(regionSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  // Auto-generate slug from name when name changes
  const name = watch("name");
  useEffect(() => {
    if (name) {
      setValue("slug", nameToSlug(name), { shouldValidate: true });
    }
  }, [name, setValue]);

  const setPresetRegion = (regionName: string) => {
    setValue("name", regionName, { shouldValidate: true });
    setValue("slug", nameToSlug(regionName), { shouldValidate: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);

    // Check if we've reached max images
    if (images.length + newFiles.length > MAX_IMAGES) {
      setError(`You can only upload a maximum of ${MAX_IMAGES} images`);
      return;
    }

    // Check file sizes and types
    const validFiles = newFiles.filter((file) => {
      // Check if it's an image
      if (!file.type.startsWith("image/")) {
        setError(`File ${file.name} is not an image`);
        return false;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File ${file.name} is too large. Maximum size is 120KB`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Create image previews
    const previews = validFiles.map((file) => URL.createObjectURL(file));

    setImages((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...previews]);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Clear error if successful
    setError("");
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));

    // Add a null check before revoking the object URL
    const previewUrl = imagePreviews[index];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));

    // Update primary image index if needed
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex((prev) => prev - 1);
    }
  };

  const setPrimaryImage = (index: number) => {
    setPrimaryImageIndex(index);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    setUploadingImages(true);

    try {
      const formData = new FormData();
      formData.append("entityType", "region");

      // Add each image to form data with the same field name
      // Formidable will handle arrays of files with the same field name
      images.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to upload images");
      }

      const data = (await response.json()) as { urls?: string[] };
      return data.urls ?? [];
    } catch (error) {
      console.error("Error uploading images:", error);
      setError(
        error instanceof Error ? error.message : "Failed to upload images",
      );
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const onSubmit = async (data: RegionFormData) => {
    setIsLoading(true);
    setError("");

    try {
      // Upload images first if there are any
      let urls: string[] = [];
      if (images.length > 0) {
        urls = await uploadImages();
        if (urls.length === 0 && images.length > 0) {
          // If we have images but no URLs, there was an error uploading
          throw new Error("Failed to upload images");
        }
      }

      const regionData = {
        ...data,
        imageUrls: urls.length > 0 ? urls : undefined,
        primaryImageIndex: urls.length > 0 ? primaryImageIndex : undefined,
      };

      console.log("Submitting region data:", regionData);

      const response = await fetch("/api/regions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(regionData),
      });

      // Parse the JSON response
      let responseData: {
        error?: string;
        details?: string;
        id?: string;
      } | null = null;
      try {
        responseData = (await response.json()) as {
          error?: string;
          details?: string;
          id?: string;
        };
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        responseData = { error: "Failed to parse server response" };
      }

      console.log("Response status:", response.status);
      console.log("Response data:", responseData);

      if (!response.ok) {
        let errorMessage = "Failed to create region";
        if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (responseData?.details) {
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
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create region. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Add New Region</h1>

      {error && (
        <div
          className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
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
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-gray-700"
          >
            URL Slug (used in website URLs)
          </label>
          <input
            id="slug"
            type="text"
            {...register("slug")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            This will be used in URLs like: /region/your-slug
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Common Regions in Thailand
          </label>
          <div className="flex flex-wrap gap-2">
            {THAI_REGIONS.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setPresetRegion(region)}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
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
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Image Upload Section */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Images (optional, max 5)
          </label>
          <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pb-6 pt-5">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
                >
                  <span>Upload images</span>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    name="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="sr-only"
                    disabled={images.length >= MAX_IMAGES}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 120KB</p>
            </div>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="group relative">
                  <div
                    className={`aspect-w-16 aspect-h-9 relative overflow-hidden rounded-md border-2 ${index === primaryImageIndex ? "border-blue-500" : "border-gray-200"}`}
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 opacity-0 transition-opacity group-hover:bg-opacity-40 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className="mx-1 rounded-md bg-blue-500 p-1 text-white"
                      title="Set as primary image"
                    >
                      Primary
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="mx-1 rounded-md bg-red-500 p-1 text-white"
                      title="Remove image"
                    >
                      Remove
                    </button>
                  </div>

                  {index === primaryImageIndex && (
                    <div className="absolute left-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs text-white">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/regions")}
            className="mr-3 rounded-md border border-gray-300 bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || uploadingImages}
            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading || uploadingImages ? "Creating..." : "Create Region"}
          </button>
        </div>
      </form>
    </div>
  );
}
