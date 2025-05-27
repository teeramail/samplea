"use client";

import { useState } from "react";
import { DragDropImageUpload } from "~/components/ui/DragDropImageUpload";
import Link from "next/link";

export default function DragDropUploadDemo() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    thumbnailUrl: "",
    imageUrls: [] as string[],
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data:", formData);
    alert("Form submitted! Check console for data.");
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Upload Test Page</h1>
        <Link 
          href="/admin/courses"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Courses
        </Link>
      </div>
      
      <div className="rounded-lg bg-white p-6 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
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
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Thumbnail upload - exactly like your screenshot */}
              <DragDropImageUpload
                type="thumbnail"
                maxSizeLabel="30KB" 
                entityType="products"
                onChange={(url) => setFormData({...formData, thumbnailUrl: url as string})}
                value={formData.thumbnailUrl}
              />
              
              {/* Multiple images upload - exactly like your screenshot */}
              <DragDropImageUpload
                type="image"
                maxFilesAllowed={8}
                maxSizeLabel="120KB"
                entityType="products"
                onChange={(urls) => setFormData({...formData, imageUrls: urls as string[]})}
                value={formData.imageUrls}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Using the Component</h2>
        <p className="mb-4 text-gray-700">
          This component automatically:
        </p>
        <ul className="mb-4 ml-5 list-disc space-y-1 text-gray-700">
          <li>Accepts drag-and-drop or click-to-upload</li>
          <li>Converts all images to WebP format for better compression</li>
          <li>Limits thumbnails to 80KB (labeled as 30KB for users)</li>
          <li>Limits regular images to 120KB each</li>
          <li>Stores everything in your DigitalOcean Spaces</li>
          <li>Integrates with PostgreSQL by storing URLs (single string or string[] arrays)</li>
        </ul>
        
        <h3 className="mb-2 text-lg font-medium">Code Example</h3>
        <pre className="rounded-md bg-gray-800 p-4 text-xs text-white overflow-x-auto">
{`import { DragDropImageUpload } from "~/components/ui/DragDropImageUpload";

// In your form component:
const [thumbnailUrl, setThumbnailUrl] = useState("");
const [imageUrls, setImageUrls] = useState<string[]>([]);

// Thumbnail upload
<DragDropImageUpload
  type="thumbnail"
  maxSizeLabel="30KB" 
  entityType="products"
  onChange={setThumbnailUrl}
  value={thumbnailUrl}
/>

// Multiple images upload
<DragDropImageUpload
  type="image"
  maxFilesAllowed={8}
  maxSizeLabel="120KB"
  entityType="products"
  onChange={setImageUrls}
  value={imageUrls}
/>`}
        </pre>
      </div>
    </div>
  );
}
