"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { z } from "zod";
import { UploadImage, type UploadedImageData } from "~/components/ui/UploadImage";
import { UploadUltraSmallImage, type UploadedUltraSmallImageData } from "~/components/ui/UploadUltraSmallImage";
import { useParams } from "next/navigation";

// Define the schema for fighter validation
const fighterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  nickname: z.string().optional(),
  weightClass: z.string().optional(),
  record: z.string().optional(),
  country: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  isFeatured: z.boolean().default(false),
});

type FighterFormData = z.infer<typeof fighterSchema>;

// Available weight classes for Muay Thai
const WEIGHT_CLASSES = [
  "Strawweight (up to 105 lbs / 47.6 kg)",
  "Mini-Flyweight (105-108 lbs / 47.6-49 kg)",
  "Flyweight (108-112 lbs / 49-50.8 kg)",
  "Super Flyweight (112-115 lbs / 50.8-52.2 kg)",
  "Bantamweight (115-118 lbs / 52.2-53.5 kg)",
  "Super Bantamweight (118-122 lbs / 53.5-55.3 kg)",
  "Featherweight (122-126 lbs / 55.3-57.2 kg)",
  "Super Featherweight (126-130 lbs / 57.2-59 kg)",
  "Lightweight (130-135 lbs / 59-61.2 kg)",
  "Super Lightweight (135-140 lbs / 61.2-63.5 kg)",
  "Welterweight (140-147 lbs / 63.5-66.7 kg)",
  "Super Welterweight (147-154 lbs / 66.7-69.9 kg)",
  "Middleweight (154-160 lbs / 69.9-72.6 kg)",
  "Super Middleweight (160-168 lbs / 72.6-76.2 kg)",
  "Light Heavyweight (168-175 lbs / 76.2-79.4 kg)",
  "Cruiserweight (175-200 lbs / 79.4-90.7 kg)",
  "Heavyweight (200+ lbs / 90.7+ kg)",
];

// Countries list for selection
const COUNTRIES = [
  "Thailand", "United States", "United Kingdom", "Australia", "Japan", "Brazil", 
  "Netherlands", "France", "Russia", "Canada", "Germany", "Sweden", "Norway",
  "Finland", "Poland", "Italy", "Spain", "Mexico", "Argentina", "South Korea",
  "China", "Philippines", "Indonesia", "Malaysia", "Singapore", "Vietnam",
  "Myanmar", "Cambodia", "Laos", "India", "Pakistan", "Iran", "Turkey",
  "Egypt", "Morocco", "South Africa", "Nigeria", "Ghana", "Kenya", "Other"
];

export default function EditFighterPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [formData, setFormData] = useState<FighterFormData>({
    name: "",
    nickname: "",
    weightClass: "",
    record: "",
    country: "",
    thumbnailUrl: "",
    imageUrl: "",
    isFeatured: false,
  });
  
  const [thumbnailImage, setThumbnailImage] = useState<UploadedUltraSmallImageData | undefined>(undefined);
  const [fighterImage, setFighterImage] = useState<UploadedImageData | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch fighter data
  const { data: fighter, isLoading: isFighterLoading } = api.fighter.getById.useQuery({ id });
  
  // Update mutation
  const updateFighter = api.fighter.update.useMutation({
    onSuccess: () => {
      router.push("/admin/fighters");
      router.refresh();
    },
    onError: (error) => {
      setIsSubmitting(false);
      setErrors({ form: error.message });
    },
  });
  
  // Delete mutation
  const deleteFighter = api.fighter.delete.useMutation({
    onSuccess: () => {
      router.push("/admin/fighters");
      router.refresh();
    },
  });

  // Load fighter data into form
  useEffect(() => {
    if (fighter && !isFighterLoading) {
      setFormData({
        name: fighter.name,
        nickname: fighter.nickname || "",
        weightClass: fighter.weightClass || "",
        record: fighter.record || "",
        country: fighter.country || "",
                  thumbnailUrl: (fighter as any).thumbnailUrl || "",
        imageUrl: fighter.imageUrl || "",
        isFeatured: fighter.isFeatured,
      });
      
      // Set existing thumbnail if available
      if ((fighter as any).thumbnailUrl) {
        setThumbnailImage({
          url: (fighter as any).thumbnailUrl,
          originalFilename: "Existing fighter thumbnail"
        });
      }
      
      // Set existing image if available
      if (fighter.imageUrl) {
        setFighterImage({
          url: fighter.imageUrl,
          originalFilename: "Existing fighter image"
        });
      }
      
      setIsLoading(false);
    }
  }, [fighter, isFighterLoading]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

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

  // Handle fighter image upload change
  const handleFighterImageChange = (data: UploadedImageData | UploadedImageData[] | null) => {
    if (data && !Array.isArray(data)) {
      setFighterImage(data);
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      setErrors(prev => ({ ...prev, image: null }));
    } else {
      setFighterImage(undefined);
      setFormData(prev => ({ ...prev, imageUrl: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate the form data
      const validatedData = fighterSchema.parse({
        ...formData,
        thumbnailUrl: thumbnailImage?.url || "",
        imageUrl: fighterImage?.url || "",
      });
      
      // Submit to API
      updateFighter.mutate({
        id,
        ...validatedData,
      });
    } catch (error) {
      setIsSubmitting(false);
      
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

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this fighter?")) {
      deleteFighter.mutate({ id });
    }
  };

  if (isLoading || isFighterLoading) {
    return <div className="flex justify-center p-8">Loading fighter data...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Fighter</h1>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Delete Fighter
        </button>
      </div>

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
              Fighter Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="Full name"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nickname
            </label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="Ring name or alias"
            />
            {errors.nickname && (
              <p className="mt-1 text-sm text-red-600">{errors.nickname}</p>
            )}
          </div>
        </div>

        {/* Weight Class and Record */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Weight Class
            </label>
            <select
              name="weightClass"
              value={formData.weightClass}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              <option value="">Select weight class</option>
              {WEIGHT_CLASSES.map((weightClass) => (
                <option key={weightClass} value={weightClass}>
                  {weightClass}
                </option>
              ))}
            </select>
            {errors.weightClass && (
              <p className="mt-1 text-sm text-red-600">{errors.weightClass}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Record
            </label>
            <input
              type="text"
              name="record"
              value={formData.record}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="e.g., 15-3-1 (Wins-Losses-Draws)"
            />
            {errors.record && (
              <p className="mt-1 text-sm text-red-600">{errors.record}</p>
            )}
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="">Select country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="mt-1 text-sm text-red-600">{errors.country}</p>
          )}
        </div>

        {/* Fighter Images Upload */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Fighter Images</h3>
          
          {/* Thumbnail Upload - Ultra Small (30KB) */}
          <div className="mb-6">
            <h4 className="mb-2 text-md font-medium text-gray-800">Fighter Thumbnail</h4>
            <p className="mb-4 text-sm text-gray-600">
              Upload a thumbnail image that will be automatically compressed to 30KB or less. 
              This ensures fast loading times in fighter listings.
            </p>
            <UploadUltraSmallImage
              type="thumbnail"
              entityType="fighters"
              value={thumbnailImage}
              onChange={handleThumbnailChange}
              label="Fighter Thumbnail (auto-compressed to 30KB)"
              helpText="Recommended: Square images work best for thumbnails"
              showInfo={true}
            />
            {errors.thumbnail && (
              <p className="mt-1 text-sm text-red-600">{errors.thumbnail}</p>
            )}
          </div>

          {/* Fighter Image Upload - Regular (120KB) */}
          <div>
            <h4 className="mb-2 text-md font-medium text-gray-800">Fighter Profile Image</h4>
            <p className="mb-4 text-sm text-gray-600">
              Upload a fighter profile image that will be automatically compressed to 120KB or less. 
              This image will be used in detailed fighter profiles.
            </p>
            <UploadImage
              type="thumbnail"
              entityType="fighters"
              value={fighterImage}
              onChange={handleFighterImageChange}
              label="Fighter Profile Image (auto-compressed to 120KB)"
              helpText="Recommended: Portrait orientation works best for fighter images"
              showInfo={true}
            />
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">{errors.image}</p>
            )}
          </div>
        </div>

        {/* Featured Fighter */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            checked={formData.isFeatured}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor="isFeatured"
            className="ml-2 block text-sm text-gray-700"
          >
            Feature this fighter on the homepage
          </label>
        </div>

        {/* Image Summary */}
        {(thumbnailImage || fighterImage) && (
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
                <span className="font-medium">Profile Image:</span>{" "}
                {fighterImage ? (
                  <span className="text-green-600">✓ Uploaded (120KB max)</span>
                ) : (
                  <span className="text-gray-500">Not uploaded</span>
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
            {isSubmitting ? "Updating..." : "Update Fighter"}
          </button>
        </div>
      </form>
    </div>
  );
} 