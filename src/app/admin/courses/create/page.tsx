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
  thumbnailUrl: z.string().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
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
  const [submitError, setSubmitError] = useState<string | null>(null);

  // State for resources
  const [regions, setRegions] = useState<Region[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload states using our shared components
  const [thumbnailImage, setThumbnailImage] = useState<UploadedUltraSmallImageData | undefined>(undefined);
  const [courseImages, setCourseImages] = useState<UploadedImageData[]>([]);

  // Fetch resources using tRPC
  const { data: regionsData, isLoading: isLoadingRegions } =
    api.region.list.useQuery({
      limit: 100,
    });
  const { data: venuesData, isLoading: isLoadingVenues } =
    api.venue.list.useQuery({
      page: 1,
      limit: 100,
      sortField: "name",
      sortDirection: "asc",
    });
  const { data: instructorsData, isLoading: isLoadingInstructors } =
    api.instructor.list.useQuery({
      limit: 100,
    });

  useEffect(() => {
    if (regionsData?.items) {
      setRegions(regionsData.items);
    }
    if (venuesData?.items) {
      setVenues(venuesData.items);
    }
    if (instructorsData?.items) {
      setInstructors(instructorsData.items);
    }
    if (!isLoadingRegions && !isLoadingVenues && !isLoadingInstructors) {
      setIsLoading(false);
    }
  }, [regionsData, venuesData, instructorsData, isLoadingRegions, isLoadingVenues, isLoadingInstructors]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
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

  // Handle course images upload change
  const handleCourseImagesChange = (data: UploadedImageData | UploadedImageData[] | null) => {
    if (data) {
      const imagesArray = Array.isArray(data) ? data : [data];
      setCourseImages(imagesArray);
      setValue("imageUrls", imagesArray.map(img => img.url));
    } else {
      setCourseImages([]);
      setValue("imageUrls", []);
    }
  };

  // Submit handler
  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Include image URLs in the course data - images are already uploaded!
      const courseData = {
        ...data,
        // Clean up optional fields - convert null to undefined
        venueId: data.venueId === "" ? undefined : data.venueId,
        instructorId: data.instructorId === "" ? undefined : data.instructorId,
        description: data.description || undefined,
        skillLevel: data.skillLevel || undefined,
        duration: data.duration || undefined,
        scheduleDetails: data.scheduleDetails || undefined,
        thumbnailUrl: thumbnailImage?.url || "",
        imageUrls: courseImages.map(img => img.url),
        primaryImageIndex: 0, // First image is primary by default
      };

      // Create course using tRPC
      const createCourse = api.trainingCourse.create.useMutation();
      await createCourse.mutateAsync(courseData);

      // Redirect on success
      router.push("/admin/courses");
    } catch (error) {
      console.error("Error creating course:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading resources...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Create Training Course</h1>
        <Link
          href="/admin/courses"
          className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Back to Courses
        </Link>
      </div>

      {submitError && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
          
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Course Title *
            </label>
            <input
              {...register("title")}
              type="text"
              placeholder="e.g., Beginner Muay Thai"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Describe the course..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Skill Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Skill Level
              </label>
              <select
                {...register("skillLevel")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
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
              <label className="block text-sm font-medium text-gray-700">
                Duration
              </label>
              <input
                {...register("duration")}
                type="text"
                placeholder="e.g., 8 weeks, 60 minutes"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.duration.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Schedule Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Schedule Details
              </label>
              <input
                {...register("scheduleDetails")}
                type="text"
                placeholder="e.g., Mon-Fri 9am-11am"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors.scheduleDetails && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.scheduleDetails.message}
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price *
              </label>
              <input
                {...register("price")}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.price.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Location & Capacity */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Location & Capacity</h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Capacity
              </label>
              <input
                {...register("capacity")}
                type="number"
                min="1"
                placeholder="Maximum number of students"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.capacity.message}
                </p>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Region *
              </label>
              <select
                {...register("regionId")}
                onChange={(e) => {
                  // Manually set the value and trigger validation
                  setValue("regionId", e.target.value, { shouldValidate: true });
                  // Reset venue selection when region changes
                  setValue("venueId", "", { shouldValidate: true });
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
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

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Venue */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Venue
              </label>
              <select
                {...register("venueId")}
                disabled={!selectedRegionId || filteredVenues.length === 0}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:bg-gray-100"
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
              <label className="block text-sm font-medium text-gray-700">
                Instructor
              </label>
              <select
                {...register("instructorId")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
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
        </div>

        {/* Course Images */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Course Images</h3>
          
          {/* Thumbnail Upload - Ultra Small (30KB) */}
          <div className="mb-6">
            <h4 className="mb-2 text-md font-medium text-gray-800">Thumbnail</h4>
            <p className="mb-4 text-sm text-gray-600">
              Upload a thumbnail image that will be automatically compressed to 30KB or less. 
              This ensures fast loading times in course listings.
            </p>
            <UploadUltraSmallImage
              type="thumbnail"
              entityType="courses"
              value={thumbnailImage}
              onChange={handleThumbnailChange}
              label="Course Thumbnail (auto-compressed to 30KB)"
              helpText="Recommended: Square images work best for thumbnails"
              showInfo={true}
            />
          </div>

          {/* Course Images Upload - Regular (120KB) */}
          <div>
            <h4 className="mb-2 text-md font-medium text-gray-800">Gallery Images</h4>
            <p className="mb-4 text-sm text-gray-600">
              Upload course images that will be automatically compressed to 120KB or less. 
              You can upload up to 8 images to showcase your course.
            </p>
            <UploadImage
              type="images"
              entityType="courses"
              value={courseImages}
              onChange={handleCourseImagesChange}
              maxImages={8}
              label="Course Gallery Images (auto-compressed to 120KB each)"
              helpText="Upload multiple images to showcase your course"
              showInfo={true}
            />
          </div>
        </div>

        {/* Image Summary */}
        {(thumbnailImage || courseImages.length > 0) && (
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
                {courseImages.length > 0 ? (
                  <span className="text-green-600">✓ {courseImages.length} image(s) (120KB max each)</span>
                ) : (
                  <span className="text-gray-500">No images uploaded</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Course Status */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Course Status</h2>
          
          <div className="flex items-center">
            <input
              {...register("isActive")}
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Active (available for enrollment)
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/courses"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
