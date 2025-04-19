"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { use } from "react";

// Define schema for ticket type
const ticketTypeSchema = z.object({
  id: z.string().optional(),
  seatType: z.string().min(1, "Seat type is required"),
  price: z.number().positive("Price must be greater than 0"),
  capacity: z.number().int().positive("Capacity must be greater than 0"),
  description: z.string().optional(),
});

// Define schema for event
const eventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters long"),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  imageUrl: z.string().optional().nullable(),
  venueId: z.string().min(1, "Please select a venue"),
  regionId: z.string().min(1, "Please select a region"),
  ticketTypes: z
    .array(ticketTypeSchema)
    .min(1, "At least one ticket type is required"),
});

type EventFormValues = z.infer<typeof eventSchema>;

// API response types
type Venue = {
  id: string;
  name: string;
  regionId: string;
  address: string;
  capacity: number | null;
};

type Region = {
  id: string;
  name: string;
  description?: string;
};

type EventTicket = {
  id: string;
  seatType: string;
  price: number;
  capacity: number;
  description?: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  imageUrl?: string;
  venueId: string;
  regionId: string;
  eventTickets: EventTicket[];
};

// Fix the component props to match Next.js 15 requirements
export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<EventFormValues>({
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
      ticketTypes: [{ seatType: "", price: 0, capacity: 0, description: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketTypes",
  });

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch("/api/venues");
        if (!response.ok) throw new Error("Failed to fetch venues");
        const data = (await response.json()) as Venue[];
        setVenues(data);
      } catch (error) {
        console.error("Error fetching venues:", error);
        setError("Failed to load venues. Please try again later.");
      }
    };

    const fetchRegions = async () => {
      try {
        const response = await fetch("/api/regions");
        if (!response.ok) throw new Error("Failed to fetch regions");
        const data = (await response.json()) as Region[];
        setRegions(data);
      } catch (error) {
        console.error("Error fetching regions:", error);
        setError("Failed to load regions. Please try again later.");
      }
    };

    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) throw new Error("Failed to fetch event");
        const event = (await response.json()) as Event;

        // Format dates for form inputs
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toISOString().split("T")[0];

        const startTime = new Date(event.startTime);
        const formattedStartTime = startTime.toISOString().slice(0, 16);

        const endTime = new Date(event.endTime);
        const formattedEndTime = endTime.toISOString().slice(0, 16);

        // Reset form with fetched data
        reset({
          title: event.title,
          description: event.description,
          date: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          imageUrl: event.imageUrl ?? "",
          venueId: event.venueId,
          regionId: event.regionId,
          ticketTypes: event.eventTickets.map((ticket) => ({
            id: ticket.id,
            seatType: ticket.seatType,
            price: ticket.price,
            capacity: ticket.capacity,
            description: ticket.description ?? "",
          })),
        });
      } catch (error) {
        console.error("Error fetching event:", error);
        setError("Failed to load event details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    void Promise.all([fetchVenues(), fetchRegions(), fetchEvent()]);
  }, [id, reset]);

  const onSubmit = async (data: EventFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Format date and time for API
      const eventDate = new Date(data.date);
      const startDateTime = new Date(data.startTime);
      const endDateTime = new Date(data.endTime);

      // Create request body
      const requestBody = {
        title: data.title,
        description: data.description,
        date: eventDate.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        imageUrl: data.imageUrl ?? null,
        venueId: data.venueId,
        regionId: data.regionId,
        ticketTypes: data.ticketTypes,
      };

      console.log("Submitting event update:", requestBody);

      const response = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = (await response.json()) as {
        id?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(responseData.error ?? "Failed to update event");
      }

      // Show success message
      setSuccessMessage("Event updated successfully!");

      // Wait a moment before redirecting
      setTimeout(() => {
        router.push(`/admin/events/${responseData.id ?? id}`);
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("Fetch error:", error);
      setError(
        `Error communicating with server: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  if (isLoading && !fields.length) {
    return (
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">Loading event details...</h1>
        <div className="flex animate-pulse space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-4 rounded bg-gray-200"></div>
              <div className="h-4 w-5/6 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Edit Event</h1>
        <Link
          href={`/admin/events/${id}`}
          className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Event Title*
              </label>
              <input
                id="title"
                type="text"
                {...register("title")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                Event Date*
              </label>
              <input
                id="date"
                type="date"
                {...register("date")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Time*
                </label>
                <input
                  id="startTime"
                  type="datetime-local"
                  {...register("startTime")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  End Time*
                </label>
                <input
                  id="endTime"
                  type="datetime-local"
                  {...register("endTime")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="venueId"
                className="block text-sm font-medium text-gray-700"
              >
                Venue*
              </label>
              <select
                id="venueId"
                {...register("venueId")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a venue</option>
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

            <div>
              <label
                htmlFor="regionId"
                className="block text-sm font-medium text-gray-700"
              >
                Region*
              </label>
              <select
                id="regionId"
                {...register("regionId")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a region</option>
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

            <div>
              <label
                htmlFor="imageUrl"
                className="block text-sm font-medium text-gray-700"
              >
                Poster Image URL (optional)
              </label>
              <input
                id="imageUrl"
                type="text"
                {...register("imageUrl")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.imageUrl && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.imageUrl.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description*
              </label>
              <textarea
                id="description"
                rows={8}
                {...register("description")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Ticket Types*</h3>
            <button
              type="button"
              onClick={() =>
                append({ seatType: "", price: 0, capacity: 0, description: "" })
              }
              className="inline-flex items-center rounded-md border border-transparent bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Ticket Type
            </button>
          </div>

          {errors.ticketTypes?.message && (
            <p className="text-sm text-red-600">{errors.ticketTypes.message}</p>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-800">
                  Ticket Type {index + 1}
                </h4>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Seat Type*
                  </label>
                  <input
                    type="text"
                    {...register(`ticketTypes.${index}.seatType`)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.ticketTypes?.[index]?.seatType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.ticketTypes[index]?.seatType?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    {...register(`ticketTypes.${index}.description`)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price (THB)*
                  </label>
                  <Controller
                    name={`ticketTypes.${index}.price`}
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                        value={field.value}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.ticketTypes?.[index]?.price && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.ticketTypes[index]?.price?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Capacity*
                  </label>
                  <Controller
                    name={`ticketTypes.${index}.capacity`}
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                        value={field.value}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.ticketTypes?.[index]?.capacity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.ticketTypes[index]?.capacity?.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Hidden field for ticket ID */}
              <input type="hidden" {...register(`ticketTypes.${index}.id`)} />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
