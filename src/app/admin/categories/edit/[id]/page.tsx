"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Define the schema for category validation
const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  const { data: category, isLoading } = api.category.byId.useQuery({ id });
  
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    setValue,
    watch,
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: id,
      name: "",
      slug: "",
      description: "",
      thumbnailUrl: "",
      imageUrls: [],
    },
  });

  // Set form values when category data is loaded
  useEffect(() => {
    if (category) {
      reset({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        thumbnailUrl: category.thumbnailUrl || "",
        imageUrls: category.imageUrls || [],
      });
      
      if (category.thumbnailUrl) {
        setExistingThumbnail(category.thumbnailUrl);
      }
      
      if (category.imageUrls && category.imageUrls.length > 0) {
        setExistingImages(category.imageUrls);
      }
    }
  }, [category, reset]);

  // Auto-generate slug from name
  const name = watch("name");
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Update slug when name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setValue("name", newName);
    
    // Only auto-generate slug if it hasn't been manually edited
    const currentSlug = watch("slug");
    const oldGeneratedSlug = generateSlug(name);
    
    if (currentSlug === oldGeneratedSlug || currentSlug === "") {
      setValue("slug", generateSlug(newName));
    }
  };
  
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
        setExistingThumbnail(null);
        setErrors(prev => ({ ...prev, thumbnail: null }));
      }
    },
    multiple: false,
    maxSize: 30 * 1024,
    accept: { 'image/*': [] }
  });
  
  // Dropzone for category images
  const {
    getRootProps: getImagesRootProps,
    getInputProps: getImagesInputProps
  } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const total = acceptedFiles.length;
      if (total + imageFiles.length + existingImages.length > 8) {
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

  // Update category mutation
  const updateCategory = api.category.update.useMutation({
    onSuccess: () => {
      router.push("/admin/categories");
      router.refresh();
    },
    onError: (error) => {
      setIsSubmitting(false);
      setErrors({ form: error.message });
    },
  });

  // Remove new image from the list
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Remove existing image
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };
  
  // Remove thumbnail
  const removeThumbnail = () => {
    setThumbnailFile(null);
    setExistingThumbnail(null);
  };

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    setErrors({});
    setUploadStatus("Uploading files...");

    try {
      // Generate a temporary ID for grouping uploads
      const tempId = Math.random().toString(36).substring(2, 15);
      
      // 1. Upload thumbnail if exists
      let thumbnailUrl = existingThumbnail || "";
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append("file", thumbnailFile);
        formData.append("type", "category-thumbnail");
        formData.append("id", tempId);
        
        const thumbnailResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!thumbnailResponse.ok) {
          throw new Error("Failed to upload thumbnail");
        }
        
        const thumbnailData = await thumbnailResponse.json();
        thumbnailUrl = thumbnailData.url;
      }
      
      // 2. Upload new category images if exist
      let categoryImageUrls: string[] = [...existingImages];
      if (imageFiles.length > 0) {
        setUploadStatus(`Uploading images (0/${imageFiles.length})...`);
        
        for (let i = 0; i < imageFiles.length; i++) {
          const formData = new FormData();
          formData.append("file", imageFiles[i]);
          formData.append("type", "category-image");
          formData.append("id", tempId);
          
          const imageResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          
          if (!imageResponse.ok) {
            throw new Error(`Failed to upload image ${i + 1}`);
          }
          
          const imageData = await imageResponse.json();
          categoryImageUrls.push(imageData.url);
          
          setUploadStatus(`Uploading images (${i + 1}/${imageFiles.length})...`);
        }
      }
      
      setUploadStatus("Updating category...");
      
      // 3. Update the category with the uploaded image URLs
      const validatedData = categorySchema.parse({
        ...data,
        thumbnailUrl: thumbnailUrl,
        imageUrls: categoryImageUrls,
      });
      
      // Submit to API
      updateCategory.mutate(validatedData);
      
    } catch (error) {
      setIsSubmitting(false);
      if (error instanceof Error) {
        setErrors({ form: error.message });
      } else {
        setErrors({ form: "An unknown error occurred" });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
          <span className="ml-2">Loading category...</span>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Category not found
              </h3>
              <div className="mt-2 text-sm text-red-700">
                The category you are trying to edit does not exist.
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => router.push("/admin/categories")}
                  className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                >
                  Go back to categories
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit Category: {category.name}</h1>

      {errors.form && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error updating category
              </h3>
              <div className="mt-2 text-sm text-red-700">{errors.form}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category Name
            </label>
            <input
              type="text"
              {...register("name")}
              onChange={handleNameChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Slug
            </label>
            <input
              type="text"
              {...register("slug")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
            {formErrors.slug && (
              <p className="mt-1 text-sm text-red-600">{formErrors.slug.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Thumbnail Image (max 30KB)
          </label>
          <div
            {...getThumbRootProps()}
            className={`mt-1 flex justify-center rounded-md border-2 border-dashed px-6 pt-5 pb-6 ${
              thumbnailFile || existingThumbnail ? "border-green-300" : "border-gray-300"
            } hover:bg-gray-50 cursor-pointer`}
          >
            <input {...getThumbInputProps()} />
            <div className="space-y-1 text-center">
              {thumbnailFile ? (
                <div className="relative mx-auto h-32 w-32">
                  <img
                    src={URL.createObjectURL(thumbnailFile)}
                    alt="Thumbnail preview"
                    className="h-32 w-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeThumbnail();
                    }}
                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : existingThumbnail ? (
                <div className="relative mx-auto h-32 w-32">
                  <img
                    src={existingThumbnail}
                    alt="Existing thumbnail"
                    className="h-32 w-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeThumbnail();
                    }}
                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm text-gray-500">
                    Drag and drop a thumbnail image, or click to select
                  </p>
                </>
              )}
            </div>
          </div>
          {errors.thumbnail && (
            <p className="mt-1 text-sm text-red-600">{errors.thumbnail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category Images (max 8 images, each max 120KB)
          </label>
          <div
            {...getImagesRootProps()}
            className="mt-1 flex cursor-pointer justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-4 hover:bg-gray-50"
          >
            <input {...getImagesInputProps()} />
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-1 text-sm">
                {(imageFiles.length > 0 || existingImages.length > 0)
                  ? `${imageFiles.length + existingImages.length} image(s) selected. Drag more or click to add.` 
                  : "Drag & drop images here, or click to select"}
              </p>
            </div>
          </div>
          {errors.images && typeof errors.images === 'string' && (
            <p className="mt-1 text-sm text-red-600">{errors.images}</p>
          )}
          
          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Existing Images:</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {existingImages.map((imageUrl, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <img 
                      src={imageUrl} 
                      alt={`Category image ${index + 1}`} 
                      className="h-24 w-full rounded-md object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black bg-opacity-40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button 
                        type="button" 
                        onClick={() => removeExistingImage(index)}
                        className="rounded-full bg-red-500 p-1 text-white hover:bg-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* New images */}
          {imageFiles.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">New Images:</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {imageFiles.map((file, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Category image ${index + 1}`} 
                      className="h-24 w-full rounded-md object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black bg-opacity-40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="rounded-full bg-red-500 p-1 text-white hover:bg-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name} ({Math.round(file.size / 1024)}KB)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            {isSubmitting ? uploadStatus || "Updating..." : "Update Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
