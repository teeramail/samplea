"use client";

import { useState } from "react";
import { ImageUpload } from "~/components/ui/ImageUpload";
import Link from "next/link";

export default function ImageUploadUsagePage() {
  // For thumbnail example
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  
  // For multi-image example
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  // For form example
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    thumbnailUrl: "",
    imageUrls: [] as string[],
  });
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would submit this data to your API
    console.log("Form data:", formData);
    alert("Form submitted! Check console for data.");
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Image Upload Component Usage</h1>
        <Link 
          href="/admin/courses"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Courses
        </Link>
      </div>
      
      <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Component Features</h2>
        <ul className="ml-5 list-disc space-y-1 text-gray-700">
          <li><strong>Automatic WebP Conversion:</strong> All images are converted to WebP format</li>
          <li><strong>Size Limits:</strong> Thumbnails limited to 80KB, regular images to 120KB</li>
          <li><strong>Multiple Images:</strong> Support for up to 8 images for the image type</li>
          <li><strong>Size Feedback:</strong> Shows original vs compressed size</li>
          <li><strong>Progress Indicator:</strong> Visual feedback during upload</li>
          <li><strong>Flexible API:</strong> Works with string or string[] values</li>
        </ul>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Basic Usage Examples */}
        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Basic Usage</h2>
          
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-medium">Thumbnail Upload</h3>
            <ImageUpload 
              type="thumbnail"
              entityType="examples"
              label="Thumbnail Image"
              helpText="Upload a thumbnail image (automatically converted to WebP, max 80KB)"
              onChange={setThumbnailUrl}
            />
            
            {thumbnailUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium">Selected Thumbnail URL:</p>
                <code className="mt-1 block w-full overflow-x-auto rounded-md bg-gray-100 p-2 text-xs">
                  {thumbnailUrl}
                </code>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="mb-2 text-lg font-medium">Multiple Images Upload</h3>
            <ImageUpload 
              type="image"
              entityType="examples"
              label="Gallery Images"
              helpText="Upload up to 8 images (automatically converted to WebP, max 120KB each)"
              maxImages={8}
              onChange={(urls) => setImageUrls(urls as string[])}
            />
            
            {imageUrls.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium">Selected Image URLs ({imageUrls.length}):</p>
                <code className="mt-1 block w-full overflow-x-auto rounded-md bg-gray-100 p-2 text-xs">
                  {JSON.stringify(imageUrls, null, 2)}
                </code>
              </div>
            )}
          </div>
        </section>
        
        {/* Form Integration Example */}
        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Form Integration</h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Course Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div>
              <ImageUpload 
                type="thumbnail"
                entityType="courses"
                label="Course Thumbnail"
                helpText="Upload a course thumbnail (automatically converted to WebP, max 80KB)"
                onChange={(url) => setFormData({...formData, thumbnailUrl: url as string})}
              />
            </div>
            
            <div>
              <ImageUpload 
                type="image"
                entityType="courses"
                label="Course Images"
                helpText="Upload course images (automatically converted to WebP, max 120KB each)"
                maxImages={5}
                onChange={(urls) => setFormData({...formData, imageUrls: urls as string[]})}
              />
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Submit Form
              </button>
            </div>
          </form>
        </section>
      </div>
      
      {/* Code Examples */}
      <section className="mt-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Code Examples</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-lg font-medium">Thumbnail Upload</h3>
            <pre className="rounded-md bg-gray-800 p-4 text-xs text-white overflow-x-auto">
{`import { useState } from "react";
import { ImageUpload } from "~/components/ui/ImageUpload";

export function YourComponent() {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  
  return (
    <ImageUpload 
      type="thumbnail"
      entityType="courses"
      label="Thumbnail Image"
      helpText="Upload a thumbnail image"
      onChange={setThumbnailUrl}
    />
  );
}`}
            </pre>
          </div>
          
          <div>
            <h3 className="mb-2 text-lg font-medium">Multiple Images Upload</h3>
            <pre className="rounded-md bg-gray-800 p-4 text-xs text-white overflow-x-auto">
{`import { useState } from "react";
import { ImageUpload } from "~/components/ui/ImageUpload";

export function YourComponent() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  return (
    <ImageUpload 
      type="image"
      entityType="courses"
      label="Gallery Images"
      helpText="Upload up to 8 images"
      maxImages={8}
      onChange={(urls) => setImageUrls(urls as string[])}
    />
  );
}`}
            </pre>
          </div>
          
          <div>
            <h3 className="mb-2 text-lg font-medium">tRPC and Drizzle Integration (T3 Stack)</h3>
            <pre className="rounded-md bg-gray-800 p-4 text-xs text-white overflow-x-auto">
{`// In your Drizzle schema (PostgreSQL)
export const courses = pgTable("Course", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnailUrl"),
  imageUrls: text("imageUrls").array(),
  // Other fields...
});

// In your tRPC router
export const courseRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      imageUrls: z.array(z.string()).optional(),
      // Other fields...
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const course = await ctx.db.insert(courses).values({
          id: createId(),
          name: input.name,
          description: input.description ?? null,
          thumbnailUrl: input.thumbnailUrl ?? null,
          imageUrls: input.imageUrls ?? [],
          // Other fields...
        }).returning();
        
        return course[0];
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create course",
        });
      }
    }),
});`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
