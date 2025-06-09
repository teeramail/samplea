"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { z } from "zod";
import { UploadImage, type UploadedImageData } from "~/components/ui/UploadImage";
import { UploadUltraSmallImage, type UploadedUltraSmallImageData } from "~/components/ui/UploadUltraSmallImage";

// Define the schema for instructor validation
const instructorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
  expertise: z.array(z.string()).optional(),
});

type InstructorFormData = z.infer<typeof instructorSchema>;

interface Props {
  params: { id: string };
}

export default function EditInstructorPage({ params }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<InstructorFormData>({
    name: "",
    bio: "",
    thumbnailUrl: "",
    imageUrls: [],
    expertise: [],
  });
  
  // State for uploaded images using our components
  const [thumbnailImage, setThumbnailImage] = useState<UploadedUltraSmallImageData | undefined>(undefined);
  const [instructorImages, setInstructorImages] = useState<UploadedImageData[]>([]);
  
  // State for expertise management
  const [expertiseInput, setExpertiseInput] = useState("");
  
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch instructor data
  const { data: instructor, isLoading } = api.instructor.getById.useQuery({
    id: params.id,
  });

  // Update instructor mutation
  const updateInstructor = api.instructor.update.useMutation({
    onSuccess: (data) => {
      setIsSubmitting(false);
      router.push("/admin/instructors");
      router.refresh();
    },
    onError: (error) => {
      setIsSubmitting(false);
      setErrors({ form: error.message });
    },
  });

  // Populate form when instructor data is loaded
  useEffect(() => {
    if (instructor) {
      setFormData({
        name: instructor.name,
        bio: instructor.bio || "",
        thumbnailUrl: instructor.thumbnailUrl || "",
        imageUrls: instructor.imageUrls || [],
        expertise: instructor.expertise || [],
      });

      // Set thumbnail image if it exists
      if (instructor.thumbnailUrl) {
        setThumbnailImage({
          url: instructor.thumbnailUrl,
          originalFilename: "", // We don't have the original filename
        });
      }

      // Set gallery images if they exist
      if (instructor.imageUrls && instructor.imageUrls.length > 0) {
        const images = instructor.imageUrls.map(url => ({
          url,
          originalFilename: "", // We don't have the original filenames
        }));
        setInstructorImages(images);
      }
    }
  }, [instructor]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  // Handle instructor images upload change
  const handleInstructorImagesChange = (data: UploadedImageData | UploadedImageData[] | null) => {
    if (data) {
      const imagesArray = Array.isArray(data) ? data : [data];
      setInstructorImages(imagesArray);
      setFormData(prev => ({ ...prev, imageUrls: imagesArray.map(img => img.url) }));
      setErrors(prev => ({ ...prev, images: null }));
    } else {
      setInstructorImages([]);
      setFormData(prev => ({ ...prev, imageUrls: [] }));
    }
  };

  // Handle expertise
  const addExpertise = () => {
    if (expertiseInput.trim() && !formData.expertise?.includes(expertiseInput.trim())) {
      const newExpertise = [...(formData.expertise || []), expertiseInput.trim()];
      setFormData(prev => ({ ...prev, expertise: newExpertise }));
      setExpertiseInput("");
    }
  };

  const removeExpertise = (index: number) => {
    const newExpertise = formData.expertise?.filter((_, i) => i !== index) || [];
    setFormData(prev => ({ ...prev, expertise: newExpertise }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addExpertise();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setUploadStatus("Updating instructor...");

    try {
      // Validate the form data - images are already uploaded!
      const validatedData = instructorSchema.parse({
        ...formData,
        thumbnailUrl: thumbnailImage?.url || "",
        imageUrls: instructorImages.map(img => img.url),
      });
      
      // Submit to API
      updateInstructor.mutate({
        id: params.id,
        ...validatedData,
      });
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

  if (isLoading) return <div className="p-4">Loading instructor...</div>;
  if (!instructor) return <div className="p-4">Instructor not found</div>;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Edit Instructor: {instructor.name}</h1>

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
              Instructor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="Brief bio about the instructor..."
            />
          </div>
        </div>
        
        {/* Expertise Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expertise
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add expertise (e.g., Muay Thai, Boxing, MMA)"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addExpertise}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
          
          {/* Display current expertise */}
          {formData.expertise && formData.expertise.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.expertise.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeExpertise(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Add skills like "Muay Thai", "Boxing", "MMA", "Clinch Work", etc.
          </p>
        </div>

        {/* Thumbnail Upload - Ultra Small (30KB) */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Instructor Thumbnail</h3>
          <p className="mb-4 text-sm text-gray-600">
            Upload a thumbnail image that will be automatically compressed to 30KB or less. 
            This ensures fast loading times while maintaining good visual quality.
          </p>
          <UploadUltraSmallImage
            type="thumbnail"
            entityType="instructors"
            value={thumbnailImage}
            onChange={handleThumbnailChange}
            label="Instructor Thumbnail (auto-compressed to 30KB)"
            helpText="Recommended: Square headshot images work best for instructor thumbnails"
            showInfo={true}
          />
          {errors.thumbnail && (
            <p className="mt-1 text-sm text-red-600">{errors.thumbnail}</p>
          )}
        </div>

        {/* Instructor Images Upload - Regular (120KB) */}
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Instructor Gallery Images</h3>
          <p className="mb-4 text-sm text-gray-600">
            Upload instructor images that will be automatically compressed to 120KB or less. 
            You can upload up to 8 images to showcase the instructor in action, training, or achievements.
          </p>
          <UploadImage
            type="images"
            entityType="instructors"
            value={instructorImages}
            onChange={handleInstructorImagesChange}
            maxImages={8}
            label="Instructor Gallery Images (auto-compressed to 120KB each)"
            helpText="Upload multiple images to showcase the instructor's training style, achievements, and personality"
            showInfo={true}
          />
          {errors.images && (
            <p className="mt-1 text-sm text-red-600">{errors.images}</p>
          )}
        </div>

        {/* Image Summary */}
        {(thumbnailImage || instructorImages.length > 0) && (
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
                {instructorImages.length > 0 ? (
                  <span className="text-green-600">✓ {instructorImages.length} image(s) (120KB max each)</span>
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
            {isSubmitting ? uploadStatus || "Updating..." : "Update Instructor"}
          </button>
        </div>
      </form>
    </div>
  );
} 