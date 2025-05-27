"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface DragDropImageUploadProps {
  type: "thumbnail" | "image";
  maxFilesAllowed?: number;
  maxSizeLabel?: string;
  onChange: (value: string | string[]) => void;
  value?: string | string[];
  entityType: string;
  entityId?: string;
}

export function DragDropImageUpload({
  type = "thumbnail",
  maxFilesAllowed = 8,
  maxSizeLabel = type === "thumbnail" ? "30KB" : "120KB",
  onChange,
  value,
  entityType,
  entityId,
}: DragDropImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urls, setUrls] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isThumbnail = type === "thumbnail";
  
  // Handle files from drag & drop or file input
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // For thumbnail, only use first file. For images, respect max limit
    const filesToUpload = isThumbnail 
      ? [files[0]] 
      : Array.from(files).slice(0, maxFilesAllowed - urls.length);
    
    if (filesToUpload.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const newUrls: string[] = [];
      
      // Process each file
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        // Update progress
        setUploadProgress(Math.round(10 + (i / filesToUpload.length) * 80));
        
        // Create form data
        const formData = new FormData();
        formData.append("image", file);
        formData.append("entityType", entityType);
        formData.append("type", type); // Server decides compression based on this
        
        if (entityId) {
          formData.append("entityId", entityId);
        }
        
        // Upload to server
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error("Upload failed");
        }
        
        const result = await response.json();
        
        if (result.urls?.[0]) {
          newUrls.push(result.urls[0]);
        }
      }
      
      // Final progress
      setUploadProgress(100);
      
      // Update state based on type
      if (isThumbnail) {
        // For thumbnails, replace existing
        setUrls(newUrls);
        onChange(newUrls[0] || "");
      } else {
        // For images, append to existing
        const updatedUrls = [...urls, ...newUrls];
        setUrls(updatedUrls);
        onChange(updatedUrls);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      // Reset state after upload
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };
  
  // Drag & drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    void handleFiles(files);
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files);
  };
  
  const handleRemoveImage = (index: number) => {
    const newUrls = [...urls];
    newUrls.splice(index, 1);
    setUrls(newUrls);
    
    if (isThumbnail) {
      onChange("");
    } else {
      onChange(newUrls);
    }
  };
  
  // Check if more uploads are allowed
  const canUploadMore = isThumbnail ? urls.length === 0 : urls.length < maxFilesAllowed;
  
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {isThumbnail 
            ? `Thumbnail Image (max ${maxSizeLabel})` 
            : `Product Images (max ${maxFilesAllowed} images, each max ${maxSizeLabel})`}
        </label>
        {!isThumbnail && urls.length > 0 && (
          <span className="text-xs text-gray-500">
            {urls.length} of {maxFilesAllowed} images
          </span>
        )}
      </div>
      
      {/* Show uploaded images */}
      {urls.length > 0 && (
        <div className={`mb-3 grid gap-2 ${isThumbnail ? '' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {urls.map((url, index) => (
            <div key={url} className="group relative aspect-video overflow-hidden rounded-md border border-gray-200">
              <Image 
                src={url} 
                alt={isThumbnail ? "Thumbnail" : `Image ${index + 1}`} 
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-xs text-white opacity-80 hover:opacity-100"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload area */}
      {canUploadMore && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            multiple={!isThumbnail}
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="space-y-2 rounded-md border border-gray-200 p-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-center text-xs text-gray-500">
                {uploadProgress === 100 ? "Processing..." : "Uploading..."}
              </p>
            </div>
          ) : (
            <div 
              className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-4 transition-colors 
                ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="mb-2 h-10 w-10 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="mb-1 text-sm text-gray-600">
                Drag & drop {isThumbnail ? 'thumbnail' : 'images'} here, or click to select
              </p>
              <p className="text-xs text-gray-500">
                All images will be converted to WebP format
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DragDropImageUpload;
