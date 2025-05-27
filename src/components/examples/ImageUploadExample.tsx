"use client";

import { useState } from "react";
import { ImageUploader, type ImageUploadResult } from "~/components/shared/ImageUploader";
import { toast } from "react-hot-toast";

export function ImageUploadExample() {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  const handleThumbnailSuccess = (result: ImageUploadResult) => {
    setThumbnailUrl(result.url);
    toast.success(`Thumbnail uploaded (${result.compressedSize}KB)`);
  };
  
  const handleImageSuccess = (result: ImageUploadResult) => {
    setImageUrls((prev) => [...prev, result.url]);
    toast.success(`Image uploaded (${result.compressedSize}KB)`);
  };
  
  const handleError = (error: string) => {
    toast.error(error);
  };
  
  return (
    <div className="mx-auto max-w-3xl p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Image Upload Example</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Thumbnail Uploader */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Thumbnail Upload (max 80KB)</h2>
          <p className="text-sm text-gray-600">
            This uploader is configured for venue thumbnails with a 16:9 aspect ratio crop.
          </p>
          
          <ImageUploader
            type="thumbnail"
            entityType="venues"
            onUploadSuccess={handleThumbnailSuccess}
            onUploadError={handleError}
            cropEnabled={true}
            cropAspect={16/9}
            className="border border-gray-200 rounded-md p-4"
          />
          
          {thumbnailUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">Thumbnail URL:</p>
              <div className="mt-1 flex items-center">
                <input
                  type="text"
                  readOnly
                  value={thumbnailUrl}
                  className="block w-full rounded-md border-gray-300 shadow-sm text-xs"
                />
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(thumbnailUrl);
                    toast.success("URL copied to clipboard");
                  }}
                  className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Multiple Images Uploader */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Image Upload (max 120KB)</h2>
          <p className="text-sm text-gray-600">
            This uploader is configured for venue gallery images without forced cropping.
          </p>
          
          <ImageUploader
            type="image"
            entityType="venues"
            onUploadSuccess={handleImageSuccess}
            onUploadError={handleError}
            className="border border-gray-200 rounded-md p-4"
          />
          
          {imageUrls.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">Uploaded Images ({imageUrls.length}):</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative aspect-video">
                    <img 
                      src={url} 
                      alt={`Uploaded image ${index + 1}`} 
                      className="object-cover w-full h-full rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 border-t pt-4">
        <h3 className="text-md font-medium mb-2">Usage Instructions</h3>
        <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto">
{`// Example usage in your component
import { ImageUploader } from "~/components/shared/ImageUploader";

export function YourForm() {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  return (
    <form>
      {/* Other form fields */}
      
      <div className="form-group">
        <label>Thumbnail Image</label>
        <ImageUploader
          type="thumbnail"
          entityType="venues"
          onUploadSuccess={(result) => setThumbnailUrl(result.url)}
          cropEnabled={true}
          cropAspect={16/9}
        />
      </div>
      
      {/* Submit button */}
    </form>
  );
}`}
        </pre>
      </div>
    </div>
  );
}

export default ImageUploadExample;
