"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { z } from "zod";
import { uploadImages } from "~/lib/s3-upload";

// Define the schema for product validation
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  thumbnailUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
  isFeatured: z.boolean().default(false),
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
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create product mutation
  const createProduct = api.product.create.useMutation({
    onSuccess: () => {
      router.push("/admin/products");
      router.refresh();
    },
    onError: (error) => {
      setIsSubmitting(false);
      setErrors({ form: error.message });
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Check file size (30KB max)
      if (file.size > 30 * 1024) {
        setErrors({ thumbnail: "Thumbnail must be less than 30KB" });
        return;
      }
      setThumbnailFile(file);
      setErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Check file count (max 8)
      if (files.length > 8) {
        setErrors({ images: "Maximum 8 images allowed" });
        return;
      }
      // Check each file size (120KB max)
      const oversizedFiles = files.filter(file => file.size > 120 * 1024);
      if (oversizedFiles.length > 0) {
        setErrors({ images: `${oversizedFiles.length} image(s) exceed the 120KB limit` });
        return;
      }
      setImageFiles(files);
      setErrors((prev) => ({ ...prev, images: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setUploadStatus("Uploading files...");

    try {
      // Generate a temporary ID for grouping uploads
      const tempId = `product-${Date.now()}`;
      let thumbnailUrl = "";
      let productImageUrls: string[] = [];
      
      // 1. Upload thumbnail if provided
      if (thumbnailFile) {
        const thumbRes = await uploadImages([thumbnailFile], "product", tempId);
        if (!thumbRes.success) {
          throw new Error(thumbRes.error || "Failed to upload thumbnail");
        }
        thumbnailUrl = thumbRes.urls?.[0] || "";
      }
      
      // 2. Upload product images if provided
      if (imageFiles.length > 0) {
        const imagesRes = await uploadImages(imageFiles, "product", tempId);
        if (!imagesRes.success) {
          throw new Error(imagesRes.error || "Failed to upload product images");
        }
        productImageUrls = imagesRes.urls || [];
      }
      
      setUploadStatus("Creating product...");
      
      // 3. Create the product with the uploaded image URLs
      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        thumbnailUrl,
        imageUrls: productImageUrls,
        isFeatured: formData.isFeatured,
      };
      
      // Validate the data
      const validatedData = productSchema.parse(productData);
      
      // Submit to API
      createProduct.mutate(validatedData);
    } catch (error) {
      setIsSubmitting(false);
      setUploadStatus("");
      
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
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

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500">$</span>
            </div>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="block w-full rounded-md border border-gray-300 pl-7 pr-12 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Thumbnail Image (max 30KB)
          </label>
          <div className="mt-1 flex items-center space-x-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
          {errors.thumbnail && (
            <p className="mt-1 text-sm text-red-600">{errors.thumbnail}</p>
          )}
          {thumbnailFile && (
            <p className="mt-1 text-sm text-green-600">
              Selected: {thumbnailFile.name} ({Math.round(thumbnailFile.size / 1024)}KB)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Images (max 8 images, each max 120KB)
          </label>
          <div className="mt-1">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
          {errors.images && (
            <p className="mt-1 text-sm text-red-600">{errors.images}</p>
          )}
          {imageFiles.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-green-600">
                Selected {imageFiles.length} image(s):
              </p>
              <ul className="mt-1 text-xs text-gray-500">
                {imageFiles.map((file, index) => (
                  <li key={index}>
                    {file.name} ({Math.round(file.size / 1024)}KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

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
