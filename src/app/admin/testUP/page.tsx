"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface UploadedImage {
  url: string;
  originalFilename: string;
  size: number;
}

export default function TestUploadPage() {
  const [thumbnailImage, setThumbnailImage] = useState<UploadedImage | null>(null);
  const [multipleImages, setMultipleImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'thumbnail' | 'images'>('thumbnail');
  
  // Handle file uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Handle uploads based on type
      if (uploadType === 'thumbnail') {
        // Only use the first file for thumbnails
        await uploadSingleFile(files[0]);
      } else {
        // For multiple images, upload each one
        await uploadMultipleFiles(Array.from(files));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };
  
  // Upload a single file as thumbnail
  const uploadSingleFile = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("entityType", "test");
    formData.append("type", "thumbnail");
    formData.append("includeFeedback", "true");
    
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    
    const result = await response.json();
    
    if (result.urls?.[0] && result.originalFilenames?.[0]) {
      setThumbnailImage({
        url: result.urls[0],
        originalFilename: result.originalFilenames[0],
        size: result.feedback?.compressedSize || 0
      });
    }
  };
  
  // Upload multiple files
  const uploadMultipleFiles = async (files: File[]) => {
    const uploadedImages: UploadedImage[] = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("entityType", "test");
      formData.append("type", "image");
      formData.append("includeFeedback", "true");
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }
      
      const result = await response.json();
      
      if (result.urls?.[0] && result.originalFilenames?.[0]) {
        uploadedImages.push({
          url: result.urls[0],
          originalFilename: result.originalFilenames[0],
          size: result.feedback?.compressedSize || 0
        });
      }
    }
    
    setMultipleImages([...multipleImages, ...uploadedImages]);
  };
  
  // Handle clearing images
  const clearImages = () => {
    if (uploadType === 'thumbnail') {
      setThumbnailImage(null);
    } else {
      setMultipleImages([]);
    }
  };
  
  // Formatted JSON for database storage
  const getDatabaseJson = () => {
    if (uploadType === 'thumbnail' && thumbnailImage) {
      return JSON.stringify({
        thumbnailUrl: thumbnailImage.url,
        thumbnailFilename: thumbnailImage.originalFilename
      }, null, 2);
    } else if (uploadType === 'images' && multipleImages.length > 0) {
      return JSON.stringify({
        imageUrls: multipleImages.map(img => img.url),
        imageFilenames: multipleImages.map(img => img.originalFilename)
      }, null, 2);
    }
    
    return "// No images uploaded yet";
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Test Image Upload to S3</h1>
        <Link 
          href="/admin"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Back to Admin
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Controls */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Settings</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="thumbnail"
                  checked={uploadType === 'thumbnail'}
                  onChange={() => setUploadType('thumbnail')}
                  className="mr-2"
                />
                <span>Thumbnail (single image)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="images"
                  checked={uploadType === 'images'}
                  onChange={() => setUploadType('images')}
                  className="mr-2"
                />
                <span>Multiple Images</span>
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image(s)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple={uploadType === 'images'}
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              {uploadType === 'thumbnail' 
                ? 'Image will be optimized to 80KB, WebP format'
                : 'Images will be optimized to 120KB each, WebP format'}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={clearImages}
              disabled={isUploading || (uploadType === 'thumbnail' ? !thumbnailImage : multipleImages.length === 0)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Images
            </button>
          </div>
        </div>
        
        {/* Database Preview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Database Storage</h2>
          <p className="text-sm text-gray-600 mb-2">
            This is how the image data would be stored in PostgreSQL:
          </p>
          
          <pre className="bg-gray-800 text-white p-4 rounded-md text-xs overflow-auto h-56">
            {getDatabaseJson()}
          </pre>
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">PostgreSQL Schema Example:</h3>
            <pre className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-auto">
{`// In your Drizzle schema.ts
export const testUploads = pgTable("test_uploads", {
  id: serial("id").primaryKey(),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailFilename: text("thumbnail_filename"),
  imageUrls: text("image_urls").array(),
  imageFilenames: text("image_filenames").array(),
  createdAt: timestamp("created_at").defaultNow()
});`}
            </pre>
          </div>
        </div>
      </div>
      
      {/* Image Preview */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          {uploadType === 'thumbnail' ? 'Thumbnail Preview' : 'Images Preview'}
        </h2>
        
        {isUploading && (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-3">Uploading...</span>
          </div>
        )}
        
        {uploadType === 'thumbnail' ? (
          thumbnailImage ? (
            <div className="rounded-md overflow-hidden border border-gray-200 relative">
              <div className="aspect-video relative">
                <Image 
                  src={thumbnailImage.url} 
                  alt="Thumbnail" 
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="bg-black bg-opacity-70 text-white text-xs p-2 absolute bottom-0 left-0 right-0">
                <div>Filename: {thumbnailImage.originalFilename}</div>
                <div>Size: {thumbnailImage.size}KB</div>
                <div>URL: {thumbnailImage.url}</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No thumbnail uploaded yet</p>
          )
        ) : (
          multipleImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {multipleImages.map((img, index) => (
                <div key={index} className="rounded-md overflow-hidden border border-gray-200 relative group">
                  <div className="aspect-video relative">
                    <Image 
                      src={img.url} 
                      alt={`Image ${index + 1}`} 
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="bg-black bg-opacity-70 text-white text-xs p-2 absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="truncate">{img.originalFilename}</div>
                    <div>{img.size}KB</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No images uploaded yet</p>
          )
        )}
      </div>
      
      {/* Instructions */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-2">How It Works</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Images are uploaded to the <code className="bg-gray-100 px-1 rounded">test</code> folder in your S3 bucket</li>
          <li>Original filenames are preserved in database fields</li>
          <li>Files are optimized: thumbnails to 80KB, images to 120KB</li>
          <li>All images are converted to WebP format for better compression</li>
          <li>Example PostgreSQL schema shows how to store both URLs and filenames</li>
        </ul>
      </div>
    </div>
  );
}
