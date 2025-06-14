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
import { UploadImage, type UploadedImageData } from "~/components/ui/UploadImage";
import { UploadUltraSmallImage, type UploadedUltraSmallImageData } from "~/components/ui/UploadUltraSmallImage";

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
  // Recurrence fields
  recurrenceType: z.enum(["none", "weekly", "monthly"], {
    required_error: "Please select a recurrence type",
  }),
  recurringDaysOfWeek: z
    .array(z.coerce.number().min(0).max(6))
    .optional(),
  dayOfMonth: z
    .array(z.coerce.number().min(1).max(31))
    .optional(),
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
  imageUrls: z.array(z.string().url()).max(8).optional(),
  templateTickets: z
    .array(eventTemplateTicketSchema)
    .min(1, "Add at least one ticket type"),
}).refine(
  (data) => {
    // If recurrence type is weekly, require at least one day of week
    if (data.recurrenceType === "weekly") {
      return data.recurringDaysOfWeek && data.recurringDaysOfWeek.length > 0;
    }
    // If recurrence type is monthly, require at least one day of month
    if (data.recurrenceType === "monthly") {
      return data.dayOfMonth && data.dayOfMonth.length > 0;
    }
    return true;
  },
  {
    message: "Please select at least one day based on the recurrence type",
    path: ["recurrenceType"],
  }
);

// Type definition
type EventTemplateFormData = z.infer<typeof eventTemplateSchema>;
type Venue = { id: string; name: string; regionId: string };
type Region = { id: string; name: string };
// Interface for event template tickets
interface EventTemplateTicketType {
  id: string;
  seatType: string;
  defaultPrice: number;
  defaultCapacity: number;
  defaultDescription?: string | null;
}

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
  
  // Upload states using our modern upload components
  const [thumbnailImage, setThumbnailImage] = useState<UploadedUltraSmallImageData | undefined>(undefined);
  const [templateImages, setTemplateImages] = useState<UploadedImageData[]>([]);

  // tRPC mutation hook
  const updateTemplateMutation = api.eventTemplate.update.useMutation();

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
      setSuccessMessage("Event template updated successfully!");
      setIsSaving(false);
      
      // Wait a moment and then redirect
      setTimeout(() => {
        router.push("/admin/event-templates");
      }, 2000);
    },
    onError: (error) => {
      setSubmitError(error.message);
      setIsSaving(false);
    },
  });

  // Set form values when template data is loaded
  useEffect(() => {
    if (templateData) {
      console.log("Loading template data:", templateData);
      
      // Map API data to form values with explicit null checks
      setValue("id", templateData.id ?? "");
      setValue("templateName", templateData.templateName ?? "");
      setValue("regionId", templateData.regionId ?? "");
      setValue("venueId", templateData.venueId ?? "");
      setValue("defaultTitleFormat", templateData.defaultTitleFormat ?? "");
      setValue("defaultDescription", templateData.defaultDescription ?? "");
      setValue("isActive", templateData.isActive ?? false);
      
      // Set recurrence type with explicit logging
      const recurrenceType = templateData.recurrenceType ?? "weekly";
      console.log("Setting recurrence type to:", recurrenceType);
      setValue("recurrenceType", recurrenceType);
      
      // Special handling for arrays
      const recurringDays = Array.isArray(templateData.recurringDaysOfWeek) 
        ? templateData.recurringDaysOfWeek 
        : (typeof templateData.recurringDaysOfWeek === 'object' && templateData.recurringDaysOfWeek 
            ? Object.keys(templateData.recurringDaysOfWeek).map(k => parseInt(k, 10)) 
            : []);
      
      console.log("Setting recurring days of week:", recurringDays);
      setValue("recurringDaysOfWeek", recurringDays);
      
      // Set dayOfMonth (for monthly recurrence)
      if (templateData.dayOfMonth) {
        // Ensure dayOfMonth is treated as an array
        const dayOfMonthArray = Array.isArray(templateData.dayOfMonth) 
          ? templateData.dayOfMonth 
          : (typeof templateData.dayOfMonth === 'object' 
              ? Object.keys(templateData.dayOfMonth).map(k => parseInt(k, 10)) 
              : [templateData.dayOfMonth]);
        
        console.log("Setting days of month:", dayOfMonthArray);
        setValue("dayOfMonth", dayOfMonthArray);
      } else {
        setValue("dayOfMonth", []);
      }
      
      // Format time to ensure consistent format (HH:MM)
      if (templateData.defaultStartTime) {
        // Handle both HH:MM and HH:MM:SS formats
        const timeString = templateData.defaultStartTime;
        // Split by colon and take only hours and minutes
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2 && timeParts[0] && timeParts[1]) {
          const hours = timeParts[0].padStart(2, '0');
          const minutes = timeParts[1].padStart(2, '0');
          setValue("defaultStartTime", `${hours}:${minutes}`);
        } else {
          setValue("defaultStartTime", templateData.defaultStartTime);
        }
      } else {
        // Default to noon if not provided
        setValue("defaultStartTime", "12:00");
      }
      
      if (templateData.defaultEndTime) {
        // Handle both HH:MM and HH:MM:SS formats
        const timeString = templateData.defaultEndTime;
        // Split by colon and take only hours and minutes
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2 && timeParts[0] && timeParts[1]) {
          const hours = timeParts[0].padStart(2, '0');
          const minutes = timeParts[1].padStart(2, '0');
          setValue("defaultEndTime", `${hours}:${minutes}`);
        } else {
          setValue("defaultEndTime", templateData.defaultEndTime);
        }
      } else {
        setValue("defaultEndTime", "");
      }
      
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
        
        // If there's a valid thumbnail URL, set the upload component
        if (thumbnailValue) {
          setThumbnailImage({
            url: thumbnailValue,
            originalFilename: 'existing-thumbnail.jpg'
          });
        }
      }

      // Handle existing image URLs
      if (templateData.imageUrls && Array.isArray(templateData.imageUrls)) {
        const existingImages = templateData.imageUrls.map((url, index) => ({
          url,
          originalFilename: `existing-image-${index + 1}.jpg`
        }));
        setTemplateImages(existingImages);
        setValue("imageUrls", templateData.imageUrls);
      }
      
      // Set template tickets if available
      if (templateData.templateTickets && Array.isArray(templateData.templateTickets) && templateData.templateTickets.length > 0) {
        try {
          // Safely clear existing fields
          if (fields && fields.length > 0) {
            // Use a safer approach to reset fields
            for (let i = fields.length - 1; i >= 0; i--) {
              remove(i);
            }
          }
          
          // Add each ticket from the API response
          for (const ticket of templateData.templateTickets) {
            if (ticket && typeof ticket === 'object') {
              append({
                id: ticket.id ?? '',
                seatType: ticket.seatType ?? '',
                defaultPrice: typeof ticket.defaultPrice === 'number' ? ticket.defaultPrice : 0,
                defaultCapacity: typeof ticket.defaultCapacity === 'number' ? ticket.defaultCapacity : 0,
                defaultDescription: ticket.defaultDescription ?? "",
              });
            }
          }
        } catch (error) {
          console.error('Error setting template tickets:', error);
          // If there's an error, set a default ticket
          if (fields.length === 0) {
            append({
              seatType: "",
              defaultPrice: 0,
              defaultCapacity: 0,
              defaultDescription: "",
            });
          }
        }
      } else if (fields.length === 0) {
        // Ensure there's at least one empty ticket field if none exist
        append({
          seatType: "",
          defaultPrice: 0,
          defaultCapacity: 0,
          defaultDescription: "",
        });
      }
      
      // Log the loaded recurring days for debugging
      console.log("Loaded recurring days:", templateData.recurringDaysOfWeek);
    }
  }, [templateData, reset, fields.length, remove, append]);

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

      // Format time values to ensure they match HH:MM format
      // Helper function to format time to HH:MM
      const formatTimeToHHMM = (timeString: string): string => {
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
        
        // If already in correct format, return as is
        if (timeRegex.test(timeString)) {
          // Ensure hours are padded to 2 digits
          const parts = timeString.split(':');
          if (parts.length >= 2 && parts[0] !== undefined && parts[1] !== undefined) {
            const hours = parts[0];
            const minutes = parts[1];
            return `${hours.padStart(2, '0')}:${minutes}`;
          }
        }
        
        // Try to parse and reformat the time
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2 && timeParts[0] !== undefined && timeParts[1] !== undefined) {
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          
          if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        }
        
        // If we got here, the format is invalid
        throw new Error("Invalid time format. Please use HH:MM format (24-hour).");
      };
      
      // Process start time (required)
      let formattedStartTime: string;
      try {
        formattedStartTime = formatTimeToHHMM(data.defaultStartTime);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Invalid start time format");
        setIsSaving(false);
        return;
      }
      
      // Process end time (optional)
      let formattedEndTime: string | undefined = undefined;
      if (data.defaultEndTime && data.defaultEndTime.trim() !== '') {
        try {
          formattedEndTime = formatTimeToHHMM(data.defaultEndTime);
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : "Invalid end time format");
          setIsSaving(false);
          return;
        }
      }

      // Use the thumbnail URL from the upload component
      const thumbnailUrl = data.thumbnailUrl || thumbnailImage?.url || "";
      
      // Prepare form data for API
      const formattedData = {
        ...data,
        id: unwrappedParams.id,
        recurringDaysOfWeek: data.recurrenceType === 'weekly' && data.recurringDaysOfWeek 
          ? data.recurringDaysOfWeek.map(Number) 
          : [],
        dayOfMonth: data.recurrenceType === 'monthly' && data.dayOfMonth && data.dayOfMonth.length > 0
          ? data.dayOfMonth.map(Number) 
          : [],
        defaultStartTime: formattedStartTime,
        defaultEndTime: formattedEndTime,
        thumbnailUrl,
        imageUrls: templateImages.map(img => img.url),
        // Format ticket data
        templateTickets: data.templateTickets.map(ticket => ({
          ...ticket,
          defaultPrice: Number(ticket.defaultPrice),
          defaultCapacity: Number(ticket.defaultCapacity),
        })),
      };

      // Update the template
      await updateTemplateMutation.mutateAsync(formattedData);
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
            
            {/* Template Images */}
            <div className="md:col-span-2">
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
                    entityId={id}
                    value={thumbnailImage}
                    onChange={handleThumbnailChange}
                    helpText="Recommended size: 400x300px. Will be compressed to 30KB automatically."
                    showInfo={true}
                  />
                </div>

                {/* Additional Images Upload */}
                <div>
                  <h4 className="mb-2 text-md font-medium text-gray-800">Additional Images</h4>
                  <p className="mb-4 text-sm text-gray-600">
                    Upload up to 8 additional images for this event template. These will be compressed to 250KB each.
                  </p>
                  <UploadImage
                    type="images"
                    entityType="event-templates"
                    entityId={id}
                    value={templateImages}
                    onChange={handleTemplateImagesChange}
                    maxImages={8}
                    helpText="Recommended size: 800x600px. Will be compressed to 250KB automatically."
                    showInfo={true}
                  />
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
          
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Recurrence Pattern
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  id="recurrence-none"
                  type="radio"
                  value="none"
                  {...register("recurrenceType")}
                  defaultChecked={templateData?.recurrenceType === 'none'}
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
                  defaultChecked={templateData?.recurrenceType === 'weekly'}
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
                  defaultChecked={templateData?.recurrenceType === 'monthly'}
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="recurrence-monthly" className="ml-2 block text-sm text-gray-700">
                  Monthly
                </label>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {watch("recurrenceType") === "weekly" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Days of Week*
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
                        defaultChecked={templateData?.recurringDaysOfWeek?.includes(day.id)}
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
            )}
            
            {watch("recurrenceType") === "monthly" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Days of Month*
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
                        defaultChecked={Array.isArray(templateData?.dayOfMonth) 
                          ? templateData?.dayOfMonth.includes(day)
                          : false}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Time*
                </label>
                <input
                  type="text"
                  placeholder="21:00"
                  {...register("defaultStartTime")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                />
                <small className="text-xs text-gray-500">Format: HH:MM (24-hour, e.g. 21:00)</small>
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
                  type="text"
                  placeholder="22:00"
                  {...register("defaultEndTime")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                />
                <small className="text-xs text-gray-500">Format: HH:MM (24-hour, e.g. 22:00)</small>
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
                      Price*
                    </label>
                    <input
                      id={`templateTickets.${index}.defaultPrice`}
                      {...register(`templateTickets.${index}.defaultPrice`)}
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
                      Capacity*
                    </label>
                    <input
                      id={`templateTickets.${index}.defaultCapacity`}
                      {...register(`templateTickets.${index}.defaultCapacity`)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                    />
                    {errors.templateTickets?.[index]?.defaultCapacity && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.templateTickets?.[index]?.defaultCapacity?.message}
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
                    <textarea
                      id={`templateTickets.${index}.defaultDescription`}
                      {...register(`templateTickets.${index}.defaultDescription`)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}