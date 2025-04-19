"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
});

type CourseFormData = z.infer<typeof courseSchema>;

// Define types for API responses
type Region = { id: string; name: string };
type Venue = { id: string; name: string };
type Instructor = { id: string; name: string };

export default function CreateCoursePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for resources
  const [regions, setRegions] = useState<Region[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Submit handler
  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create course via API
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
            >
              <option value="">Select Venue (Optional)</option>
              {venues.map((venue) => (
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
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
