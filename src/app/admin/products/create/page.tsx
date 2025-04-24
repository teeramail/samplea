"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { z } from "zod";
import { useDropzone } from "react-dropzone";

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
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dropzone for thumbnail
  const {
    getRootProps: getThumbRootProps,
    getInputProps: getThumbInputProps
  } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      // Safely access the first file
      const file = acceptedFiles[0];
      // Check file size (30KB max)
      if (file && file.size > 30 * 1024) {
        setErrors(prev => ({ ...prev, thumbnail: "Thumbnail must be less than 30KB" }));
        return;
      }
      // Only set if file exists
      if (file) {
        setThumbnailFile(file);
        setErrors(prev => ({ ...prev, thumbnail: null }));
      }
    },
    multiple: false,
    maxSize: 30 * 1024,
    accept: { 'image/*': [] }
  });
  
  // Dropzone for product images
  const {
    getRootProps: getImagesRootProps,
    getInputProps: getImagesInputProps
  } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const total = acceptedFiles.length;
      if (total + imageFiles.length > 8) {
        setErrors(prev => ({ ...prev, images: "Maximum 8 images allowed" }));
        return;
      }
      const oversized = acceptedFiles.filter(f => f.size > 120 * 1024);
      if (oversized.length) {
        setErrors(prev => ({ ...prev, images: `${oversized.length} image(s) exceed the 120KB limit` }));
        return;
      }
      setImageFiles(prev => [...prev, ...acceptedFiles]);
      setErrors(prev => ({ ...prev, images: null }));
    },
    multiple: true,
    maxSize: 120 * 1024,
    accept: { 'image/*': [] }
  });

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = api.category.list.useQuery({
    page: 1,
    limit: 100,
    sortField: "name",
    sortDirection: "asc",
  });

  // Create product-to-category association mutation
  const setProductCategories = api.productToCategory.setProductCategories.useMutation();

  // Create product mutation
  const createProduct = api.product.create.useMutation({
    onSuccess: (data) => {
      // If we have additional categories, create the associations
      if (formData.categoryIds && formData.categoryIds.length > 0) {
        // Make sure the primary category is included
        const allCategoryIds = [...formData.categoryIds];
        if (!allCategoryIds.includes(formData.categoryId)) {
          allCategoryIds.push(formData.categoryId);
        }
        
        setProductCategories.mutate({
          productId: data.id,
          categoryIds: allCategoryIds,
        });
      }
      
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

  // Remove image from the list
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Remove thumbnail
  const removeThumbnail = () => {
    setThumbnailFile(null);
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
      
      // Upload images via the server API route
      if (thumbnailFile || imageFiles.length > 0) {
        setUploadStatus("Uploading files to server...");
        
        const formData = new FormData();
        formData.append("entityType", "product");
        formData.append("entityId", tempId);
        
        // Add thumbnail if exists
        if (thumbnailFile) {
          formData.append("thumbnail", thumbnailFile);
        }
        
        // Add all product images
        imageFiles.forEach(file => {
          formData.append("images", file);
        });
        
        // Send to our server API route
        const uploadResponse = await fetch("/api/product-images", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Failed to upload images");
        }
        
        const uploadResult = await uploadResponse.json();
        thumbnailUrl = uploadResult.thumbnailUrl || "";
        productImageUrls = uploadResult.imageUrls || [];
      }
      
      setUploadStatus("Creating product...");
      
      // 3. Create the product with the uploaded image URLs
      const validatedData = productSchema.parse({
        ...formData,
        thumbnailUrl: thumbnailUrl,
        imageUrls: productImageUrls,
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
            const path = String(err.path[0]); // Convert to string to ensure it's a valid index
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
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              required
            />
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
          <div 
            {...getThumbRootProps()} 
            className="mt-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md text-gray-500 hover:border-indigo-500 cursor-pointer transition-colors"
          >
            <input {...getThumbInputProps()} />
            {thumbnailFile ? (
              <div className="flex flex-col items-center">
                <img 
                  src={URL.createObjectURL(thumbnailFile)} 
                  alt="Thumbnail preview" 
                  className="h-24 w-auto object-contain mb-2"
                />
                <div className="flex items-center">
                  <span className="text-sm">
                    {thumbnailFile.name} ({Math.round(thumbnailFile.size / 1024)}KB)
                  </span>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeThumbnail();
                    }}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg className="h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-1 text-sm">Drag & drop thumbnail here, or click to select</p>
              </div>
            )}
          </div>
          {errors.thumbnail && typeof errors.thumbnail === 'string' && (
            <p className="mt-1 text-sm text-red-600">{errors.thumbnail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Images (max 8 images, each max 120KB)
          </label>
          <div 
            {...getImagesRootProps()} 
            className="mt-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md text-gray-500 hover:border-indigo-500 cursor-pointer transition-colors"
          >
            <input {...getImagesInputProps()} />
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-1 text-sm">
                {imageFiles.length > 0 
                  ? `${imageFiles.length} image(s) selected. Drag more or click to add.` 
                  : "Drag & drop images here, or click to select"}
              </p>
            </div>
          </div>
          {errors.images && typeof errors.images === 'string' && (
            <p className="mt-1 text-sm text-red-600">{errors.images}</p>
          )}
          {imageFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Selected Images:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Product image ${index + 1}`} 
                      className="h-24 w-full object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="text-white bg-red-500 hover:bg-red-700 rounded-full p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name} ({Math.round(file.size / 1024)}KB)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
