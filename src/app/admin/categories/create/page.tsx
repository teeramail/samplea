"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { z } from "zod";

// Define the schema for category validation
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  thumbnailUrl: z.union([
    z.string().url(),
    z.string().length(0),
    z.null(),
    z.undefined()
  ]),
  imageUrls: z.array(z.string().url()).max(8).optional().default([]),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CreateCategoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    thumbnailUrl: "",
    imageUrls: [],
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: generateSlug(val)
    }));
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
    setUploadStatus("");
    
    try {
      // Upload thumbnail if present
      if (thumbnailFile) {
        setUploadStatus("Uploading thumbnail...");
        const thumbnailFormData = new FormData();
        thumbnailFormData.append("entityType", "category");
        thumbnailFormData.append("image", thumbnailFile);
        
        const thumbnailRes = await fetch("/api/upload-thumbnail", {
          method: "POST",
          body: thumbnailFormData,
        });
        
        const thumbnailData = await thumbnailRes.json();
        if (!thumbnailRes.ok) {
          throw new Error(thumbnailData.error || "Failed to upload thumbnail");
        }
        
        if (thumbnailData.urls && thumbnailData.urls.length > 0) {
          setFormData(prev => ({
            ...prev,
            thumbnailUrl: thumbnailData.urls[0]
          }));
        }
      }
      
      // Upload images if present
      if (imageFiles.length > 0) {
        setUploadStatus("Uploading images...");
        const imagesFormData = new FormData();
        imagesFormData.append("entityType", "category");
        
        imageFiles.forEach((file, index) => {
          imagesFormData.append(`image${index}`, file);
        });
        
        const imagesRes = await fetch("/api/upload", {
          method: "POST",
          body: imagesFormData,
        });
        
        const imagesData = await imagesRes.json();
        if (!imagesRes.ok) {
          throw new Error(imagesData.error || "Failed to upload images");
        }
        
        if (imagesData.urls && imagesData.urls.length > 0) {
          setFormData(prev => ({
            ...prev,
            imageUrls: imagesData.urls
          }));
        }
      }
      
      // Create the category with uploaded image URLs
      setUploadStatus("Creating category...");
      
      // Prepare the data for submission
      const categoryData = {
        ...formData,
        // Ensure thumbnailUrl is empty string if not set
        thumbnailUrl: formData.thumbnailUrl || "",
        // Ensure imageUrls is an array
        imageUrls: formData.imageUrls || [],
      };
      
      const res = await fetch("/api/temp-create-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      
      router.push("/admin/categories");
    } catch (err: any) {
      setErrors({ form: err.message });
    } finally {
      setIsSubmitting(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Category</h1>
      {errors.form && <p className="text-red-600 mb-4">{errors.form}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            className="mt-1 block w-full border rounded px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label className="block font-medium">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            className="mt-1 block w-full border rounded px-3 py-2"
            required
          />
          <p className="mt-1 text-sm text-gray-500">Used in URLs, must be unique</p>
        </div>
        
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1 block w-full border rounded px-3 py-2 h-24"
          />
        </div>
        
        {/* Thumbnail Upload */}
        <div>
          <label className="block font-medium mb-2">Thumbnail Image (Optional)</label>
          <div 
            {...getThumbRootProps()} 
            className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${errors.thumbnail ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'}`}
          >
            <input {...getThumbInputProps()} />
            {thumbnailFile ? (
              <div className="relative">
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32 overflow-hidden">
                    <img 
                      src={URL.createObjectURL(thumbnailFile)} 
                      alt="Thumbnail preview" 
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeThumbnail();
                      }}
                      className="absolute top-0 right-0 text-white bg-red-500 hover:bg-red-700 rounded-full p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {thumbnailFile.name} ({Math.round(thumbnailFile.size / 1024)}KB)
                </p>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-1 text-sm text-gray-500">Click or drag to upload a thumbnail (max 30KB)</p>
              </div>
            )}
            {errors.thumbnail && <p className="text-red-500 text-sm mt-1">{errors.thumbnail}</p>}
          </div>
        </div>
        
        {/* Multiple Images Upload */}
        <div>
          <label className="block font-medium mb-2">Additional Images (Optional)</label>
          <div 
            {...getImagesRootProps()} 
            className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${errors.images ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'}`}
          >
            <input {...getImagesInputProps()} />
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-1 text-sm text-gray-500">Click or drag to upload images (max 8, each max 120KB)</p>
            {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
          </div>
          
          {/* Preview of uploaded images */}
          {imageFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="relative w-full h-24 overflow-hidden rounded border">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Image ${index + 1}`} 
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute top-0 right-0 text-white bg-red-500 hover:bg-red-700 rounded-full p-1"
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
        
        <div className="flex justify-end space-x-3 pt-4">
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
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? uploadStatus || "Creating..." : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
