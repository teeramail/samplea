"use client";

import { ImageUploadExample } from "~/components/examples/ImageUploadExample";
import { Toaster } from "react-hot-toast";
import Link from "next/link";

export default function ImageUploadDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Image Upload Component Demo</h1>
          <Link 
            href="/admin/venues"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Venues
          </Link>
        </div>
        
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Component Features</h2>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li><strong>Thumbnail Uploader:</strong> Optimized for thumbnails (80KB max, 400px width)</li>
            <li><strong>Image Uploader:</strong> Optimized for regular images (120KB max, 800px width)</li>
            <li><strong>WebP Conversion:</strong> All images converted to WebP format for better compression</li>
            <li><strong>Image Cropping:</strong> Optional cropping interface with aspect ratio support</li>
            <li><strong>Client-side Preview:</strong> Show image preview before uploading</li>
            <li><strong>Compression Feedback:</strong> Display original vs compressed size</li>
            <li><strong>Progress Indicator:</strong> Visual feedback during upload process</li>
          </ul>
        </div>
        
        <ImageUploadExample />
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
