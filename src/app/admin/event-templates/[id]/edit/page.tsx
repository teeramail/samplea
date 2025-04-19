"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import React from "react";
import Image from "next/image";

// Define Zod schema for validation
const eventTemplateTicketSchema = z.object({
  id: z.string().optional(),
  seatType: z.string().min(1, "Seat type is required"),
  defaultPrice: z.number().positive("Price must be positive"),
  defaultCapacity: z
    .number()
    .int()
    .positive("Capacity must be a positive integer"),
  defaultDescription: z.string().optional(),
});

const eventTemplateSchema = z.object({
  id: z.string().optional(),
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
  thumbnailUrl: z.string().optional().nullable(),
  templateTickets: z
    .array(eventTemplateTicketSchema)
    .min(1, "Add at least one ticket type"),
});

// Type definition
type EventTemplateFormData = z.infer<typeof eventTemplateSchema>;
type Venue = { id: string; name: string; regionId: string };
type Region = { id: string; name: string };
type EventTemplateTicket = {
  id: string;
  seatType: string;
  defaultPrice: number;
  defaultCapacity: number;
  defaultDescription?: string | null;
};

// We're using this type for reference but not directly in the code
// Keeping it for documentation purposes
/* type EventTemplate = {
  id: string;
  templateName: string;
  regionId: string;
  venueId: string;
  defaultTitleFormat: string;
  defaultDescription?: string | null;
  recurringDaysOfWeek: number[];
  defaultStartTime: string;
  defaultEndTime?: string | null;
  isActive: boolean;
  thumbnailUrl?: string | null;
  templateTickets: EventTemplateTicket[];
  venue?: Venue;
  region?: Region;
}; */

// Type for the upload API response
type UploadResponse = {
  urls: string[];
};

const daysOfWeek = [
  { id: 0, name: "Sunday" },
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

// Upload Helper
async function uploadFile(
  file: File,
  entityType: string,
): Promise<string | null> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("entityType", entityType);
  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      console.error("Upload failed:", response.status, await response.text());
      return null;
    }
    // Use type assertion here
    const result = (await response.json()) as UploadResponse;
    // Check result.urls directly now
    if (result.urls && Array.isArray(result.urls) && result.urls.length > 0) {
      // Use nullish coalescing operator to ensure null is returned if urls[0] is undefined
      return result.urls[0] ?? null;
    } else {
      console.error("Upload API response error or no URLs returned:", result);
      return null;
    }
  } catch (error) {
    console.error("Upload fetch error:", error);
    return null;
  }
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditEventTemplatePage({ params }: PageProps) {
  // Unwrap params using React.use() to access properties safely
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Image State
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailSize, setThumbnailSize] = useState<string>("");
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
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

  // Fetch event template data
  const { data: templateData, isLoading: isLoadingTemplate } = 
    api.eventTemplate.getById.useQuery({ id });

  // Update mutation
  const updateTemplate = api.eventTemplate.update.useMutation({
    onSuccess: () => {
      setSuccessMessage("Event template updated successfully");
      setIsSaving(false);
      // Navigate back to the list after a short delay
      setTimeout(() => {
        router.push("/admin/event-templates");
      }, 1500);
    },
    onError: (error) => {
      console.error("API error updating template:", error);
      setSubmitError(error.message || "Failed to update event template");
      setIsSaving(false);
    },
  });

  // Set form data when template data is loaded
  useEffect(() => {
    if (templateData) {
      // Format time strings for form inputs
      // Map API data to form values
      setValue("id", templateData.id);
      setValue("templateName", templateData.templateName);
      setValue("regionId", templateData.regionId);
      setValue("venueId", templateData.venueId);
      setValue("defaultTitleFormat", templateData.defaultTitleFormat);
      setValue("defaultDescription", templateData.defaultDescription ?? "");
      setValue("recurringDaysOfWeek", templateData.recurringDaysOfWeek);
      
      // Format time to ensure consistent format (HH:MM)
      if (templateData.defaultStartTime) {
        // Ensure time is in HH:MM format
        const startTimeMatch = templateData.defaultStartTime.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
        if (startTimeMatch && startTimeMatch[1] && startTimeMatch[2]) {
          const hours = startTimeMatch[1].padStart(2, '0');
          const minutes = startTimeMatch[2];
          setValue("defaultStartTime", `${hours}:${minutes}`);
        } else {
          setValue("defaultStartTime", templateData.defaultStartTime);
        }
      }
      
      if (templateData.defaultEndTime) {
        // Ensure time is in HH:MM format
        const endTimeMatch = templateData.defaultEndTime.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
        if (endTimeMatch && endTimeMatch[1] && endTimeMatch[2]) {
          const hours = endTimeMatch[1].padStart(2, '0');
          const minutes = endTimeMatch[2];
          setValue("defaultEndTime", `${hours}:${minutes}`);
        } else {
          setValue("defaultEndTime", templateData.defaultEndTime);
        }
      } else {
        setValue("defaultEndTime", "");
      }
      
      setValue("isActive", templateData.isActive);
      
      // Handle thumbnailUrl safely with type checking
      if ('thumbnailUrl' in templateData && templateData.thumbnailUrl !== undefined) {
        // Ensure thumbnailValue is a string
        // Handle all possible types safely
        let thumbnailValue = "";
        if (typeof templateData.thumbnailUrl === 'string') {
          thumbnailValue = templateData.thumbnailUrl;
        } else if (templateData.thumbnailUrl === null || templateData.thumbnailUrl === undefined) {
          thumbnailValue = "";
        }
        
        // Set the form value
        setValue("thumbnailUrl", thumbnailValue);
        
        // If there's a valid thumbnail URL, set the preview
        if (thumbnailValue) {
          setThumbnailPreview(thumbnailValue);
          setExistingThumbnailUrl(thumbnailValue);
        }
      }
      
      // Set template tickets if available
      if (templateData.templateTickets && Array.isArray(templateData.templateTickets) && templateData.templateTickets.length > 0) {
        // Reset the field array to avoid duplicates
        while (fields.length > 0) {
          remove(0);
        }
        
        // Add each ticket from the API response
        templateData.templateTickets.forEach((ticket) => {
          append({
            id: ticket.id,
            seatType: ticket.seatType,
            defaultPrice: ticket.defaultPrice,
            defaultCapacity: ticket.defaultCapacity,
            defaultDescription: ticket.defaultDescription ?? "",
          });
        });
      }
    }
  }, [templateData, reset, setValue, fields, remove, append]);

  useEffect(() => {
    if (venuesData?.items) {
      setAllVenues(venuesData.items);
    }
    if (regionsData?.items) {
      setRegions(regionsData.items);
    }
    if (!isLoadingVenues && !isLoadingRegions && !isLoadingTemplate) {
      setIsLoading(false);
    }
  }, [venuesData, regionsData, isLoadingVenues, isLoadingRegions, isLoadingTemplate]);

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

  // File Handlers
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic size check (optional, backend also checks)
      if (file.size > 30 * 1024) {
        alert(
          `Thumbnail image size should not exceed 30KB. Current size: ${(file.size / 1024).toFixed(1)}KB`,
        );
        e.target.value = ""; // Clear input
        return;
      }
      setThumbnailFile(file);
      setThumbnailSize(`${(file.size / 1024).toFixed(1)}KB`);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(existingThumbnailUrl);
      setThumbnailSize("");
    }
  };

  const onSubmit: SubmitHandler<EventTemplateFormData> = async (data) => {
    setIsSaving(true);
    setSubmitError(null);
    
    try {
      // Validate required fields explicitly to avoid validation errors
      if (!data.templateName) {
        setSubmitError("Template name is required");
        setIsSaving(false);
        return;
      }
      
      if (!data.regionId) {
        setSubmitError("Region is required");
        setIsSaving(false);
        return;
      }
      
      if (!data.venueId) {
        setSubmitError("Venue is required");
        setIsSaving(false);
        return;
      }
      
      if (!data.defaultTitleFormat) {
        setSubmitError("Title format is required");
        setIsSaving(false);
        return;
      }
      
      if (!data.recurringDaysOfWeek || data.recurringDaysOfWeek.length === 0) {
        setSubmitError("Select at least one day of week");
        setIsSaving(false);
        return;
      }
      
      if (!data.defaultStartTime) {
        setSubmitError("Start time is required");
        setIsSaving(false);
        return;
      }
      
      if (!data.templateTickets || data.templateTickets.length === 0) {
        setSubmitError("Add at least one ticket type");
        setIsSaving(false);
        return;
      }

      // Handle thumbnail upload if there's a new file
      let thumbnailUrl = data.thumbnailUrl;
      if (thumbnailFile) {
        const uploadedUrl = await uploadFile(thumbnailFile, "eventTemplate");
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
        }
      }
      
      // Format the data for API submission
      const payload = {
        ...data,
        id,
        thumbnailUrl,
        // Ensure defaultEndTime is properly handled
        defaultEndTime: data.defaultEndTime ?? undefined,
      };

      // Submit using tRPC mutation
      updateTemplate.mutate(payload);
    } catch (error) {
      console.error("Error in form submission:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setIsSaving(false);
    }
  };

  const handleAddTicketType = () => {
    append({
      seatType: "",
      defaultPrice: 0,
      defaultCapacity: 0,
      defaultDescription: "",
    });
  };

  if (isLoading) {
    return <div className="py-10 text-center">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Event Template</h1>
        <Link
          href="/admin/event-templates"
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
        >
          Back to Templates
        </Link>
      </div>

      {successMessage && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-green-700">
          {successMessage}
        </div>
      )}

      {submitError && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="rounded-md bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Basic Information</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Template Name*
              </label>
              <input
                {...register("templateName")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              />
              {errors.templateName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.templateName.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Title Format*
              </label>
              <input
                {...register("defaultTitleFormat")}
                placeholder="e.g., {venue} Muay Thai - {date}"
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              />
              {errors.defaultTitleFormat && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.defaultTitleFormat.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                {...register("defaultDescription")}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700"
              >
                Active (generate events automatically)
              </label>
            </div>
            
            {/* Thumbnail Upload */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Thumbnail Image (Optional, max 30KB)
              </label>
              <div className="mt-1 flex items-center space-x-4">
                {thumbnailPreview && (
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border border-gray-300">
                    <Image
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {thumbnailSize && (
                    <p className="mt-1 text-xs text-gray-500">
                      Size: {thumbnailSize}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Location</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Region*
              </label>
              <select
                {...register("regionId")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                onChange={(e) => {
                  // Manually set the value and trigger validation
                  setValue("regionId", e.target.value, { shouldValidate: true });
                  // Reset venue selection when region changes
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
              {errors.regionId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.regionId.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Venue*
              </label>
              <select
                {...register("venueId")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                disabled={!selectedRegionId || filteredVenues.length === 0}
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
              {errors.venueId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.venueId.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-md bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Schedule</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Recurring Days*
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <label
                    key={day.id}
                    className="flex cursor-pointer items-center space-x-2 rounded-md border border-gray-300 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      value={day.id}
                      {...register("recurringDaysOfWeek")}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                    />
                    <span>{day.name}</span>
                  </label>
                ))}
              </div>
              {errors.recurringDaysOfWeek && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.recurringDaysOfWeek.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Time*
                </label>
                <input
                  type="time"
                  {...register("defaultStartTime")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                />
                {errors.defaultStartTime && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.defaultStartTime.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End Time (Optional)
                </label>
                <input
                  type="time"
                  {...register("defaultEndTime")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                />
                {errors.defaultEndTime && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.defaultEndTime.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Ticket Types</h2>
            <button
              type="button"
              onClick={handleAddTicketType}
              className="rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
            >
              Add Ticket Type
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-md border border-gray-200 p-4"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label
                      htmlFor={`templateTickets.${index}.seatType`}
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Seat Type*
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
                  <div>
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
                </div>
                <div className="absolute right-2 top-2">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="font-medium text-red-500 hover:text-red-700"
                    disabled={fields.length <= 1}
                  >
                    &times;
                  </button>
                </div>
                
                {/* Hidden field for ticket ID */}
                <input
                  type="hidden"
                  {...register(`templateTickets.${index}.id`)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/event-templates"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isSaving}
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
