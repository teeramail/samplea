"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";

// --- Re-use or redefine schema (ensure it matches create/backend) ---
const venueUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  capacity: z.coerce.number().int().min(0, "Capacity must be non-negative"),
  regionId: z.string().min(1, "Please select a region"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  googleMapsUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  remarks: z.string().optional(),
  socialMediaLinks: z
    .object({
      facebook: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .or(z.literal("")),
      instagram: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .or(z.literal("")),
      tiktok: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .or(z.literal("")),
      twitter: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .or(z.literal("")),
      youtube: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .or(z.literal("")),
    })
    .optional(),
  venueTypeIds: z.array(z.string()).min(1, "Select at least one venue type"),
  primaryVenueTypeId: z.string().optional(),
  // Image URLs are handled separately in submission logic
});

type VenueFormData = Omit<
  z.infer<typeof venueUpdateSchema>,
  "thumbnailUrl" | "imageUrls"
>;

// Type for the fetched venue data (might include more fields like region object)
type FetchedVenueData = VenueFormData & {
  id: string;
  thumbnailUrl?: string | null;
  imageUrls?: string[] | null;
  region?: { id: string; name: string }; // Assuming region is included
  venueTypes?: { id: string; name: string; description: string }[];
  primaryVenueType?: { id: string; name: string };
  googleMapsUrl?: string;
  remarks?: string;
  socialMediaLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
  };
};

type Region = {
  id: string;
  name: string;
};

// Define type for the upload API response
type UploadResponse = {
  url: string;
  originalFilename: string;
  feedback?: {
    originalSize: number;
    compressedSize: number;
    width: number;
    height: number;
    format: string;
    quality: number;
    reduction: number;
  };
};

// --- Actual upload function (copy from create page or import) ---
async function uploadFile(
  file: File,
  entityType: string,
  uploadType?: "thumbnail" | "images",
): Promise<string | null> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("entityType", entityType);
  if (uploadType === "thumbnail") {
    formData.append("type", "thumbnail");
  }

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed:", response.status, errorText);
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = (await response.json()) as UploadResponse;
    if (result.url && typeof result.url === 'string') {
      return result.url;
    } else {
      console.error("Upload API response error or no URL:", result);
      throw new Error("Upload API returned no valid URL");
    }
  } catch (error) {
    console.error("Upload fetch error:", error);
    throw error;
  }
}

export default function EditVenuePage() {
  const router = useRouter();
  const params = useParams();
  const venueId = params?.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [venueTypes, setVenueTypes] = useState<
    { id: string; name: string; description: string }[]
  >([]);
  const [isLoadingVenueTypes, setIsLoadingVenueTypes] = useState(true);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [primaryVenueType, setPrimaryVenueType] = useState<string>("");

  // State for images
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<
    string | null | undefined
  >(null);
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset, // Use reset to populate form after fetch
    formState: { errors },
    setValue,
    watch,
  } = useForm<VenueFormData>({
    resolver: zodResolver(venueUpdateSchema),
    defaultValues: {
      name: "",
      address: "",
      capacity: 0,
      regionId: "",
      latitude: undefined,
      longitude: undefined,
      googleMapsUrl: "",
      remarks: "",
      socialMediaLinks: {
        facebook: "",
        instagram: "",
        tiktok: "",
        twitter: "",
        youtube: "",
      },
      venueTypeIds: [],
      primaryVenueTypeId: "",
    },
  });

  // Fetch regions
  useEffect(() => {
    const fetchRegions = async () => {
      setIsLoadingRegions(true);
      try {
        const response = await fetch("/api/regions");
        if (!response.ok) throw new Error("Failed to fetch regions");
        const data = (await response.json()) as Region[];
        setRegions(data);
      } catch (err) {
        console.error("Error fetching regions:", err);
        setError("Failed to load regions.");
      } finally {
        setIsLoadingRegions(false);
      }
    };
    void fetchRegions();
  }, []);

  // Fetch venue types
  useEffect(() => {
    const fetchVenueTypes = async () => {
      setIsLoadingVenueTypes(true);
      try {
        const response = await fetch("/api/venue-types");
        if (!response.ok) throw new Error("Failed to fetch venue types");
        const data = (await response.json()) as {
          id: string;
          name: string;
          description: string;
        }[];
        setVenueTypes(data);
      } catch (err) {
        console.error("Error fetching venue types:", err);
        setError("Failed to load venue types. Please try again.");
      } finally {
        setIsLoadingVenueTypes(false);
      }
    };

    void fetchVenueTypes();
  }, []);

  // Fetch venue data
  useEffect(() => {
    if (!venueId) return;
    const fetchVenue = async () => {
      setIsFetching(true);
      setError("");
      try {
        const response = await fetch(`/api/venues/${venueId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Venue not found");
          }
          throw new Error("Failed to fetch venue data");
        }
        const data = (await response.json()) as FetchedVenueData;

        // Extract venue type IDs from the fetched data
        const venueTypeIds = data.venueTypes?.map((vt) => vt.id) ?? [];
        


        reset({
          name: data.name,
          address: data.address,
          capacity: data.capacity ?? 0,
          regionId: data.regionId,
          latitude: data.latitude ?? undefined,
          longitude: data.longitude ?? undefined,
          googleMapsUrl: data.googleMapsUrl ?? "",
          remarks: data.remarks ?? "",
          socialMediaLinks: {
            facebook: data.socialMediaLinks?.facebook ?? "",
            instagram: data.socialMediaLinks?.instagram ?? "",
            tiktok: data.socialMediaLinks?.tiktok ?? "",
            twitter: data.socialMediaLinks?.twitter ?? "",
            youtube: data.socialMediaLinks?.youtube ?? "",
          },
          venueTypeIds: venueTypeIds,
          primaryVenueTypeId: data.primaryVenueTypeId ?? "",
        });

        // This state is for rendering the checkboxes correctly
        setSelectedVenueTypes(venueTypeIds);
        setPrimaryVenueType(data.primaryVenueTypeId ?? "");
        
        console.log("Set selectedVenueTypes to:", venueTypeIds);
        console.log("Set primaryVenueType to:", data.primaryVenueTypeId ?? "");

        // Set current images for display
        setCurrentThumbnailUrl(data.thumbnailUrl);
        setCurrentImageUrls(data.imageUrls ?? []);
      } catch (err) {
        console.error("Error fetching venue:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load venue data.",
        );
      } finally {
        setIsFetching(false);
      }
    };
    void fetchVenue();
  }, [venueId, reset]);

  const handleVenueTypeChange = (typeId: string) => {
    const newSelectedIds = selectedVenueTypes.includes(typeId)
      ? selectedVenueTypes.filter((id) => id !== typeId)
      : [...selectedVenueTypes, typeId];

    setSelectedVenueTypes(newSelectedIds);
    setValue("venueTypeIds", newSelectedIds, { shouldValidate: true });

    // Handle primary venue type logic
    if (!newSelectedIds.includes(primaryVenueType)) {
      // If the current primary venue type is no longer selected, reset it
      const newPrimaryType = newSelectedIds.length > 0 ? newSelectedIds[0]! : "";
      setPrimaryVenueType(newPrimaryType);
      setValue("primaryVenueTypeId", newPrimaryType);
    } else if (newSelectedIds.length === 1 && !primaryVenueType) {
      // If this is the first venue type selected and no primary is set, make it primary
      setPrimaryVenueType(typeId);
      setValue("primaryVenueTypeId", typeId);
    }
  };

  const handlePrimaryVenueTypeChange = (
    e: ChangeEvent<HTMLSelectElement>,
  ) => {
    const newPrimaryVenueType = e.target.value;
    setPrimaryVenueType(newPrimaryVenueType);
    setValue("primaryVenueTypeId", newPrimaryVenueType);
  };

  // --- File Handlers ---
  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(null);
    }
  };

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImageFiles(files);
    setImagePreviews([]);
    const newPreviews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
          setImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
    if (files.length === 0) {
      setImagePreviews([]);
    }
  };

  // --- onSubmit Handler ---
  const onSubmit = async (data: VenueFormData) => {
    setIsLoading(true);
    setError("");

    let finalThumbnailUrl = currentThumbnailUrl;
    let finalImageUrls = currentImageUrls;

    try {
      // 1. Upload NEW Thumbnail (if selected)
      if (thumbnailFile) {
        try {
          const uploadedUrl = await uploadFile(thumbnailFile, "venue", "thumbnail");
          finalThumbnailUrl = uploadedUrl;
        } catch (error) {
          throw new Error(`Failed to upload new thumbnail image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 2. Upload NEW Venue Images (if selected)
      if (imageFiles.length > 0) {
        try {
          const uploadPromises = imageFiles.map((file) =>
            uploadFile(file, "venue", "images"),
          );
          const results = await Promise.all(uploadPromises);
          finalImageUrls = results.filter((url): url is string => url !== null);
        } catch (error) {
          throw new Error(`Failed to upload new venue images: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 3. Prepare final data for venue update API
      const venueUpdateData = {
        ...data,
        venueTypeIds: selectedVenueTypes,
        primaryVenueTypeId: primaryVenueType,
        latitude:
          data.latitude === undefined || isNaN(data.latitude)
            ? null
            : data.latitude,
        longitude:
          data.longitude === undefined || isNaN(data.longitude)
            ? null
            : data.longitude,
        thumbnailUrl: finalThumbnailUrl,
        imageUrls: finalImageUrls,
      };

      console.log("Submitting final venue update data:", venueUpdateData);

      // 4. Send data to venue update API (PUT request)
      const response = await fetch(`/api/venues/${venueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venueUpdateData),
      });

      if (!response.ok) {
        const errorData: { error?: string } = await response
          .json()
          .catch(() => ({}));
        throw new Error(
          errorData.error ??
            `Failed to update venue (status: ${response.status})`,
        );
      }

      router.push("/admin/venues");
    } catch (error) {
      console.error("Error updating venue:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update venue. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching ?? isLoadingRegions) {
    return <div className="py-10 text-center">Loading venue data...</div>;
  }

  if (error && !isFetching) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow-md">
        <p className="mb-4 font-bold text-red-600">Error: {error}</p>
        <Link href="/admin/venues" className="text-blue-600 hover:underline">
          Return to Venues List
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Edit Venue</h1>

      {error && (
        <div
          className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Input */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Venue Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Region Select */}
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

        {/* Address Input */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700"
          >
            Address
          </label>
          <textarea
            id="address"
            rows={3}
            {...register("address")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* Lat/Lon Inputs */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="latitude"
              className="block text-sm font-medium text-gray-700"
            >
              Latitude (Optional)
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              {...register("latitude")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.latitude && (
              <p className="mt-1 text-sm text-red-600">
                {errors.latitude.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="longitude"
              className="block text-sm font-medium text-gray-700"
            >
              Longitude (Optional)
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              {...register("longitude")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.longitude && (
              <p className="mt-1 text-sm text-red-600">
                {errors.longitude.message}
              </p>
            )}
          </div>
        </div>

        {/* Capacity Input */}
        <div>
          <label
            htmlFor="capacity"
            className="block text-sm font-medium text-gray-700"
          >
            Capacity
          </label>
          <input
            id="capacity"
            type="number"
            {...register("capacity")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.capacity && (
            <p className="mt-1 text-sm text-red-600">
              {errors.capacity.message}
            </p>
          )}
        </div>

        {/* Thumbnail Management */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Current Thumbnail
          </label>
          {currentThumbnailUrl ? (
            <Image
              src={currentThumbnailUrl}
              alt="Current thumbnail"
              width={96}
              height={96}
              className="mb-2 rounded-md object-cover"
            />
          ) : (
            <p className="mb-2 text-sm text-gray-500">No current thumbnail.</p>
          )}
          <label
            htmlFor="thumbnail"
            className="block text-sm font-medium text-gray-700"
          >
            {currentThumbnailUrl ? "Replace" : "Upload"} Thumbnail Image
          </label>
          <input
            id="thumbnail"
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
          {thumbnailPreview && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-600">
                New thumbnail preview:
              </p>
              <Image
                src={thumbnailPreview}
                alt="New thumbnail preview"
                width={96}
                height={96}
                className="mt-1 rounded-md object-cover"
              />
            </div>
          )}
        </div>

        {/* Google Maps URL */}
        <div>
          <label
            htmlFor="googleMapsUrl"
            className="block text-sm font-medium text-gray-700"
          >
            Google Maps URL
          </label>
          <input
            id="googleMapsUrl"
            type="url"
            {...register("googleMapsUrl")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="https://maps.google.com/..."
          />
          {errors.googleMapsUrl && (
            <p className="mt-1 text-sm text-red-600">
              {errors.googleMapsUrl.message}
            </p>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label
            htmlFor="remarks"
            className="block text-sm font-medium text-gray-700"
          >
            Remarks
          </label>
          <textarea
            id="remarks"
            {...register("remarks")}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Additional information about the venue..."
          />
        </div>

        {/* Social Media Links */}
        <div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Social Media Links
          </h3>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="facebook"
                className="block text-sm font-medium text-gray-700"
              >
                Facebook
              </label>
              <input
                id="facebook"
                type="url"
                {...register("socialMediaLinks.facebook")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="https://facebook.com/..."
              />
              {errors.socialMediaLinks?.facebook && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.socialMediaLinks.facebook.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="instagram"
                className="block text-sm font-medium text-gray-700"
              >
                Instagram
              </label>
              <input
                id="instagram"
                type="url"
                {...register("socialMediaLinks.instagram")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="https://instagram.com/..."
              />
              {errors.socialMediaLinks?.instagram && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.socialMediaLinks.instagram.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tiktok"
                className="block text-sm font-medium text-gray-700"
              >
                TikTok
              </label>
              <input
                id="tiktok"
                type="url"
                {...register("socialMediaLinks.tiktok")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="https://tiktok.com/..."
              />
              {errors.socialMediaLinks?.tiktok && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.socialMediaLinks.tiktok.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="twitter"
                className="block text-sm font-medium text-gray-700"
              >
                Twitter
              </label>
              <input
                id="twitter"
                type="url"
                {...register("socialMediaLinks.twitter")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="https://twitter.com/..."
              />
              {errors.socialMediaLinks?.twitter && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.socialMediaLinks.twitter.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="youtube"
                className="block text-sm font-medium text-gray-700"
              >
                YouTube
              </label>
              <input
                id="youtube"
                type="url"
                {...register("socialMediaLinks.youtube")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="https://youtube.com/..."
              />
              {errors.socialMediaLinks?.youtube && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.socialMediaLinks.youtube.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Venue Types */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Venue Types
          </label>

          {isLoadingVenueTypes ? (
            <div className="py-4 text-center">Loading venue types...</div>
          ) : venueTypes.length === 0 ? (
            <div className="py-4 text-center text-red-500">
              No venue types available. Please try refreshing the page.
            </div>
          ) : (
            <div>
              <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {venueTypes.map((type) => (
                  <div key={type.id} className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id={`type-${type.id}`}
                        type="checkbox"
                        checked={selectedVenueTypes.includes(type.id)}
                        onChange={() => handleVenueTypeChange(type.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor={`type-${type.id}`}
                        className="font-medium text-gray-700"
                      >
                        {type.name}
                      </label>
                      {type.description && (
                        <p className="text-gray-500">{type.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedVenueTypes.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Primary Venue Type
                  </label>
                  <select
                    value={primaryVenueType}
                    onChange={handlePrimaryVenueTypeChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select primary venue type</option>
                    {selectedVenueTypes.map((typeId) => (
                      <option key={typeId} value={typeId}>
                        {venueTypes.find((t) => t.id === typeId)?.name ??
                          typeId}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {errors.venueTypeIds && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.venueTypeIds.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Venue Thumbnail Management */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Current Venue Thumbnail
          </label>
          {currentThumbnailUrl ? (
            <div className="mb-2">
              <Image
                src={currentThumbnailUrl}
                alt="Current venue thumbnail"
                width={120}
                height={120}
                className="rounded-md object-cover"
              />
            </div>
          ) : (
            <p className="mb-2 text-sm text-gray-500">
              No current venue thumbnail.
            </p>
          )}
          <label
            htmlFor="thumbnail"
            className="block text-sm font-medium text-gray-700"
          >
            {currentThumbnailUrl ? "Replace" : "Upload"} Venue Thumbnail
          </label>
          <input
            id="thumbnail"
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
          {thumbnailPreview && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-600">
                New thumbnail preview:
              </p>
              <div className="mt-1">
                <Image
                  src={thumbnailPreview}
                  alt="New venue thumbnail preview"
                  width={120}
                  height={120}
                  className="rounded-md object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Venue Images Management */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Current Venue Images
          </label>
          {currentImageUrls.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {currentImageUrls.map((url, index) => (
                <Image
                  key={index}
                  src={url}
                  alt={`Current venue image ${index + 1}`}
                  width={96}
                  height={96}
                  className="rounded-md object-cover"
                />
              ))}
            </div>
          ) : (
            <p className="mb-2 text-sm text-gray-500">
              No current venue images.
            </p>
          )}
          <label
            htmlFor="images"
            className="block text-sm font-medium text-gray-700"
          >
            {currentImageUrls.length > 0 ? "Replace All" : "Upload"} Venue
            Images (Multiple allowed)
          </label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
          {imagePreviews.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-600">
                New images preview:
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {imagePreviews.map((preview, index) => (
                  <Image
                    key={index}
                    src={preview}
                    alt={`New venue image preview ${index + 1}`}
                    width={96}
                    height={96}
                    className="rounded-md object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submission Buttons */}
        <div className="flex justify-end space-x-3 border-t pt-6">
          <Link
            href="/admin/venues"
            className="rounded-md border border-gray-300 bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading ?? isFetching}
            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
