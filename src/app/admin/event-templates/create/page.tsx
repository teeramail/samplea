"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

// Define Zod schema for validation
const eventTemplateTicketSchema = z.object({
  seatType: z.string().min(1, "Seat type is required"),
  defaultPrice: z.number().positive("Price must be positive"),
  defaultCapacity: z
    .number()
    .int()
    .positive("Capacity must be a positive integer"),
  defaultDescription: z.string().optional(),
});

const eventTemplateSchema = z.object({
  templateName: z.string().min(1, "Template name is required"),
  regionId: z.string().min(1, "Region is required"),
  venueId: z.string().min(1, "Venue is required"),
  defaultTitleFormat: z.string().min(1, "Title format is required"),
  defaultDescription: z.string().optional(),
  recurringDaysOfWeek: z
    .array(z.coerce.number().min(0).max(6))
    .min(1, "Select at least one day"),
  defaultStartTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  defaultEndTime: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
      .optional(),
  ),
  isActive: z.boolean().default(true),
  templateTickets: z
    .array(eventTemplateTicketSchema)
    .min(1, "Add at least one ticket type"),
});

// Restore original type definition
type EventTemplateFormData = z.infer<typeof eventTemplateSchema>;
type Venue = { id: string; name: string; regionId: string };
type Region = { id: string; name: string };

const daysOfWeek = [
  { id: 0, name: "Sunday" },
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

export default function CreateEventTemplatePage() {
  const router = useRouter();
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<EventTemplateFormData>({
    resolver: zodResolver(eventTemplateSchema),
    defaultValues: {
      isActive: true,
      templateTickets: [
        {
          seatType: "",
          defaultPrice: 1,
          defaultCapacity: 1,
          defaultDescription: "",
        },
      ],
      recurringDaysOfWeek: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "templateTickets",
  });

  const selectedRegionId = watch("regionId");

  // Fetch venues and regions using tRPC
  const { data: venuesData, isLoading: isLoadingVenues } =
    api.venue.list.useQuery({
      page: 1,
      limit: 100,
      sortField: "name",
      sortDirection: "asc",
    });
  const { data: regionsData, isLoading: isLoadingRegions } =
    api.region.list.useQuery({
      page: 1,
      limit: 100,
      sortField: "name",
      sortDirection: "asc",
    });

  useEffect(() => {
    if (venuesData?.items) {
      setAllVenues(venuesData.items);
    }
    if (regionsData?.items) {
      setRegions(regionsData.items);
    }
    if (!isLoadingVenues && !isLoadingRegions) {
      setIsLoading(false);
    }
  }, [venuesData, regionsData, isLoadingVenues, isLoadingRegions]);

  const filteredVenues = allVenues.filter(
    (v) => v.regionId === selectedRegionId,
  );

  useEffect(() => {
    const currentVenueId = watch("venueId");
    if (
      selectedRegionId &&
      currentVenueId &&
      !allVenues.some(
        (v) => v.regionId === selectedRegionId && v.id === currentVenueId,
      )
    ) {
      setValue("venueId", "", { shouldValidate: true });
    }
  }, [selectedRegionId, setValue, watch, allVenues]);

  // Create event template mutation
  const createTemplate = api.eventTemplate.create.useMutation({
    onSuccess: () => {
      router.push("/admin/event-templates");
    },
    onError: (error) => {
      console.error("API error creating template:", error);
      setSubmitError(error.message || "Failed to create event template");
    },
  });

  const onSubmit: SubmitHandler<EventTemplateFormData> = (data) => {
    // Clear any previous errors
    setSubmitError(null);
    
    try {
      // Validate required fields explicitly to avoid validation errors
      if (!data.templateName) {
        setSubmitError("Template name is required");
        return;
      }
      
      if (!data.regionId) {
        setSubmitError("Region is required");
        return;
      }
      
      if (!data.venueId) {
        setSubmitError("Venue is required");
        return;
      }
      
      if (!data.defaultTitleFormat) {
        setSubmitError("Title format is required");
        return;
      }
      
      if (!data.recurringDaysOfWeek || data.recurringDaysOfWeek.length === 0) {
        setSubmitError("Select at least one day of week");
        return;
      }
      
      if (!data.defaultStartTime) {
        setSubmitError("Start time is required");
        return;
      }
      
      if (!data.templateTickets || data.templateTickets.length === 0) {
        setSubmitError("Add at least one ticket type");
        return;
      }
      
      // Format the data for API submission
      const payload = {
        ...data,
        // Ensure defaultEndTime is properly handled
        defaultEndTime: data.defaultEndTime || undefined,
      };

      // Submit using tRPC mutation
      createTemplate.mutate(payload);
    } catch (error) {
      console.error("Error in form submission:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  };

  if (isLoading) {
    return <div className="py-10 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Create New Event Template
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.error("Form validation errors:", errors);
          alert("Please check form for errors");
        })}
        className="space-y-8 rounded-lg bg-white p-8 shadow-md"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="templateName"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Template Name
            </label>
            <input
              id="templateName"
              {...register("templateName")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.templateName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.templateName.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="defaultTitleFormat"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Default Title Format
            </label>
            <input
              id="defaultTitleFormat"
              {...register("defaultTitleFormat")}
              placeholder="e.g., Muay Thai Fight Night at {venueName}"
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.defaultTitleFormat && (
              <p className="mt-1 text-sm text-red-600">
                {errors.defaultTitleFormat.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="regionId"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Region
            </label>
            <select
              id="regionId"
              {...register("regionId")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Region</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
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
              htmlFor="venueId"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Venue
            </label>
            <select
              id="venueId"
              {...register("venueId")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
              disabled={!selectedRegionId}
            >
              <option value="">Select Venue</option>
              {filteredVenues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            {errors.venueId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.venueId.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="defaultDescription"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Default Description
            </label>
            <textarea
              id="defaultDescription"
              {...register("defaultDescription")}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            ></textarea>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-t pt-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Recurring Days of Week
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {daysOfWeek.map((day) => (
                <div key={day.id} className="flex items-center">
                  <input
                    id={`day-${day.id}`}
                    type="checkbox"
                    value={day.id}
                    {...register("recurringDaysOfWeek")}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={`day-${day.id}`}
                    className="ml-2 block text-sm text-gray-900"
                  >
                    {day.name}
                  </label>
                </div>
              ))}
            </div>
            {errors.recurringDaysOfWeek && (
              <p className="mt-1 text-sm text-red-600">
                {errors.recurringDaysOfWeek.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="defaultStartTime"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Default Start Time
            </label>
            <input
              id="defaultStartTime"
              type="time"
              {...register("defaultStartTime")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.defaultStartTime && (
              <p className="mt-1 text-sm text-red-600">
                {errors.defaultStartTime.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="defaultEndTime"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Default End Time (Optional)
            </label>
            <input
              id="defaultEndTime"
              type="time"
              {...register("defaultEndTime")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.defaultEndTime && (
              <p className="mt-1 text-sm text-red-600">
                {errors.defaultEndTime.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center border-t pt-6">
          <input
            id="isActive"
            type="checkbox"
            {...register("isActive")}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor="isActive"
            className="ml-2 block text-sm font-medium text-gray-700"
          >
            Active Template
          </label>
        </div>

        <div className="border-t pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Default Ticket Types</h2>
            <button
              type="button"
              onClick={() =>
                append({
                  seatType: "",
                  defaultPrice: 1,
                  defaultCapacity: 1,
                  defaultDescription: "",
                })
              }
              className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
            >
              + Add Ticket Type
            </button>
          </div>
          {errors.templateTickets?.root && (
            <p className="mb-4 text-sm text-red-600">
              {errors.templateTickets.root.message}
            </p>
          )}
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="relative grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-5"
              >
                <div className="md:col-span-2">
                  <label
                    htmlFor={`templateTickets.${index}.seatType`}
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Seat Type
                  </label>
                  <input
                    id={`templateTickets.${index}.seatType`}
                    {...register(`templateTickets.${index}.seatType`)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                  />
                  {errors.templateTickets?.[index]?.seatType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.templateTickets?.[index]?.seatType?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor={`templateTickets.${index}.defaultPrice`}
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Price
                  </label>
                  <input
                    id={`templateTickets.${index}.defaultPrice`}
                    type="number"
                    step="0.01"
                    {...register(`templateTickets.${index}.defaultPrice`, {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                  />
                  {errors.templateTickets?.[index]?.defaultPrice && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.templateTickets?.[index]?.defaultPrice?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor={`templateTickets.${index}.defaultCapacity`}
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Capacity
                  </label>
                  <input
                    id={`templateTickets.${index}.defaultCapacity`}
                    type="number"
                    {...register(`templateTickets.${index}.defaultCapacity`, {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                  />
                  {errors.templateTickets?.[index]?.defaultCapacity && (
                    <p className="mt-1 text-sm text-red-600">
                      {
                        errors.templateTickets?.[index]?.defaultCapacity
                          ?.message
                      }
                    </p>
                  )}
                </div>
                <div className="md:col-span-4">
                  <label
                    htmlFor={`templateTickets.${index}.defaultDescription`}
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Description (Optional)
                  </label>
                  <input
                    id={`templateTickets.${index}.defaultDescription`}
                    {...register(`templateTickets.${index}.defaultDescription`)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                  />
                </div>
                <div className="absolute right-2 top-2">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="font-medium text-red-500 hover:text-red-700"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          {submitError && (
            <p className="mb-4 text-sm text-red-600">Error: {submitError}</p>
          )}
          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/event-templates"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Template"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
