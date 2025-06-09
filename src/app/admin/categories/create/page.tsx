"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { api } from "~/trpc/react";
import { UploadImage, type UploadedImageData } from "~/components/ui/UploadImage";
import { UploadUltraSmallImage, type UploadedUltraSmallImageData } from "~/components/ui/UploadUltraSmallImage";

// Define the schema for category validation
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CreateCategoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Upload states using our shared components
  const [thumbnailImage, setThumbnailImage] = useState<UploadedUltraSmallImageData | undefined>(undefined);
  const [categoryImages, setCategoryImages] = useState<UploadedImageData[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  // Watch name field to auto-generate slug
  const name = watch("name");
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("name", val);
    setValue("slug", generateSlug(val));
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

  // Handle category images upload change
  const handleCategoryImagesChange = (data: UploadedImageData | UploadedImageData[] | null) => {
    if (data) {
      const imagesArray = Array.isArray(data) ? data : [data];
      setCategoryImages(imagesArray);
      setValue("imageUrls", imagesArray.map(img => img.url));
    } else {
      setCategoryImages([]);
      setValue("imageUrls", []);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      // Include image URLs in the category data - images are already uploaded!
      const categoryData = {
        ...data,
        thumbnailUrl: thumbnailImage?.url || "",
        imageUrls: categoryImages.map(img => img.url),
      };

      // Create category using tRPC
      const createCategory = api.category.create.useMutation();
      await createCategory.mutateAsync(categoryData);

      // Redirect to categories list
      router.push("/admin/categories");
    } catch (error) {
      console.error("Error creating category:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create category"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Create New Category</h1>

      {submitError && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-600">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category Name *
            </label>
            <input
              {...register("name")}
              onChange={handleNameChange}
              type="text"
              placeholder="e.g., Training Equipment"
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
              placeholder="e.g., training-equipment"
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

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Describe this category..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Thumbnail Upload - Ultra Small (30KB) */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Category Thumbnail</h3>
          <p className="mb-4 text-sm text-gray-600">
            Upload a thumbnail image that will be automatically compressed to 30KB or less. 
            This ensures fast loading times in category listings.
          </p>
          <UploadUltraSmallImage
            type="thumbnail"
            entityType="categories"
            value={thumbnailImage}
            onChange={handleThumbnailChange}
            label="Category Thumbnail (auto-compressed to 30KB)"
            helpText="Recommended: Square images work best for thumbnails"
            showInfo={true}
          />
        </div>

        {/* Category Images Upload - Regular (120KB) */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Category Images</h3>
          <p className="mb-4 text-sm text-gray-600">
            Upload category images that will be automatically compressed to 120KB or less. 
            You can upload up to 8 images to showcase your category.
          </p>
          <UploadImage
            type="images"
            entityType="categories"
            value={categoryImages}
            onChange={handleCategoryImagesChange}
            maxImages={8}
            label="Category Gallery Images (auto-compressed to 120KB each)"
            helpText="Upload multiple images to showcase your category"
            showInfo={true}
          />
        </div>

        {/* Image Summary */}
        {(thumbnailImage || categoryImages.length > 0) && (
          <div className="rounded-lg border bg-blue-50 p-4">
            <h4 className="mb-2 font-semibold text-blue-900">Upload Summary</h4>
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
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
                {categoryImages.length > 0 ? (
                  <span className="text-green-600">✓ {categoryImages.length} image(s) (120KB max each)</span>
                ) : (
                  <span className="text-gray-500">No images uploaded</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
