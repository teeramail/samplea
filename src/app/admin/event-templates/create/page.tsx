"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { UploadImage, type UploadedImageData } from "~/components/ui/UploadImage";
import { UploadUltraSmallImage, type UploadedUltraSmallImageData } from "~/components/ui/UploadUltraSmallImage";

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
  
  // Recurrence fields
  recurrenceType: z.enum(["none", "weekly", "monthly"], {
    required_error: "Please select a recurrence type",
  }),
  recurringDaysOfWeek: z
    .array(z.coerce.number().min(0).max(6))
    .optional()
    .superRefine((val, ctx) => {
      // Only required if recurrence type is weekly
      if (ctx.path[0] === "recurrenceType" && ctx.path[1] === "weekly" && (!val || val.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one day for weekly recurrence",
        });
      }
    }),
  dayOfMonth: z
    .array(z.coerce.number().min(1).max(31))
    .optional()
    .superRefine((val, ctx) => {
      // Only required if recurrence type is monthly
      if (ctx.path[0] === "recurrenceType" && ctx.path[1] === "monthly" && (!val || (val && val.length === 0))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one day for monthly recurrence",
        });
      }
    }),
    
  defaultStartTime: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
  ),
  defaultEndTime: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
      .optional(),
  ),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
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
  
  // Upload states using our shared components
  const [thumbnailImage, setThumbnailImage] = useState<UploadedUltraSmallImageData | undefined>(undefined);
  const [templateImages, setTemplateImages] = useState<UploadedImageData[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<EventTemplateFormData>({
    resolver: zodResolver(eventTemplateSchema),
    mode: "onSubmit",
    defaultValues: {
      isActive: true,
      recurrenceType: "none",
      templateTickets: [
        {
          seatType: "",
          defaultPrice: 1,
          defaultCapacity: 1,
          defaultDescription: "",
        },
      ],
      recurringDaysOfWeek: [],
      dayOfMonth: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "templateTickets",
  });

  const selectedRegionId = watch("regionId");
  const recurrenceType = watch("recurrenceType");

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

  // Handle template images upload change
  const handleTemplateImagesChange = (data: UploadedImageData | UploadedImageData[] | null) => {
    if (data) {
      const imagesArray = Array.isArray(data) ? data : [data];
      setTemplateImages(imagesArray);
      setValue("imageUrls", imagesArray.map(img => img.url));
    } else {
      setTemplateImages([]);
      setValue("imageUrls", []);
    }
  };

  const onSubmit: SubmitHandler<EventTemplateFormData> = async (data) => {
    setSubmitError(null);

    try {
      // Include image URLs in the template data - images are already uploaded!
      const templateData = {
        ...data,
        thumbnailUrl: thumbnailImage?.url || "",
        imageUrls: templateImages.map(img => img.url),
      };

      // Create the event template using tRPC
      const createTemplate = api.eventTemplate.create.useMutation();
      await createTemplate.mutateAsync(templateData);

      // Redirect to the event templates list page
      router.push("/admin/event-templates");
    } catch (error) {
      console.error("Error creating event template:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create event template"
      );
    }
  };

  // Filter venues based on selected region
  const filteredVenues = selectedRegionId
    ? allVenues.filter((venue) => venue.regionId === selectedRegionId)
    : [];

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Event Template</h1>
        <Link
          href="/admin/event-templates"
          className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Back to Templates
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
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Template Name *
              </label>
              <input
                {...register("templateName")}
                type="text"
                placeholder="e.g., Weekly Lumpinee Event"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors.templateName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.templateName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Title Format *
              </label>
              <input
                {...register("defaultTitleFormat")}
                type="text"
                placeholder="e.g., Muay Thai Night - {date}"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors.defaultTitleFormat && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.defaultTitleFormat.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Default Description
            </label>
            <textarea
              {...register("defaultDescription")}
              rows={3}
              placeholder="Default description for events created from this template"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Location */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Location</h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Region *
              </label>
              <select
                {...register("regionId")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
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
              <label className="block text-sm font-medium text-gray-700">
                Venue *
              </label>
              <select
                {...register("venueId")}
                disabled={!selectedRegionId}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">
                  {selectedRegionId ? "Select a venue" : "Select region first"}
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
          </div>
        </div>

        {/* Template Images */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Event Template Images</h3>
          
          {/* Thumbnail Upload - Ultra Small (30KB) */}
          <div className="mb-6">
            <h4 className="mb-2 text-md font-medium text-gray-800">Thumbnail</h4>
            <p className="mb-4 text-sm text-gray-600">
              Upload a thumbnail image that will be automatically compressed to 30KB or less. 
              This ensures fast loading times in template listings.
            </p>
            <UploadUltraSmallImage
              type="thumbnail"
              entityType="event-templates"
              value={thumbnailImage}
              onChange={handleThumbnailChange}
              label="Template Thumbnail (auto-compressed to 30KB)"
              helpText="Recommended: Square images work best for thumbnails"
              showInfo={true}
            />
          </div>

          {/* Template Images Upload - Regular (120KB) */}
          <div>
            <h4 className="mb-2 text-md font-medium text-gray-800">Gallery Images</h4>
            <p className="mb-4 text-sm text-gray-600">
              Upload template images that will be automatically compressed to 120KB or less. 
              You can upload up to 8 images to showcase your event template.
            </p>
            <UploadImage
              type="images"
              entityType="event-templates"
              value={templateImages}
              onChange={handleTemplateImagesChange}
              maxImages={8}
              label="Template Gallery Images (auto-compressed to 120KB each)"
              helpText="Upload multiple images to showcase your event template"
              showInfo={true}
            />
          </div>
        </div>

        {/* Image Summary */}
        {(thumbnailImage || templateImages.length > 0) && (
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
                {templateImages.length > 0 ? (
                  <span className="text-green-600">✓ {templateImages.length} image(s) (120KB max each)</span>
                ) : (
                  <span className="text-gray-500">No images uploaded</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recurrence Pattern */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Recurrence Pattern</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                id="recurrence-none"
                type="radio"
                value="none"
                {...register("recurrenceType")}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="recurrence-none" className="ml-2 block text-sm text-gray-700">
                No recurrence
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="recurrence-weekly"
                type="radio"
                value="weekly"
                {...register("recurrenceType")}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="recurrence-weekly" className="ml-2 block text-sm text-gray-700">
                Weekly
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="recurrence-monthly"
                type="radio"
                value="monthly"
                {...register("recurrenceType")}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="recurrence-monthly" className="ml-2 block text-sm text-gray-700">
                Monthly
              </label>
            </div>
          </div>
          {errors.recurrenceType && (
            <p className="mt-1 text-sm text-red-600">
              {errors.recurrenceType.message}
            </p>
          )}

          {recurrenceType === "weekly" && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Days of Week
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
          )}

          {recurrenceType === "monthly" && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Days of Month
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Select the days of the month when events should occur (e.g., 1st, 11th, and 21st of each month)
              </p>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-2">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <div key={day} className="flex items-center">
                    <input
                      id={`month-day-${day}`}
                      type="checkbox"
                      value={day}
                      {...register("dayOfMonth")}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor={`month-day-${day}`}
                      className="ml-1 block text-sm text-gray-900"
                    >
                      {day}
                    </label>
                  </div>
                ))}
              </div>
              {errors.dayOfMonth && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.dayOfMonth.message}
                </p>
              )}
            </div>
          )}

          {recurrenceType !== "none" && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  {...register("startDate")}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  From when the template should start generating events
                </p>
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  {...register("endDate")}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Until when the template should generate events (leave blank for no end date)
                </p>
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Default Schedule</h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Start Time *
              </label>
              <input
                type="time"
                placeholder="HH:MM"
                pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                {...register("defaultStartTime")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              <small className="text-xs text-gray-500">Format: HH:MM (24-hour)</small>
              {errors.defaultStartTime && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.defaultStartTime.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default End Time (Optional)
              </label>
              <input
                type="time"
                placeholder="HH:MM"
                pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                {...register("defaultEndTime")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              <small className="text-xs text-gray-500">Format: HH:MM (24-hour)</small>
              {errors.defaultEndTime && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.defaultEndTime.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center">
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
        </div>

        {/* Default Ticket Types */}
        <div className="rounded-lg border bg-white p-6">
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

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/event-templates"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Template"}
          </button>
        </div>
      </form>
    </div>
  );
}
