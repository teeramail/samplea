"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";

// Form validation schema
const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  skillLevel: z.string().optional(),
  duration: z.string().optional(),
  scheduleDetails: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  capacity: z.coerce
    .number()
    .int()
    .positive("Capacity must be a positive integer")
    .optional(),
  venueId: z.string().optional(),
  regionId: z.string().min(1, "Region is required"),
  instructorId: z.string().optional(),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional(),
  primaryImageIndex: z.number().default(0),
});

type CourseFormData = z.infer<typeof courseSchema>;

// Define types for API responses
type Region = { id: string; name: string };
type Venue = { id: string; name: string; regionId: string };
type Instructor = { id: string; name: string };

export default function CreateCoursePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for resources
  const [regions, setRegions] = useState<Region[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for image uploads
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [imageErrors, setImageErrors] = useState<Record<string, string | null>>({});

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        // Fetch regions
        const regionsResponse = await fetch("/api/regions");
        if (!regionsResponse.ok) throw new Error("Failed to fetch regions");
        const regionsData = (await regionsResponse.json()) as Region[];
        setRegions(regionsData);

        // Fetch venues
        const venuesResponse = await fetch("/api/venues");
        if (!venuesResponse.ok) throw new Error("Failed to fetch venues");
        const venuesData = (await venuesResponse.json()) as Venue[];
        setVenues(venuesData);
        setFilteredVenues([]); // Initialize with empty array until region is selected

        // Fetch instructors
        const instructorsResponse = await fetch("/api/instructors");
        if (!instructorsResponse.ok)
          throw new Error("Failed to fetch instructors");
        const instructorsData =
          (await instructorsResponse.json()) as Instructor[];
        setInstructors(instructorsData);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setError("Failed to load required resources. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResources();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    // reset is available but not used in this component
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      skillLevel: "Beginner",
      duration: "",
      scheduleDetails: "",
      price: 0,
      capacity: undefined,
      venueId: "",
      regionId: "",
      instructorId: "",
      isActive: true,
    },
  });
  
  // Watch for region changes to filter venues
  const selectedRegionId = watch("regionId");
  
  // Update filtered venues when region changes
  useEffect(() => {
    if (selectedRegionId) {
      const filtered = venues.filter(venue => venue.regionId === selectedRegionId);
      setFilteredVenues(filtered);
      
      // If the currently selected venue is not in the filtered list, reset it
      const currentVenueId = watch("venueId");
      if (currentVenueId && !filtered.some(v => v.id === currentVenueId)) {
        setValue("venueId", "");
      }
    } else {
      setFilteredVenues([]);
      setValue("venueId", "");
    }
  }, [selectedRegionId, venues, setValue, watch]);

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
        setImageErrors(prev => ({ ...prev, thumbnail: "Thumbnail must be less than 30KB" }));
        return;
      }
      // Only set if file exists
      if (file) {
        setThumbnailFile(file);
        setImageErrors(prev => ({ ...prev, thumbnail: null }));
      }
    },
    multiple: false,
    maxSize: 30 * 1024,
    accept: { 'image/*': [] }
  });
  
  // Dropzone for course images
  const {
    getRootProps: getImagesRootProps,
    getInputProps: getImagesInputProps
  } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const total = acceptedFiles.length;
      if (total + imageFiles.length > 8) {
        setImageErrors(prev => ({ ...prev, images: "Maximum 8 images allowed" }));
        return;
      }
      const oversized = acceptedFiles.filter(f => f.size > 120 * 1024);
      if (oversized.length) {
        setImageErrors(prev => ({ ...prev, images: `${oversized.length} image(s) exceed the 120KB limit` }));
        return;
      }
      setImageFiles(prev => [...prev, ...acceptedFiles]);
      setImageErrors(prev => ({ ...prev, images: null }));
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

  // Submit handler
  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    setError(null);
    setUploadStatus("Preparing to upload...");

    try {
      // Handle image uploads first
      let uploadedImageUrls: string[] = [];
      
      // Generate a temporary ID for grouping uploads
      const tempId = `course-${Date.now()}`;
      
      // Upload images if any exist
      if (thumbnailFile || imageFiles.length > 0) {
        setUploadStatus("Uploading images...");
        
        const formData = new FormData();
        formData.append("entityType", "course");
        formData.append("entityId", tempId);
        
        // Add thumbnail if exists
        if (thumbnailFile) {
          formData.append("thumbnail", thumbnailFile);
        }
        
        // Add all course images
        imageFiles.forEach(file => {
          formData.append("images", file);
        });
        
        // Send to our server API route
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload images");
        }
        
        const uploadResult = await uploadResponse.json();
        uploadedImageUrls = uploadResult.imageUrls || [];
        setUploadStatus("Images uploaded successfully");
      }
      
      // Create course via API
      setUploadStatus("Creating course...");
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          // Clean up optional fields
          venueId: data.venueId === "" ? null : data.venueId,
          instructorId: data.instructorId === "" ? null : data.instructorId,
          description: data.description ?? null,
          skillLevel: data.skillLevel ?? null,
          duration: data.duration ?? null,
          scheduleDetails: data.scheduleDetails ?? null,
          // Add image URLs from upload
          imageUrls: uploadedImageUrls,
          primaryImageIndex: 0, // First image is primary by default
        }),
      });

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ error: "Unknown error" }))) as { error?: string };
        throw new Error(errorData.error ?? "Failed to create course");
      }

      // Redirect on success
      router.push("/admin/courses");
    } catch (error) {
      console.error("Error creating course:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading resources...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Create Training Course
        </h1>
        <button
          onClick={() => router.push("/admin/courses")}
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-400 bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-lg bg-white p-6 shadow-md"
      >
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Course Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="w-full rounded-md border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., Beginner Muay Thai"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={4}
            className="w-full rounded-md border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Describe the course..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Skill Level */}
          <div>
            <label
              htmlFor="skillLevel"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Skill Level
            </label>
            <select
              id="skillLevel"
              {...register("skillLevel")}
              className="w-full rounded-md border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Skill Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>
            {errors.skillLevel && (
              <p className="mt-1 text-sm text-red-600">
                {errors.skillLevel.message}
              </p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label
              htmlFor="duration"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Duration
            </label>
            <input
              id="duration"
              type="text"
              {...register("duration")}
              className="w-full rounded-md border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 8 weeks, 60 minutes"
            />
            {errors.duration && (
              <p className="mt-1 text-sm text-red-600">
                {errors.duration.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Schedule Details */}
          <div>
            <label
              htmlFor="scheduleDetails"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Schedule Details
            </label>
            <input
              id="scheduleDetails"
              type="text"
              {...register("scheduleDetails")}
              className="w-full rounded-md border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., Mon-Fri 9am-11am"
            />
            {errors.scheduleDetails && (
              <p className="mt-1 text-sm text-red-600">
                {errors.scheduleDetails.message}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label
              htmlFor="price"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Price <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...register("price")}
              className="w-full rounded-md border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="0.00"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">
                {errors.price.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Capacity */}
          <div>
            <label
              htmlFor="capacity"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Capacity
            </label>
            <input
              id="capacity"
              type="number"
              min="1"
              {...register("capacity")}
              className="w-full rounded-md border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Maximum number of students"
            />
            {errors.capacity && (
              <p className="mt-1 text-sm text-red-600">
                {errors.capacity.message}
              </p>
            )}
          </div>

          {/* Region */}
          <div>
            <label
              htmlFor="regionId"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Region <span className="text-red-500">*</span>
            </label>
            <select
              id="regionId"
              {...register("regionId")}
              className="w-full rounded-md border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              onChange={(e) => {
                // Manually set the value and trigger validation
                setValue("regionId", e.target.value, { shouldValidate: true });
                // Reset venue selection when region changes
                setValue("venueId", "", { shouldValidate: true });
              }}
            >
              <option value="">Select Region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            {errors.regionId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.regionId.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Venue */}
          <div>
            <label
              htmlFor="venueId"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Venue
            </label>
            <select
              id="venueId"
              {...register("venueId")}
              className="w-full rounded-md border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              disabled={!selectedRegionId || filteredVenues.length === 0}
            >
              <option value="">
                {!selectedRegionId
                  ? "Select a region first"
                  : filteredVenues.length === 0
                  ? "No venues available in this region"
                  : "Select Venue (Optional)"}
              </option>
              {filteredVenues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
            {errors.venueId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.venueId.message}
              </p>
            )}
          </div>

          {/* Instructor */}
          <div>
            <label
              htmlFor="instructorId"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Instructor
            </label>
            <select
              id="instructorId"
              {...register("instructorId")}
              className="w-full rounded-md border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Instructor (Optional)</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
            {errors.instructorId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.instructorId.message}
              </p>
            )}
          </div>
        </div>
        
        {/* Image Upload Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Course Images</h3>
          
          {/* Thumbnail Upload */}
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
            {imageErrors.thumbnail && typeof imageErrors.thumbnail === 'string' && (
              <p className="mt-1 text-sm text-red-600">{imageErrors.thumbnail}</p>
            )}
          </div>
          
          {/* Additional Images Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Course Images (max 8 images, each max 120KB)
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
            {imageErrors.images && typeof imageErrors.images === 'string' && (
              <p className="mt-1 text-sm text-red-600">{imageErrors.images}</p>
            )}
            {imageFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Images:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Course image ${index + 1}`} 
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
        </div>

        {/* Status (Active) */}
        <div className="flex items-center">
          <input
            id="isActive"
            type="checkbox"
            {...register("isActive")}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor="isActive"
            className="ml-2 block text-sm text-gray-900"
          >
            Active (available for enrollment)
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="mr-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? uploadStatus || "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
