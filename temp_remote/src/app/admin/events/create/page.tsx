"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";

export const dynamic = 'force-dynamic';

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
  endTime: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string()
      .optional()
  ),
  imageUrl: z.string().optional(),
  venueId: z.string().min(1, "Please select a venue"),
  regionId: z.string().min(1, "Please select a region"),
  ticketTypes: z.array(ticketTypeSchema).min(1, "At least one ticket type is required"),
});

type EventFormData = Omit<z.infer<typeof eventSchema>, 'thumbnailUrl' | 'imageUrls' | 'imageUrl'>;

// Define types for API responses
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

// Type for the upload API response
type UploadResponse = {
  urls: string[];
};

// Upload Helper
async function uploadFile(file: File, entityType: string): Promise<string | null> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("entityType", entityType);
  try {
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) {
      console.error("Upload failed:", response.status, await response.text());
      return null;
    }
    // Use type assertion here
    const result = await response.json() as UploadResponse;
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

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(true);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);

  // Image State
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [thumbnailSize, setThumbnailSize] = useState<string>("");
  const [imageSizes, setImageSizes] = useState<string[]>([]);

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
        const venuesData = await venuesResponse.json() as Venue[];
        setVenues(venuesData);
        setIsLoadingVenues(false);

        // Fetch regions
        setIsLoadingRegions(true);
        const regionsResponse = await fetch("/api/regions");
        if (!regionsResponse.ok) {
          throw new Error("Failed to load regions");
        }
        const regionsData = await regionsResponse.json() as Region[];
        setRegions(regionsData);
        setIsLoadingRegions(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load necessary data. Please try again later.");
        setIsLoadingVenues(false);
        setIsLoadingRegions(false);
      }
    };

    void fetchVenuesAndRegions();
  }, []);

  // Watch for region changes to filter venues
  const selectedRegionId = watch("regionId");
  const filteredVenues = selectedRegionId
    ? venues.filter((venue) => venue.regionId === selectedRegionId)
    : venues;

  // File Handlers
  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic size check (optional, backend also checks)
      if (file.size > 30 * 1024) {
        alert(`Thumbnail image size should not exceed 30KB. Current size: ${(file.size / 1024).toFixed(1)}KB`);
        e.target.value = ""; // Clear input
        return;
      }
      setThumbnailFile(file);
      setThumbnailSize(`${(file.size / 1024).toFixed(1)}KB`); 
      const reader = new FileReader();
      reader.onloadend = () => { setThumbnailPreview(reader.result as string); };
      reader.readAsDataURL(file);
    } else {
      setThumbnailFile(null); 
      setThumbnailPreview(null);
      setThumbnailSize("");
    }
  };

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    
    // Check each file individually against the 120KB limit
    const oversizedFiles = files.filter(f => f.size > 120 * 1024);
    
    if (oversizedFiles.length > 0) {
      // Clear the input to allow reselection
      e.target.value = "";
      
      // Show clear error message about individual file size limits
      alert(`Each image must be less than 120KB. The following images are too large: ${oversizedFiles.map(f => `${f.name} (${(f.size / 1024).toFixed(1)}KB)`).join(', ')}`);
      
      // Keep only valid files
      const validFiles = files.filter(f => f.size <= 120 * 1024);
      setImageFiles(validFiles);
    } else {
      // All files are valid
      setImageFiles(files);
    }
    
    // Clear old previews and sizes
    setImagePreviews([]);
    setImageSizes([]);
    
    // Generate previews only for valid files
    const validFilesForPreview = files.filter(f => f.size <= 120 * 1024);
    
    if (validFilesForPreview.length === 0) {
      setImagePreviews([]);
      setImageSizes([]);
      return;
    }
    
    // Create previews and track sizes for valid files
    const newPreviews: string[] = [];
    const newSizes: string[] = validFilesForPreview.map(file => `${(file.size / 1024).toFixed(1)}KB`);
    setImageSizes(newSizes);
    
    validFilesForPreview.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFilesForPreview.length) {
          setImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    setError("");
    
    let uploadedThumbnailUrl: string | null = null;
    const uploadedImageUrls: string[] = [];

    try {
      // Ensure date and startTime are valid before proceeding
      if (!data.date || !data.startTime) {
        throw new Error("Date and Start Time are required.");
      }

      // Format date and time for backend
      // Combine date and time correctly for reliable parsing
      const startDateTime = new Date(`${data.date}T${data.startTime}`);
      
      // Handle optional endTime
      let endDateTimeISO: string | null = null;
      if (data.endTime) { // Check if endTime has a value
        const endDateTime = new Date(`${data.date}T${data.endTime}`);
        // Check if the created end date is valid before converting
        if (!isNaN(endDateTime.getTime())) {
          endDateTimeISO = endDateTime.toISOString();
        } else {
          // Handle cases where combining date and endTime results in an invalid date
          console.warn("Could not parse end time, sending null."); 
        }
      }
      
      // Check if startDateTime is valid
      if (isNaN(startDateTime.getTime())) {
         throw new Error("Invalid Start Date/Time combination.");
      }

      // Upload Images
      if (thumbnailFile) {
        uploadedThumbnailUrl = await uploadFile(thumbnailFile, "event");
        if (!uploadedThumbnailUrl) throw new Error("Thumbnail upload failed.");
      }
      if (imageFiles.length > 0) {
        const results = await Promise.all(imageFiles.map(file => uploadFile(file, "event")));
        if (results.some(url => url === null)) throw new Error("One or more event images failed to upload.");
        uploadedImageUrls.push(...results.filter(url => url !== null)); 
      }

      // --- Prepare Payload --- 
      const eventData = {
        title: data.title, // Explicitly list fields from validated data
        description: data.description,
        date: startDateTime.toISOString(), 
        startTime: startDateTime.toISOString(),
        endTime: endDateTimeISO, 
        venueId: data.venueId,
        regionId: data.regionId,
        ticketTypes: data.ticketTypes,
        thumbnailUrl: uploadedThumbnailUrl, 
        imageUrls: uploadedImageUrls, 
        // Explicitly omit imageUrl if it was part of the original 'data' type somehow
      };
      // delete (eventData as any).imageUrl; // Alternative if needed

      console.log("Submitting event data:", eventData);

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get error details
        throw new Error(errorData.error ?? "Failed to create event");
      }

      router.push("/admin/events");
    } catch (error) {
      console.error("Error creating event:", error);
      setError(error instanceof Error ? error.message : "Failed to create event. Please try again.");
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
                End Time (Optional)
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

        {/* Image Upload Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Images</h2>
          <div>
            <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">
              Thumbnail Image (for listings)
              <span className="text-xs text-gray-500 ml-1">(Max size: 30KB)</span>
            </label>
            <input 
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {thumbnailPreview && (
              <div className="mt-2">
                <div className="flex items-center mb-1">
                  <span className="text-xs text-gray-500 mr-2">Current size: {thumbnailSize}</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                      setThumbnailSize("");
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <Image src={thumbnailPreview} alt="Thumbnail preview" width={100} height={75} className="rounded-md object-cover"/>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700">
              Event Images (Multiple allowed)
              <span className="text-xs text-gray-500 ml-1">(Max size: 120KB per image)</span>
            </label>
            <input 
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imagePreviews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center mb-1">
                      <span className="text-xs text-gray-500 mr-2">Size: {imageSizes[index]}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newFiles = [...imageFiles];
                          newFiles.splice(index, 1);
                          setImageFiles(newFiles);
                          
                          const newPreviews = [...imagePreviews];
                          newPreviews.splice(index, 1);
                          setImagePreviews(newPreviews);
                          
                          const newSizes = [...imageSizes];
                          newSizes.splice(index, 1);
                          setImageSizes(newSizes);
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <Image src={preview} alt={`Event image preview ${index + 1}`} width={100} height={75} className="rounded-md object-cover"/>
                  </div>
                ))}
              </div>
            )}
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

          {errors.ticketTypes?.root && (
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
                      <p className="mt-1 text-sm text-red-600">{errors.ticketTypes?.[index]?.seatType?.message}</p>
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
                      <p className="mt-1 text-sm text-red-600">{errors.ticketTypes?.[index]?.price?.message}</p>
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
                      <p className="mt-1 text-sm text-red-600">{errors.ticketTypes?.[index]?.capacity?.message}</p>
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