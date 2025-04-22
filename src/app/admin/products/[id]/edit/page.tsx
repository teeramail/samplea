"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { z } from "zod";
import Image from "next/image";
import { useParams } from "next/navigation";

// Define the schema for product validation
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  thumbnailUrl: z.string().url().optional().nullable(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
  isFeatured: z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    thumbnailUrl: null,
    imageUrls: [],
    isFeatured: false,
  });
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch product data
  const { data: product, isLoading: isProductLoading } = api.product.getById.useQuery({ id });
  
  // Update mutation
  const updateProduct = api.product.update.useMutation({
    onSuccess: () => {
      router.push("/admin/products");
      router.refresh();
    },
    onError: (error) => {
      setIsSubmitting(false);
      setErrors({ form: error.message });
    },
  });
  
  // Delete mutation
  const deleteProduct = api.product.delete.useMutation({
    onSuccess: () => {
      router.push("/admin/products");
      router.refresh();
    },
  });

  // Load product data into form
  useEffect(() => {
    if (product && !isProductLoading) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        thumbnailUrl: (product as any).thumbnailUrl || null,
        imageUrls: product.imageUrls || [],
        isFeatured: product.isFeatured,
      });
      setIsLoading(false);
    }
  }, [product, isProductLoading]);

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
        setErrors({ ...errors, thumbnail: "Thumbnail must be less than 30KB" });
        return;
      }
      setThumbnailFile(file);
      setErrors({ ...errors, thumbnail: null });
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      // Check file count (max 8)
      if (files.length > 8) {
        setErrors({ ...errors, images: "Maximum 8 images allowed" });
        return;
      }
      // Check each file size (120KB max)
      const oversizedFiles = files.filter(file => file.size > 120 * 1024);
      if (oversizedFiles.length > 0) {
        setErrors({ ...errors, images: `${oversizedFiles.length} image(s) exceed the 120KB limit` });
        return;
      }
      setImageFiles(files);
      setErrors({ ...errors, images: null });
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setUploadStatus("Uploading files...");

    try {
      // Generate a temporary ID for grouping uploads
      const tempId = `product-${id}-${Date.now()}`;
      let thumbnailUrl = formData.thumbnailUrl || "";
      let productImageUrls = formData.imageUrls || [];
      
      // Upload images via the server API route
      if (thumbnailFile || imageFiles.length > 0) {
        const formDataObj = new FormData();
        formDataObj.append("entityType", "product");
        formDataObj.append("entityId", tempId);
        
        // Add thumbnail if exists
        if (thumbnailFile) {
          formDataObj.append("thumbnail", thumbnailFile);
        }
        
        // Add all product images
        imageFiles.forEach(file => {
          formDataObj.append("images", file);
        });
        
        // Send to our server API route
        const uploadResponse = await fetch("/api/product-images", {
          method: "POST",
          body: formDataObj,
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Failed to upload images");
        }
        
        const uploadResult = await uploadResponse.json();
        
        // Only update URLs if we got new ones
        if (uploadResult.thumbnailUrl) {
          thumbnailUrl = uploadResult.thumbnailUrl;
        }
        
        if (uploadResult.imageUrls && Array.isArray(uploadResult.imageUrls) && uploadResult.imageUrls.length > 0) {
          // Append new images to existing ones
          productImageUrls = [...productImageUrls, ...uploadResult.imageUrls];
        }
      }
      
      setUploadStatus("Updating product...");
      
      // Update the product with the uploaded image URLs
      updateProduct.mutate({
        id,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        thumbnailUrl,
        imageUrls: productImageUrls,
        isFeatured: formData.isFeatured,
      });
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

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate({ id });
    }
  };

  if (isLoading || isProductLoading) {
    return <div className="flex justify-center p-8">Loading product data...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Delete Product
        </button>
      </div>

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
            Current Thumbnail
          </label>
          {formData.thumbnailUrl ? (
            <div className="mt-2 relative h-40 w-40">
              <Image
                src={formData.thumbnailUrl}
                alt="Current thumbnail"
                fill
                className="object-cover rounded-md"
              />
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-500">No thumbnail set</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload New Thumbnail (max 30KB)
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Product Images
          </label>
          {formData.imageUrls && formData.imageUrls.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {formData.imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="relative h-32 w-full">
                    <Image
                      src={url}
                      alt={`Product image ${index + 1}`}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No product images</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload Additional Images (max 8 images, each max 120KB)
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
            {isSubmitting ? uploadStatus || "Updating..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
