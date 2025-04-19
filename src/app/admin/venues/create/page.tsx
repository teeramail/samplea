"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const venueSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  capacity: z.coerce.number().int().min(0, "Capacity must be non-negative"),
  regionId: z.string().min(1, "Please select a region"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  googleMapsUrl: z.union([
    z.string().url("Must be a valid URL"),
    z.string().max(0),
    z.null(),
    z.undefined(),
  ]),
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
});

type VenueFormData = Omit<
  z.infer<typeof venueSchema>,
  "thumbnailUrl" | "imageUrls"
>;

type UploadResponse = {
  urls: string[];
};

async function uploadFile(
  file: File,
  isThumbnail: boolean,
): Promise<string | null> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const endpoint = isThumbnail
      ? "/api/upload-thumbnail"
      : "/api/upload-venue-images";
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed with status:", response.status, errorText);
      return null;
    }

    const result = (await response.json()) as UploadResponse;
    if (result.urls && Array.isArray(result.urls) && result.urls.length > 0) {
      return result.urls[0] ?? null;
    } else {
      console.error(
        "Upload API response missing urls or urls array is empty:",
        result,
      );
      return null;
    }
  } catch (error) {
    console.error("Error during file upload fetch:", error);
    return null;
  }
}

export default function CreateVenuePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [venueTypes, setVenueTypes] = useState<
    { id: string; name: string; description: string }[]
  >([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [isLoadingVenueTypes, setIsLoadingVenueTypes] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [primaryVenueType, setPrimaryVenueType] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema),
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

  useEffect(() => {
    const fetchRegions = async () => {
      setIsLoadingRegions(true);
      try {
        const response = await fetch("/api/regions");
        if (!response.ok) {
          throw new Error("Failed to fetch regions");
        }
        const data = (await response.json()) as { id: string; name: string }[];
        setRegions(data);
      } catch (error) {
        console.error("Error fetching regions:", error);
        setError("Failed to load regions. Please try again later.");
      } finally {
        setIsLoadingRegions(false);
      }
    };

    const fetchVenueTypes = async () => {
      setIsLoadingVenueTypes(true);
      try {
        const response = await fetch("/api/venue-types");
        if (!response.ok) {
          throw new Error("Failed to fetch venue types");
        }
        const data = (await response.json()) as {
          id: string;
          name: string;
          description: string;
        }[];
        setVenueTypes(data);
      } catch (error) {
        console.error("Error fetching venue types:", error);
        setError("Failed to load venue types. Please try again later.");
      } finally {
        setIsLoadingVenueTypes(false);
      }
    };

    void fetchRegions();
    void fetchVenueTypes();
  }, []);

  // Handle venue type selection
  const handleVenueTypeChange = (typeId: string) => {
    setSelectedVenueTypes((prev) => {
      if (prev.includes(typeId)) {
        // If removing the primary type, also clear the primary type
        if (primaryVenueType === typeId) {
          setPrimaryVenueType("");
        }
        return prev.filter((id) => id !== typeId);
      } else {
        // If this is the first type selected, make it primary
        if (prev.length === 0) {
          setPrimaryVenueType(typeId);
        }
        return [...prev, typeId];
      }
    });
  };

  // Update form values when venue types change
  useEffect(() => {
    setValue("venueTypeIds", selectedVenueTypes);
    setValue("primaryVenueTypeId", primaryVenueType);
  }, [selectedVenueTypes, primaryVenueType, setValue]);

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

  const onSubmit = async (data: VenueFormData) => {
    setIsLoading(true);
    setError("");

    let uploadedThumbnailUrl: string | null = null;
    const uploadedImageUrls: string[] = [];

    try {
      if (thumbnailFile) {
        uploadedThumbnailUrl = await uploadFile(thumbnailFile, true);
        if (!uploadedThumbnailUrl) {
          throw new Error(
            "Failed to upload thumbnail image. Please try again.",
          );
        }
      }

      if (imageFiles.length > 0) {
        const uploadVenueImages = async (files: File[]): Promise<string[]> => {
          const formData = new FormData();
          files.forEach((file) => formData.append("image", file));
          const response = await fetch("/api/upload-venue-images", {
            method: "POST",
            body: formData,
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error("Venue image upload failed: " + errorText);
          }
          const result = (await response.json()) as UploadResponse;
          return result.urls ?? [];
        };
        const urls = await uploadVenueImages(imageFiles);
        if (urls.length !== imageFiles.length) {
          throw new Error(
            "Failed to upload one or more venue images. Please try again.",
          );
        }
        uploadedImageUrls.push(...urls);
      }
      // Filter out empty social media links
      const socialMediaLinks = data.socialMediaLinks
        ? Object.fromEntries(
            Object.entries(data.socialMediaLinks).filter(
              ([_, value]) => value && value.trim() !== "",
            ),
          )
        : {};

      const venueData = {
        ...data,
        latitude:
          data.latitude === undefined || isNaN(data.latitude)
            ? null
            : data.latitude,
        longitude:
          data.longitude === undefined || isNaN(data.longitude)
            ? null
            : data.longitude,
        thumbnailUrl: uploadedThumbnailUrl,
        imageUrls: uploadedImageUrls,
        socialMediaLinks,
        // Include venue type information
        venueTypes: data.venueTypeIds.map((typeId) => ({
          venueTypeId: typeId,
          isPrimary: typeId === data.primaryVenueTypeId,
        })),
      };

      console.log("Submitting final venue data:", venueData);

      const response = await fetch("/api/venues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venueData),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error ?? "Failed to create venue");
      }

      router.push("/admin/venues");
    } catch (error) {
      console.error("Error creating venue:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create venue. Please check uploads and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewRegion = () => {
    router.push("/admin/regions/create");
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Add New Venue</h1>

      {error && (
        <div
          className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            placeholder="e.g., Lumpinee Stadium, Rajadamnern Stadium"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="regionId"
              className="block text-sm font-medium text-gray-700"
            >
              Region
            </label>
            <button
              type="button"
              onClick={handleCreateNewRegion}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add New Region
            </button>
          </div>
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
            placeholder="Full address of the venue"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>

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
              placeholder="e.g., 13.7563"
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
              placeholder="e.g., 100.5018"
            />
            {errors.longitude && (
              <p className="mt-1 text-sm text-red-600">
                {errors.longitude.message}
              </p>
            )}
          </div>
        </div>

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
            placeholder="https://goo.gl/maps/example"
            {...register("googleMapsUrl")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.googleMapsUrl && (
            <p className="mt-1 text-sm text-red-600">
              {errors.googleMapsUrl.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="remarks"
            className="block text-sm font-medium text-gray-700"
          >
            Remarks
          </label>
          <textarea
            id="remarks"
            rows={3}
            placeholder="Additional information about the venue"
            {...register("remarks")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.remarks && (
            <p className="mt-1 text-sm text-red-600">
              {errors.remarks.message}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Social Media Links
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="facebook"
                className="block text-sm font-medium text-gray-500"
              >
                Facebook
              </label>
              <input
                id="facebook"
                type="url"
                placeholder="https://facebook.com/venuepage"
                {...register("socialMediaLinks.facebook")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                className="block text-sm font-medium text-gray-500"
              >
                Instagram
              </label>
              <input
                id="instagram"
                type="url"
                placeholder="https://instagram.com/venuepage"
                {...register("socialMediaLinks.instagram")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                className="block text-sm font-medium text-gray-500"
              >
                TikTok
              </label>
              <input
                id="tiktok"
                type="url"
                placeholder="https://tiktok.com/@venuepage"
                {...register("socialMediaLinks.tiktok")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                className="block text-sm font-medium text-gray-500"
              >
                Twitter
              </label>
              <input
                id="twitter"
                type="url"
                placeholder="https://twitter.com/venuepage"
                {...register("socialMediaLinks.twitter")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                className="block text-sm font-medium text-gray-500"
              >
                YouTube
              </label>
              <input
                id="youtube"
                type="url"
                placeholder="https://youtube.com/channel/venuepage"
                {...register("socialMediaLinks.youtube")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.socialMediaLinks?.youtube && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.socialMediaLinks.youtube.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="thumbnail"
            className="block text-sm font-medium text-gray-700"
          >
            Thumbnail Image (for listings)
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
              <Image
                src={thumbnailPreview}
                alt="Thumbnail preview"
                width={150}
                height={96}
                unoptimized
                className="rounded-md object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="images"
            className="block text-sm font-medium text-gray-700"
          >
            Venue Images (Multiple allowed)
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
            <div className="mt-2 flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <Image
                  key={index}
                  src={preview}
                  alt={`Venue image preview ${index + 1}`}
                  width={150}
                  height={96}
                  unoptimized
                  className="rounded-md object-cover"
                />
              ))}
            </div>
          )}
        </div>

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
                    onChange={(e) => setPrimaryVenueType(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {selectedVenueTypes.map((typeId) => (
                      <option key={typeId} value={typeId}>
                        {venueTypes.find((t) => t.id === typeId)?.name ||
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

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/venues")}
            className="mr-3 rounded-md border border-gray-300 bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? "Creating..." : "Create Venue"}
          </button>
        </div>
      </form>
    </div>
  );
}
