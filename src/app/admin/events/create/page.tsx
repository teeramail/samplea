"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().optional(),
  date: z.string().refine(value => !isNaN(Date.parse(value)), {
    message: "Please enter a valid date",
  }),
  startTime: z.string().refine(value => !isNaN(Date.parse(`1970-01-01T${value}`)), {
    message: "Please enter a valid time",
  }),
  endTime: z.string().refine(value => !isNaN(Date.parse(`1970-01-01T${value}`)), {
    message: "Please enter a valid time",
  }).optional(),
  venueId: z.string().min(1, "Please select a venue"),
  regionId: z.string().min(1, "Please select a region"),
  imageUrl: z.string().optional(),
  usesDefaultPoster: z.boolean().default(true),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<{ id: string; name: string; regionId?: string }[]>([]);
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0], // Today's date as default
      startTime: "19:00",
      endTime: "22:00",
      venueId: "",
      regionId: "",
      usesDefaultPoster: true,
    },
  });

  const selectedRegionId = watch('regionId');

  // Fetch venues and regions when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch regions
        const regionsResponse = await fetch("/api/regions");
        if (!regionsResponse.ok) throw new Error("Failed to fetch regions");
        const regionsData = await regionsResponse.json();
        setRegions(regionsData);
        
        // Fetch venues
        const venuesResponse = await fetch("/api/venues");
        if (!venuesResponse.ok) throw new Error("Failed to fetch venues");
        const venuesData = await venuesResponse.json();
        setVenues(venuesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      }
    };
    
    fetchData();
  }, []);

  // Filter venues by region
  const filteredVenues = selectedRegionId
    ? venues.filter(venue => venue.regionId === selectedRegionId)
    : venues;

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Format date properly to avoid conversion issues
      const formattedDate = new Date(data.date);
      
      // Create ISO string date value
      const dateISOString = formattedDate.toISOString();
      
      // Use the full date plus the time values for API
      const startTimeISO = `${data.date}T${data.startTime}:00`;
      const endTimeISO = data.endTime ? `${data.date}T${data.endTime}:00` : null;
      
      const eventData = {
        ...data,
        date: dateISOString,
        startTime: startTimeISO,
        endTime: endTimeISO,
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
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || "Failed to create event");
      }
      
      router.push("/admin/events");
      router.refresh();
    } catch (error) {
      console.error("Error creating event:", error);
      setError(error instanceof Error ? error.message : "Failed to create event. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Event Title
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register("description")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <label htmlFor="regionId" className="block text-sm font-medium text-gray-700">
              Region
            </label>
            <select
              id="regionId"
              {...register("regionId")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select a region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            {errors.regionId && (
              <p className="mt-1 text-sm text-red-600">{errors.regionId.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="venueId" className="block text-sm font-medium text-gray-700">
            Venue
          </label>
          <select
            id="venueId"
            {...register("venueId")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select a venue</option>
            {filteredVenues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
          {errors.venueId && (
            <p className="mt-1 text-sm text-red-600">{errors.venueId.message}</p>
          )}
          {selectedRegionId && filteredVenues.length === 0 && (
            <p className="mt-1 text-sm text-amber-600">No venues found in this region. Please select a different region or add a venue first.</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              End Time (optional)
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
        
        <div>
          <div className="flex items-center">
            <input
              id="usesDefaultPoster"
              type="checkbox"
              {...register("usesDefaultPoster")}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="usesDefaultPoster" className="ml-2 block text-sm text-gray-700">
              Use default poster image
            </label>
          </div>
        </div>
        
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