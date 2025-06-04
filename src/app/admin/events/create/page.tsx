"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { UploadImage } from "~/components/ui/UploadImage";
import { UploadUltraSmallImage } from "~/components/ui/UploadUltraSmallImage";

export const dynamic = "force-dynamic";

// Define schema for event creation
const ticketTypeSchema = z.object({
  seatType: z.string().min(1, "Seat type is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  capacity: z.coerce.number().int().positive("Capacity must be greater than 0"),
  description: z.string().optional(),
});

const eventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters long"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().optional(),
  ),
  venueId: z.string().min(1, "Please select a venue"),
  regionId: z.string().min(1, "Please select a region"),
  ticketTypes: z
    .array(ticketTypeSchema)
    .min(1, "At least one ticket type is required"),
});

type EventFormData = z.infer<typeof eventSchema>;

// Define types for API responses
type Venue = {
  id: string;
  name: string;
  address: string;
  capacity: number | null;
  regionId: string;
};

type Region = {
  id: string;
  name: string;
};

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(true);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);

  // Image State - using the shared upload components pattern
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      venueId: "",
      regionId: "",
      ticketTypes: [{ seatType: "", price: 0, capacity: 0, description: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketTypes",
  });

  // Fetch venues using tRPC
  const { data: venuesData, isLoading: isVenuesLoading, error: venuesError } = api.venue.list.useQuery({
    page: 1,
    limit: 100,
    sortField: "name",
    sortDirection: "asc",
  });

  // Fetch regions using tRPC
  const { data: regionsData, isLoading: isRegionsLoading, error: regionsError } = api.region.list.useQuery({
    page: 1,
    limit: 100,
    sortField: "name",
    sortDirection: "asc",
  });

  // Update state when data is loaded
  useEffect(() => {
    if (venuesData?.items) {
      const simplifiedVenues = venuesData.items.map(venue => ({
        id: venue.id,
        name: venue.name,
        address: venue.address,
        capacity: venue.capacity,
        regionId: venue.regionId,
      }));
      
      setVenues(simplifiedVenues as Venue[]);
      setIsLoadingVenues(false);
    }
    if (venuesError) {
      console.error("Error fetching venues:", venuesError);
      setError("Failed to load venues. Please try again later.");
      setIsLoadingVenues(false);
    }
  }, [venuesData, venuesError]);

  useEffect(() => {
    if (regionsData?.items) {
      const simplifiedRegions = regionsData.items.map(region => ({
        id: region.id,
        name: region.name,
      }));
      
      setRegions(simplifiedRegions as Region[]);
      setIsLoadingRegions(false);
    }
    if (regionsError) {
      console.error("Error fetching regions:", regionsError);
      setError("Failed to load regions. Please try again later.");
      setIsLoadingRegions(false);
    }
  }, [regionsData, regionsError]);

  // Set loading states based on tRPC loading states
  useEffect(() => {
    setIsLoadingVenues(isVenuesLoading);
    setIsLoadingRegions(isRegionsLoading);
  }, [isVenuesLoading, isRegionsLoading]);

  // Watch for region changes to filter venues
  const selectedRegionId = watch("regionId");
  
  // Filter venues based on selected region
  const filteredVenues = selectedRegionId
    ? venues.filter((venue) => venue.regionId === selectedRegionId)
    : [];

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    setError("");

    try {
      // Ensure date and startTime are valid before proceeding
      if (!data.date || !data.startTime) {
        throw new Error("Date and Start Time are required.");
      }

      // Format date and time for backend
      const startDateTime = new Date(`${data.date}T${data.startTime}`);

      // Handle optional endTime
      let endDateTimeISO: string | null = null;
      if (data.endTime) {
        const endDateTime = new Date(`${data.date}T${data.endTime}`);
        if (!isNaN(endDateTime.getTime())) {
          endDateTimeISO = endDateTime.toISOString();
        } else {
          console.warn("Could not parse end time, sending null.");
        }
      }

      // Check if startDateTime is valid
      if (isNaN(startDateTime.getTime())) {
        throw new Error("Invalid Start Date/Time combination.");
      }

      // Prepare Payload
      const eventData = {
        title: data.title,
        description: data.description,
        date: startDateTime.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTimeISO,
        venueId: data.venueId,
        regionId: data.regionId,
        ticketTypes: data.ticketTypes,
        thumbnailUrl: thumbnailUrl || null,
        imageUrls: imageUrls,
      };

      console.log("Submitting event data:", eventData);

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to create event");
      }

      router.push("/admin/events");
    } catch (error) {
      console.error("Error creating event:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create event. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTicketType = () => {
    append({ seatType: "", price: 0, capacity: 0, description: "" });
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        Create New Event
      </h1>

      {error && (
        <div
          className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Event Details Section */}
        <div className="mb-6 rounded-md bg-gray-50 p-4">
          <h2 className="mb-4 text-xl font-semibold">Event Details</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Event Title
              </label>
              <input
                id="title"
                type="text"
                {...register("title")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Muay Thai Championship Finals"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                Event Date
              </label>
              <input
                id="date"
                type="date"
                {...register("date")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.date.message}
                </p>
              )}
              <p className="mt-1 text-xs text-amber-600">
                Important: Use Christian Era (CE) calendar dates only. Do not use Buddhist Era (BE) dates.
              </p>
            </div>

            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-medium text-gray-700"
              >
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                {...register("startTime")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.startTime.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium text-gray-700"
              >
                End Time (Optional)
              </label>
              <input
                id="endTime"
                type="time"
                {...register("endTime")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Event Description
            </label>
            <textarea
              id="description"
              rows={3}
              {...register("description")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe the event details, fighters, and attractions"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        {/* Location Section */}
        <div className="mb-6 rounded-md bg-gray-50 p-4">
          <h2 className="mb-4 text-xl font-semibold">Event Location</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="regionId"
                className="block text-sm font-medium text-gray-700"
              >
                Region
              </label>
              <select
                id="regionId"
                {...register("regionId")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={isLoadingRegions}
                onChange={(e) => {
                  setValue("regionId", e.target.value, { shouldValidate: true });
                  setValue("venueId", "", { shouldValidate: true });
                }}
              >
                <option value="">Select a region</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              {isLoadingRegions && (
                <p className="mt-1 text-sm text-gray-500">Loading regions...</p>
              )}
              {errors.regionId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.regionId.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="venueId"
                className="block text-sm font-medium text-gray-700"
              >
                Venue
              </label>
              <select
                id="venueId"
                {...register("venueId")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={isLoadingVenues || !selectedRegionId || filteredVenues.length === 0}
              >
                <option value="">
                  {!selectedRegionId
                    ? "Select a region first"
                    : "Select a venue"}
                </option>
                {filteredVenues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              {isLoadingVenues && (
                <p className="mt-1 text-sm text-gray-500">Loading venues...</p>
              )}
              {errors.venueId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.venueId.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="mb-6 space-y-6 rounded-md bg-gray-50 p-4">
          <h2 className="mb-4 text-xl font-semibold">Images</h2>
          
          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail Image
              <span className="ml-1 text-xs text-gray-500">
                (Max 30KB, WebP format, only 1 image)
              </span>
            </label>
            <UploadUltraSmallImage
              type="thumbnail"
              value={thumbnailUrl ? thumbnailUrl : undefined}
              onChange={(data) => {
                if (data && !Array.isArray(data)) {
                  setThumbnailUrl(data.url);
                } else if (Array.isArray(data) && data.length > 0) {
                  setThumbnailUrl(data[0]?.url || "");
                } else {
                  setThumbnailUrl("");
                }
              }}
              entityType="event"
              maxImages={1}
            />
          </div>

          {/* Gallery Images Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Images
              <span className="ml-1 text-xs text-gray-500">
                (Max 120KB per image, WebP format, up to 8 images)
              </span>
            </label>
            <UploadImage
              type="images"
              value={imageUrls.length > 0 ? imageUrls : undefined}
              onChange={(data) => {
                if (Array.isArray(data)) {
                  setImageUrls(data.map(item => item.url));
                } else if (data && !Array.isArray(data)) {
                  setImageUrls([data.url]);
                } else {
                  setImageUrls([]);
                }
              }}
              entityType="event"
              maxImages={8}
            />
          </div>
        </div>

        {/* Ticket Types Section */}
        <div className="mb-6 rounded-md bg-gray-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Ticket Types</h2>
            <button
              type="button"
              onClick={handleAddTicketType}
              className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              + Add Ticket Type
            </button>
          </div>

          {errors.ticketTypes?.root && (
            <p className="mb-4 text-sm text-red-600">
              {errors.ticketTypes.root.message}
            </p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-md border border-gray-200 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium">Ticket Type #{index + 1}</h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Seat Type
                    </label>
                    <input
                      type="text"
                      {...register(`ticketTypes.${index}.seatType`)}
                      placeholder="e.g., VIP, Ringside, General"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {errors.ticketTypes?.[index]?.seatType && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.ticketTypes?.[index]?.seatType?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Price (THB)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`ticketTypes.${index}.price`)}
                      placeholder="e.g., 1500"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {errors.ticketTypes?.[index]?.price && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.ticketTypes?.[index]?.price?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register(`ticketTypes.${index}.capacity`)}
                      placeholder="e.g., 100"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {errors.ticketTypes?.[index]?.capacity && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.ticketTypes?.[index]?.capacity?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      {...register(`ticketTypes.${index}.description`)}
                      placeholder="e.g., Best seats in the house"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/events")}
            className="mr-3 rounded-md border border-gray-300 bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
