"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { UploadImage, type UploadedImageData } from "~/components/ui/UploadImage";
import { UploadUltraSmallImage, type UploadedUltraSmallImageData } from "~/components/ui/UploadUltraSmallImage";

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
  ]).optional(),
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
  thumbnailUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
});

type VenueFormData = z.infer<typeof venueSchema>;

export default function CreateVenuePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<VenueFormData>({
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
    thumbnailUrl: "",
    imageUrls: [],
  });

  // Upload states using our shared components
  const [thumbnailImage, setThumbnailImage] = useState<UploadedUltraSmallImageData | undefined>(undefined);
  const [venueImages, setVenueImages] = useState<UploadedImageData[]>([]);

  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [venueTypes, setVenueTypes] = useState<
    { id: string; name: string; description: string }[]
  >([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [isLoadingVenueTypes, setIsLoadingVenueTypes] = useState(true);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [primaryVenueType, setPrimaryVenueType] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setErrors({ form: "Failed to load regions. Please try again later." });
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
        setErrors({ form: "Failed to load venue types. Please try again later." });
      } finally {
        setIsLoadingVenueTypes(false);
      }
    };

    void fetchRegions();
    void fetchVenueTypes();
  }, []);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "capacity") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === "latitude" || name === "longitude") {
      setFormData((prev) => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else if (name.startsWith("socialMediaLinks.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        socialMediaLinks: {
          ...prev.socialMediaLinks,
          [field!]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

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

  // Update form data when venue types change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      venueTypeIds: selectedVenueTypes,
      primaryVenueTypeId: primaryVenueType,
    }));
  }, [selectedVenueTypes, primaryVenueType]);

  // Handle thumbnail upload change
  const handleThumbnailChange = (data: UploadedUltraSmallImageData | UploadedUltraSmallImageData[] | null) => {
    if (data && !Array.isArray(data)) {
      setThumbnailImage(data);
      setFormData(prev => ({ ...prev, thumbnailUrl: data.url }));
      setErrors(prev => ({ ...prev, thumbnail: null }));
    } else {
      setThumbnailImage(undefined);
      setFormData(prev => ({ ...prev, thumbnailUrl: "" }));
    }
  };

  // Handle venue images upload change
  const handleVenueImagesChange = (data: UploadedImageData | UploadedImageData[] | null) => {
    if (data) {
      const imagesArray = Array.isArray(data) ? data : [data];
      setVenueImages(imagesArray);
      setFormData(prev => ({ ...prev, imageUrls: imagesArray.map(img => img.url) }));
      setErrors(prev => ({ ...prev, images: null }));
    } else {
      setVenueImages([]);
      setFormData(prev => ({ ...prev, imageUrls: [] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setUploadStatus("Creating venue...");

    try {
      // Clean up the form data before validation
      const cleanedFormData = {
        ...formData,
        // Handle googleMapsUrl - if it's empty, placeholder, or invalid, set to undefined
        googleMapsUrl: formData.googleMapsUrl && 
                      formData.googleMapsUrl.trim() !== "" && 
                      formData.googleMapsUrl !== "https://goo.gl/maps/example" 
                      ? formData.googleMapsUrl 
                      : undefined,
        // Handle remarks - if empty, set to undefined
        remarks: formData.remarks && formData.remarks.trim() !== "" ? formData.remarks : undefined,
      };

      // Validate the form data - images are already uploaded!
      const validatedData = venueSchema.parse({
        ...cleanedFormData,
        thumbnailUrl: thumbnailImage?.url || "",
        imageUrls: venueImages.map(img => img.url),
      });

      // Filter out empty social media links
      const socialMediaLinks = validatedData.socialMediaLinks
        ? Object.fromEntries(
            Object.entries(validatedData.socialMediaLinks).filter(
              ([_, value]) => value && value.trim() !== "",
            ),
          )
        : {};

      const venueData = {
        ...validatedData,
        latitude:
          validatedData.latitude === undefined || isNaN(validatedData.latitude)
            ? null
            : validatedData.latitude,
        longitude:
          validatedData.longitude === undefined || isNaN(validatedData.longitude)
            ? null
            : validatedData.longitude,
        socialMediaLinks,
        // Include venue type information
        venueTypes: validatedData.venueTypeIds.map((typeId) => ({
          venueTypeId: typeId,
          isPrimary: typeId === validatedData.primaryVenueTypeId,
        })),
      };

      console.log("Submitting venue data:", venueData);

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

      setIsSubmitting(false);
      router.push("/admin/venues");
      router.refresh();
    } catch (error) {
      setIsSubmitting(false);
      setUploadStatus("");
      
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            const path = String(err.path[0]);
            fieldErrors[path] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ form: error instanceof Error ? error.message : "An unexpected error occurred" });
      }
    }
  };

  const handleCreateNewRegion = () => {
    router.push("/admin/regions/create");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Create New Venue</h1>

      {errors.form && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-600">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Venue Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Lumpinee Stadium, Rajadamnern Stadium"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>
        </div>

        {/* Region and Capacity */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Region
              </label>
              <button
                type="button"
                onClick={handleCreateNewRegion}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Create New Region
              </button>
            </div>
            <select
              name="regionId"
              value={formData.regionId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select a region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            {errors.regionId && (
              <p className="mt-1 text-sm text-red-600">{errors.regionId}</p>
            )}
            {isLoadingRegions && (
              <p className="mt-1 text-sm text-gray-500">Loading regions...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Capacity
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
            {errors.capacity && (
              <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
            )}
          </div>
        </div>

        {/* Location Coordinates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Latitude
            </label>
            <input
              type="number"
              name="latitude"
              value={formData.latitude ?? ""}
              onChange={handleChange}
              step="any"
              placeholder="13.7563"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Longitude
            </label>
            <input
              type="number"
              name="longitude"
              value={formData.longitude ?? ""}
              onChange={handleChange}
              step="any"
              placeholder="100.5018"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Google Maps URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Google Maps URL
          </label>
          <input
            type="url"
            name="googleMapsUrl"
            value={formData.googleMapsUrl || ""}
            onChange={handleChange}
            placeholder="https://goo.gl/maps/example"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
          {errors.googleMapsUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.googleMapsUrl}</p>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Remarks
          </label>
          <textarea
            name="remarks"
            value={formData.remarks || ""}
            onChange={handleChange}
            rows={3}
            placeholder="Additional information about the venue"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
          {errors.remarks && (
            <p className="mt-1 text-sm text-red-600">{errors.remarks}</p>
          )}
        </div>

        {/* Social Media Links */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Social Media Links
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Facebook
              </label>
              <input
                type="url"
                name="socialMediaLinks.facebook"
                value={formData.socialMediaLinks?.facebook || ""}
                onChange={handleChange}
                placeholder="https://facebook.com/venuepage"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors["socialMediaLinks.facebook"] && (
                <p className="mt-1 text-sm text-red-600">{errors["socialMediaLinks.facebook"]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Instagram
              </label>
              <input
                type="url"
                name="socialMediaLinks.instagram"
                value={formData.socialMediaLinks?.instagram || ""}
                onChange={handleChange}
                placeholder="https://instagram.com/venuepage"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors["socialMediaLinks.instagram"] && (
                <p className="mt-1 text-sm text-red-600">{errors["socialMediaLinks.instagram"]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                TikTok
              </label>
              <input
                type="url"
                name="socialMediaLinks.tiktok"
                value={formData.socialMediaLinks?.tiktok || ""}
                onChange={handleChange}
                placeholder="https://tiktok.com/@venuepage"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors["socialMediaLinks.tiktok"] && (
                <p className="mt-1 text-sm text-red-600">{errors["socialMediaLinks.tiktok"]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Twitter
              </label>
              <input
                type="url"
                name="socialMediaLinks.twitter"
                value={formData.socialMediaLinks?.twitter || ""}
                onChange={handleChange}
                placeholder="https://twitter.com/venuepage"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors["socialMediaLinks.twitter"] && (
                <p className="mt-1 text-sm text-red-600">{errors["socialMediaLinks.twitter"]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                YouTube
              </label>
              <input
                type="url"
                name="socialMediaLinks.youtube"
                value={formData.socialMediaLinks?.youtube || ""}
                onChange={handleChange}
                placeholder="https://youtube.com/channel/venuepage"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              {errors["socialMediaLinks.youtube"] && (
                <p className="mt-1 text-sm text-red-600">{errors["socialMediaLinks.youtube"]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail Upload - Ultra Small (30KB) */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Venue Thumbnail</h3>
          <p className="mb-4 text-sm text-gray-600">
            Upload a thumbnail image that will be automatically compressed to 30KB or less. 
            This ensures fast loading times in venue listings.
          </p>
          <UploadUltraSmallImage
            type="thumbnail"
            entityType="venues"
            value={thumbnailImage}
            onChange={handleThumbnailChange}
            label="Venue Thumbnail (auto-compressed to 30KB)"
            helpText="Recommended: Square images work best for thumbnails"
            showInfo={true}
          />
          {errors.thumbnail && (
            <p className="mt-1 text-sm text-red-600">{errors.thumbnail}</p>
          )}
        </div>

        {/* Venue Images Upload - Regular (120KB) */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Venue Images</h3>
          <p className="mb-4 text-sm text-gray-600">
            Upload venue images that will be automatically compressed to 120KB or less. 
            You can upload up to 8 images to showcase your venue.
          </p>
          <UploadImage
            type="images"
            entityType="venues"
            value={venueImages}
            onChange={handleVenueImagesChange}
            maxImages={8}
            label="Venue Gallery Images (auto-compressed to 120KB each)"
            helpText="Upload multiple images to showcase your venue from different angles"
            showInfo={true}
          />
          {errors.images && (
            <p className="mt-1 text-sm text-red-600">{errors.images}</p>
          )}
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
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                        {venueTypes.find((t) => t.id === typeId)?.name ?? typeId}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {errors.venueTypeIds && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.venueTypeIds}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Image Summary */}
        {(thumbnailImage || venueImages.length > 0) && (
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
                {venueImages.length > 0 ? (
                  <span className="text-green-600">✓ {venueImages.length} image(s) (120KB max each)</span>
                ) : (
                  <span className="text-gray-500">No images uploaded</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? uploadStatus || "Creating..." : "Create Venue"}
          </button>
        </div>
      </form>
    </div>
  );
}
