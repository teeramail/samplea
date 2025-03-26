"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define schema for event creation
const ticketTypeSchema = z.object({
  seatType: z.string().min(1, "Seat type is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  capacity: z.coerce.number().int().positive("Capacity must be greater than 0"),
  description: z.string().optional(),
});

const eventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  description: z.string().min(5, "Description must be at least 5 characters long"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  imageUrl: z.string().optional(),
  venueId: z.string().min(1, "Please select a venue"),
  regionId: z.string().min(1, "Please select a region"),
  ticketTypes: z.array(ticketTypeSchema).min(1, "At least one ticket type is required"),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [venues, setVenues] = useState<{ id: string; name: string; regionId?: string }[]>([]);
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(true);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);

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
      imageUrl: "",
      venueId: "",
      regionId: "",
      ticketTypes: [
        { seatType: "", price: 0, capacity: 0, description: "" }
      ]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketTypes",
  });

  // Fetch venues and regions when component mounts
  useEffect(() => {
    const fetchVenuesAndRegions = async () => {
      try {
        // Fetch venues
        setIsLoadingVenues(true);
        const venuesResponse = await fetch("/api/venues");
        if (!venuesResponse.ok) {
          throw new Error("Failed to load venues");
        }
        const venuesData = await venuesResponse.json();
        setVenues(venuesData);
        setIsLoadingVenues(false);

        // Fetch regions
        setIsLoadingRegions(true);
        const regionsResponse = await fetch("/api/regions");
        if (!regionsResponse.ok) {
          throw new Error("Failed to load regions");
        }
        const regionsData = await regionsResponse.json();
        setRegions(regionsData);
        setIsLoadingRegions(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load necessary data. Please try again later.");
        setIsLoadingVenues(false);
        setIsLoadingRegions(false);
      }
    };

    fetchVenuesAndRegions();
  }, []);

  // Watch for region changes to filter venues
  const selectedRegionId = watch("regionId");
  const filteredVenues = selectedRegionId
    ? venues.filter((venue) => venue.regionId === selectedRegionId)
    : venues;

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    setError("");

    try {
      // Format date and time for backend
      const eventDate = new Date(data.date);
      const startDateTime = new Date(`${data.date}T${data.startTime}`);
      const endDateTime = new Date(`${data.date}T${data.endTime}`);

      // Prepare the data for submission
      const eventData = {
        ...data,
        date: eventDate.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      router.push("/admin/events");
    } catch (error) {
      console.error("Error creating event:", error);
      setError("Failed to create event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTicketType = () => {
    append({ seatType: "", price: 0, capacity: 0, description: "" });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Event</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Event Details Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Event Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
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
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Event Date
              </label>
              <input
                id="date"
                type="date"
                {...register("date")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                {...register("startTime")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                End Time
              </label>
              <input
                id="endTime"
                type="time"
                {...register("endTime")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
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
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
              Event Poster URL (Optional)
            </label>
            <input
              id="imageUrl"
              type="text"
              {...register("imageUrl")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="https://example.com/image.jpg"
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>
            )}
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Event Location</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="regionId" className="block text-sm font-medium text-gray-700">
                Region
              </label>
              <select
                id="regionId"
                {...register("regionId")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={isLoadingRegions}
                onChange={(e) => {
                  setValue("regionId", e.target.value);
                  setValue("venueId", ""); // Reset venue when region changes
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
                <p className="mt-1 text-sm text-red-600">{errors.regionId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="venueId" className="block text-sm font-medium text-gray-700">
                Venue
              </label>
              <select
                id="venueId"
                {...register("venueId")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={isLoadingVenues || !selectedRegionId}
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
                <p className="mt-1 text-sm text-red-600">{errors.venueId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Types Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Ticket Types</h2>
            <button
              type="button"
              onClick={handleAddTicketType}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              + Add Ticket Type
            </button>
          </div>

          {errors.ticketTypes && errors.ticketTypes.root && (
            <p className="mb-4 text-sm text-red-600">{errors.ticketTypes.root.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Ticket Type #{index + 1}</h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="mt-1 text-sm text-red-600">{errors.ticketTypes[index]?.seatType?.message}</p>
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
                      <p className="mt-1 text-sm text-red-600">{errors.ticketTypes[index]?.price?.message}</p>
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
                      <p className="mt-1 text-sm text-red-600">{errors.ticketTypes[index]?.capacity?.message}</p>
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
            className="bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
} 