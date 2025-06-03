"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { z } from "zod";
import { UploadImage, type UploadedImageData } from "~/components/ui/UploadImage";
import { UploadUltraSmallImage, type UploadedUltraSmallImageData } from "~/components/ui/UploadUltraSmallImage";

// Define the schema for product validation
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  thumbnailUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
  isFeatured: z.boolean().default(false),
  categoryId: z.string().min(1, "Primary category is required"),
  categoryIds: z.array(z.string()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function CreateProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    thumbnailUrl: "",
    imageUrls: [],
    isFeatured: false,
    categoryId: "",
    categoryIds: [],
  });
  
  // New state for uploaded images using our components
  const [thumbnailImage, setThumbnailImage] = useState<UploadedUltraSmallImageData | undefined>(undefined);
  const [productImages, setProductImages] = useState<UploadedImageData[]>([]);
  
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = api.category.list.useQuery({
    page: 1,
    limit: 100,
    sortField: "name",
    sortDirection: "asc",
  });

  // Create product mutation
  const createProduct = api.product.create.useMutation({
    onSuccess: (data) => {
      setIsSubmitting(false);
      router.push("/admin/products");
      router.refresh();
    },
    onError: (error) => {
      setIsSubmitting(false);
      setErrors({ form: error.message });
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "price") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle thumbnail upload change
  const handleThumbnailChange = (data: UploadedUltraSmallImageData | UploadedUltraSmallImageData[] | null) => {
    if (data && !Array.isArray(data)) {
      setThumbnailImage(data);
      setFormData(prev => ({ ...prev, thumbnailUrl: data.url }));
      setErrors(prev => ({ ...prev, thumbnail: null }));
    } else {
      setThumbnailImage(undefined);
      setFormData(prev => ({ ...prev, thumbnailUrl: "" }));
    }
  };

  // Handle product images upload change
  const handleProductImagesChange = (data: UploadedImageData | UploadedImageData[] | null) => {
    if (data) {
      const imagesArray = Array.isArray(data) ? data : [data];
      setProductImages(imagesArray);
      setFormData(prev => ({ ...prev, imageUrls: imagesArray.map(img => img.url) }));
      setErrors(prev => ({ ...prev, images: null }));
    } else {
      setProductImages([]);
      setFormData(prev => ({ ...prev, imageUrls: [] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setUploadStatus("Creating product...");

    try {
      // Validate the form data - images are already uploaded!
      const validatedData = productSchema.parse({
        ...formData,
        thumbnailUrl: thumbnailImage?.url || "",
        imageUrls: productImages.map(img => img.url),
        categoryId: formData.categoryId,
      });
      
      // Submit to API
      createProduct.mutate(validatedData);
    } catch (error) {
      setIsSubmitting(false);
      setUploadStatus("");
      
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            const path = String(err.path[0]);
            fieldErrors[path] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ form: error instanceof Error ? error.message : "An unexpected error occurred" });
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Create New Product</h1>

      {errors.form && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-600">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
        </div>
        
        {/* Price and Category */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price (THB)
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500">฿</span>
              </div>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
              Primary Category <span className="text-red-500">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select a primary category</option>
              {categories?.items.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
            )}
            {isLoadingCategories && (
              <p className="mt-1 text-sm text-gray-500">Loading categories...</p>
            )}
          </div>
        </div>

        {/* Thumbnail Upload - Ultra Small (30KB) */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Product Thumbnail</h3>
          <p className="mb-4 text-sm text-gray-600">
            Upload a thumbnail image that will be automatically compressed to 30KB or less. 
            This ensures fast loading times while maintaining good visual quality.
          </p>
          <UploadUltraSmallImage
            type="thumbnail"
            entityType="products"
            value={thumbnailImage}
            onChange={handleThumbnailChange}
            label="Product Thumbnail (auto-compressed to 30KB)"
            helpText="Recommended: Square images work best for thumbnails"
            showInfo={true}
          />
          {errors.thumbnail && (
            <p className="mt-1 text-sm text-red-600">{errors.thumbnail}</p>
          )}
        </div>

        {/* Product Images Upload - Regular (120KB) */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Product Images</h3>
          <p className="mb-4 text-sm text-gray-600">
            Upload product images that will be automatically compressed to 120KB or less. 
            You can upload up to 8 images for your product gallery.
          </p>
          <UploadImage
            type="images"
            entityType="products"
            value={productImages}
            onChange={handleProductImagesChange}
            maxImages={8}
            label="Product Gallery Images (auto-compressed to 120KB each)"
            helpText="Upload multiple images to showcase your product from different angles"
            showInfo={true}
          />
          {errors.images && (
            <p className="mt-1 text-sm text-red-600">{errors.images}</p>
          )}
        </div>

        {/* Additional Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Categories
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {categories?.items.map((category) => (
              <div key={category.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  name="categoryIds"
                  value={category.id}
                  checked={formData.categoryIds?.includes(category.id) || false}
                  onChange={(e) => {
                    const value = e.target.value;
                    const isChecked = e.target.checked;
                    
                    setFormData((prev) => {
                      const currentCategoryIds = prev.categoryIds || [];
                      if (isChecked) {
                        return { ...prev, categoryIds: [...currentCategoryIds, value] };
                      } else {
                        return { ...prev, categoryIds: currentCategoryIds.filter(id => id !== value) };
                      }
                    });
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Select additional categories this product should appear in
          </p>
        </div>

        {/* Featured Product */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            checked={formData.isFeatured}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor="isFeatured"
            className="ml-2 block text-sm text-gray-700"
          >
            Feature this product on the homepage
          </label>
        </div>

        {/* Image Summary */}
        {(thumbnailImage || productImages.length > 0) && (
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
                {productImages.length > 0 ? (
                  <span className="text-green-600">✓ {productImages.length} image(s) (120KB max each)</span>
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
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? uploadStatus || "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
