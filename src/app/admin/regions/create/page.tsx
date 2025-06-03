"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { api } from "~/trpc/react";
import { UploadImage, type UploadedImageData } from "~/components/ui/UploadImage";
import { UploadUltraSmallImage, type UploadedUltraSmallImageData } from "~/components/ui/UploadUltraSmallImage";

const regionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  slug: z.string().min(2, "Slug must be at least 2 characters long"),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
  primaryImageIndex: z.number().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
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
  
  // Upload states using our shared components
  const [thumbnailImage, setThumbnailImage] = useState<UploadedUltraSmallImageData | undefined>(undefined);
  const [regionImages, setRegionImages] = useState<UploadedImageData[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);

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
      primaryImageIndex: 0,
      keywords: [],
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

  // Handle thumbnail upload change
  const handleThumbnailChange = (data: UploadedUltraSmallImageData | UploadedUltraSmallImageData[] | null) => {
    if (data && !Array.isArray(data)) {
      setThumbnailImage(data);
      setValue("thumbnailUrl", data.url);
    } else {
      setThumbnailImage(undefined);
      setValue("thumbnailUrl", "");
    }
  };

  // Handle region images upload change
  const handleRegionImagesChange = (data: UploadedImageData | UploadedImageData[] | null) => {
    if (data) {
      const imagesArray = Array.isArray(data) ? data : [data];
      setRegionImages(imagesArray);
      setValue("imageUrls", imagesArray.map(img => img.url));
      
      // Reset primary index if we have fewer images
      if (primaryImageIndex >= imagesArray.length) {
        setPrimaryImageIndex(0);
        setValue("primaryImageIndex", 0);
      }
    } else {
      setRegionImages([]);
      setValue("imageUrls", []);
      setPrimaryImageIndex(0);
      setValue("primaryImageIndex", 0);
    }
  };

  // Handle primary image selection
  const handlePrimaryImageChange = (index: number) => {
    setPrimaryImageIndex(index);
    setValue("primaryImageIndex", index);
  };

  // Handle keywords as comma-separated input
  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keywordsString = e.target.value;
    const keywordsArray = keywordsString
      .split(",")
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);
    setValue("keywords", keywordsArray);
  };

  const onSubmit = async (data: RegionFormData) => {
    setIsLoading(true);
    setError("");

    try {
      // Include image URLs in the region data - images are already uploaded!
      const regionData = {
        ...data,
        thumbnailUrl: thumbnailImage?.url || "",
        imageUrls: regionImages.map(img => img.url),
        primaryImageIndex: regionImages.length > 0 ? primaryImageIndex : 0,
      };

      // Create region using tRPC
      const createRegion = api.region.create.useMutation();
      await createRegion.mutateAsync(regionData);

      // Redirect to regions list
      router.push("/admin/regions");
    } catch (error) {
      console.error("Error creating region:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create region"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Create New Region</h1>
        <Link
          href="/admin/regions"
          className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Back to Regions
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Quick Thai Region Presets */}
        <div className="rounded-lg border bg-blue-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-blue-900">
            Quick Thai Region Presets
          </h3>
          <p className="mb-4 text-sm text-blue-700">
            Click on any region below to auto-fill the name and slug:
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {THAI_REGIONS.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setPresetRegion(region)}
                className="rounded-md bg-blue-100 px-3 py-2 text-sm text-blue-800 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Basic Information */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Region Name *
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="e.g., Bangkok"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                URL Slug *
              </label>
              <input
                {...register("slug")}
                type="text"
                placeholder="e.g., bangkok"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Used in URLs. Auto-generated from name, but you can customize it.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Describe this region..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Region Images */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Region Images</h3>
          
          {/* Thumbnail Upload - Ultra Small (30KB) */}
          <div className="mb-6">
            <h4 className="mb-2 text-md font-medium text-gray-800">Thumbnail</h4>
            <p className="mb-4 text-sm text-gray-600">
              Upload a thumbnail image that will be automatically compressed to 30KB or less. 
              This ensures fast loading times in region listings.
            </p>
            <UploadUltraSmallImage
              type="thumbnail"
              entityType="regions"
              value={thumbnailImage}
              onChange={handleThumbnailChange}
              label="Region Thumbnail (auto-compressed to 30KB)"
              helpText="Recommended: Square images work best for thumbnails"
              showInfo={true}
            />
          </div>

          {/* Region Images Upload - Regular (120KB) */}
          <div>
            <h4 className="mb-2 text-md font-medium text-gray-800">Gallery Images</h4>
            <p className="mb-4 text-sm text-gray-600">
              Upload region images that will be automatically compressed to 120KB or less. 
              You can upload up to 8 images to showcase your region.
            </p>
            <UploadImage
              type="images"
              entityType="regions"
              value={regionImages}
              onChange={handleRegionImagesChange}
              maxImages={8}
              label="Region Gallery Images (auto-compressed to 120KB each)"
              helpText="Upload multiple images to showcase your region"
              showInfo={true}
            />
          </div>

          {/* Primary Image Selection */}
          {regionImages.length > 1 && (
            <div className="mt-6">
              <h4 className="mb-2 text-md font-medium text-gray-800">Primary Image</h4>
              <p className="mb-4 text-sm text-gray-600">
                Select which image should be the primary display image for this region.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {regionImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative cursor-pointer rounded-lg border-2 p-2 ${
                      primaryImageIndex === index
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    onClick={() => handlePrimaryImageChange(index)}
                  >
                    <img
                      src={image.url}
                      alt={`Region image ${index + 1}`}
                      className="h-20 w-full rounded object-cover"
                    />
                    <div className="mt-2 text-center">
                      <span
                        className={`text-xs ${
                          primaryImageIndex === index
                            ? "font-semibold text-indigo-700"
                            : "text-gray-500"
                        }`}
                      >
                        {primaryImageIndex === index ? "★ Primary" : `Image ${index + 1}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Summary */}
        {(thumbnailImage || regionImages.length > 0) && (
          <div className="rounded-lg border bg-blue-50 p-4">
            <h4 className="mb-2 font-semibold text-blue-900">Upload Summary</h4>
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
              <div>
                <span className="font-medium">Thumbnail:</span>{" "}
                {thumbnailImage ? (
                  <span className="text-green-600">✓ Uploaded (30KB max)</span>
                ) : (
                  <span className="text-gray-500">Not uploaded</span>
                )}
              </div>
              <div>
                <span className="font-medium">Gallery Images:</span>{" "}
                {regionImages.length > 0 ? (
                  <span className="text-green-600">✓ {regionImages.length} image(s) (120KB max each)</span>
                ) : (
                  <span className="text-gray-500">No images uploaded</span>
                )}
              </div>
              <div>
                <span className="font-medium">Primary Image:</span>{" "}
                {regionImages.length > 0 ? (
                  <span className="text-green-600">✓ Image #{primaryImageIndex + 1}</span>
                ) : (
                  <span className="text-gray-500">No primary image</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SEO Information */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">SEO Information</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Meta Title
              </label>
              <input
                {...register("metaTitle")}
                type="text"
                placeholder="SEO title for search engines"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optimal length: 50-60 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Meta Description
              </label>
              <textarea
                {...register("metaDescription")}
                rows={3}
                placeholder="Brief description for search engines"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optimal length: 150-160 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Keywords
              </label>
              <input
                type="text"
                onChange={handleKeywordsChange}
                placeholder="muay thai, bangkok, thailand (comma separated)"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate keywords with commas
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/regions"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Region"}
          </button>
        </div>
      </form>
    </div>
  );
}
