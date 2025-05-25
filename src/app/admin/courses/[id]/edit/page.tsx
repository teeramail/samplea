"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { api } from "~/trpc/react";

// Course form schema
const courseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  skillLevel: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  scheduleDetails: z.string().optional().nullable(),
  price: z.number().positive("Price must be positive"),
  capacity: z.number().int().positive().optional().nullable(),
  venueId: z.string().optional().nullable(),
  regionId: z.string(),
  instructorId: z.string().optional().nullable(),
  imageUrls: z.array(z.string().url()).optional(),
  primaryImageIndex: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean(),
});

type CourseFormData = z.infer<typeof courseFormSchema>;

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      isActive: true,
      imageUrls: [],
      primaryImageIndex: 0,
    },
  });

  // Query to get the course by ID
  const { data: courseData, error: courseError, isLoading: isCourseLoading } = api.trainingCourse.getById.useQuery(
    { id: courseId },
    { enabled: !!courseId }
  );
  
  // Update form when data is loaded
  useEffect(() => {
    if (courseData) {
      reset({
        title: courseData.title,
        description: courseData.description,
        skillLevel: courseData.skillLevel,
        duration: courseData.duration,
        scheduleDetails: courseData.scheduleDetails,
        price: courseData.price,
        capacity: courseData.capacity,
        venueId: courseData.venueId,
        regionId: courseData.regionId,
        instructorId: courseData.instructorId,
        imageUrls: courseData.imageUrls || [],
        primaryImageIndex: courseData.primaryImageIndex,
        isActive: courseData.isActive,
      });
      setIsLoading(false);
    } else if (courseError) {
      setIsLoading(false);
    }
  }, [courseData, courseError, reset]);

  // Fetch regions, instructors, and venues for dropdown selections
  const { data: regions } = api.region.list.useQuery();
  const { data: instructors } = api.instructor.list.useQuery();
  const { data: venues } = api.venue.list.useQuery();

  // Update course mutation
  const updateCourseMutation = api.trainingCourse.update.useMutation({
    onSuccess: () => {
      router.push("/admin/courses");
    },
    onError: (error) => {
      setSubmitError(error.message);
      setIsSubmitting(false);
    },
  });

  // Form submission handler
  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    // Convert null values to undefined for API compatibility
    const apiData = {
      id: courseId,
      title: data.title,
      description: data.description || undefined,
      skillLevel: data.skillLevel || undefined,
      duration: data.duration || undefined,
      scheduleDetails: data.scheduleDetails || undefined,
      price: data.price,
      capacity: data.capacity || undefined,
      venueId: data.venueId || undefined,
      regionId: data.regionId,
      instructorId: data.instructorId || undefined,
      imageUrls: data.imageUrls || undefined,
      primaryImageIndex: data.primaryImageIndex || undefined,
      isActive: data.isActive
    };

    updateCourseMutation.mutate(apiData);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          <p className="mt-4">Loading course data...</p>
        </div>
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="container mx-auto p-4">
        <div className="rounded-lg bg-red-100 p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-800">Error Loading Course</h1>
          <p className="text-red-700">{courseError.message}</p>
          <Link 
            href="/admin/courses" 
            className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Return to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Course</h1>
        <Link 
          href="/admin/courses" 
          className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          Back to Courses
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Title */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("title")}
                className="w-full rounded-md border border-gray-300 p-2"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                rows={4}
                {...register("description")}
                className="w-full rounded-md border border-gray-300 p-2"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-300 p-2"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label className="mb-1 block text-sm font-medium">Capacity</label>
              <input
                type="number"
                {...register("capacity", { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-300 p-2"
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Region <span className="text-red-500">*</span>
              </label>
              <select
                {...register("regionId")}
                className="w-full rounded-md border border-gray-300 p-2"
              >
                <option value="">Select a region</option>
                {regions?.items?.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              {errors.regionId && (
                <p className="mt-1 text-sm text-red-600">{errors.regionId.message}</p>
              )}
            </div>

            {/* Instructor */}
            <div>
              <label className="mb-1 block text-sm font-medium">Instructor</label>
              <select
                {...register("instructorId")}
                className="w-full rounded-md border border-gray-300 p-2"
              >
                <option value="">Select an instructor</option>
                {instructors?.items?.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Venue */}
            <div>
              <label className="mb-1 block text-sm font-medium">Venue</label>
              <select
                {...register("venueId")}
                className="w-full rounded-md border border-gray-300 p-2"
              >
                <option value="">Select a venue</option>
                {venues?.items?.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Skill Level */}
            <div>
              <label className="mb-1 block text-sm font-medium">Skill Level</label>
              <input
                type="text"
                {...register("skillLevel")}
                className="w-full rounded-md border border-gray-300 p-2"
                placeholder="e.g., Beginner, Intermediate, Advanced"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="mb-1 block text-sm font-medium">Duration</label>
              <input
                type="text"
                {...register("duration")}
                className="w-full rounded-md border border-gray-300 p-2"
                placeholder="e.g., 2 hours, 8 weeks"
              />
            </div>

            {/* Schedule Details */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Schedule Details</label>
              <textarea
                {...register("scheduleDetails")}
                className="w-full rounded-md border border-gray-300 p-2"
                placeholder="e.g., Every Monday and Wednesday, 7-9 PM"
              />
            </div>

            {/* Is Active */}
            <div className="col-span-1">
              <label className="mb-1 flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <span className="text-sm font-medium">Active Course</span>
              </label>
              <p className="text-xs text-gray-500">
                Only active courses are visible to customers
              </p>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {submitError && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-red-600">
            <p>{submitError}</p>
          </div>
        )}
      </form>
    </div>
  );
}
