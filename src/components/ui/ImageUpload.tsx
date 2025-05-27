"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";

export interface ImageUploadResult {
  url: string;
  originalSize: number;
  compressedSize: number;
}

export interface ImageUploadProps {
  /** Type of upload - determines size limit (thumbnail: 80KB, image: 120KB) */
  type: "thumbnail" | "image";
  
  /** Entity type for organizing uploads (e.g., "venues", "courses", "products") */
  entityType: string;
  
  /** Optional entity ID for organizing uploads */
  entityId?: string;
  
  /** Initial image URL(s) to display */
  initialValue?: string | string[];
  
  /** Callback when upload is successful */
  onChange?: (value: string | string[]) => void;
  
  /** Label text for the upload button */
  label?: string;
  
  /** Help text displayed below the upload area */
  helpText?: string;
  
  /** Maximum number of images allowed (for image type, ignored for thumbnail) */
  maxImages?: number;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Show file size information */
  showSizeInfo?: boolean;
}

/**
 * A reusable image upload component that automatically converts images to WebP
 * and enforces size limits (80KB for thumbnails, 120KB for regular images)
 */
export function ImageUpload({
  type = "image",
  entityType,
  entityId,
  initialValue = type === "thumbnail" ? "" : [],
  onChange,
  label,
  helpText,
  maxImages = 8,
  className = "",
  showSizeInfo = true,
}: ImageUploadProps) {
  // State for tracking images
  const [images, setImages] = useState<string[]>(
    Array.isArray(initialValue) ? initialValue : initialValue ? [initialValue] : []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sizeInfo, setSizeInfo] = useState<{[key: string]: {original: number, compressed: number}}>({}); 
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine if this is a thumbnail or multi-image upload
  const isThumbnail = type === "thumbnail";
  
  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // For thumbnails, only use the first file
    // For images, respect the maxImages limit
    const selectedFiles = isThumbnail 
      ? [files[0]] 
      : Array.from(files).slice(0, maxImages - images.length);
    
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    setError(null);
    
    try {
      const newUrls: string[] = [];
      const newSizeInfo: {[key: string]: {original: number, compressed: number}} = {};
      
      // Process each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Update progress for each file
        setUploadProgress(Math.round(10 + (i / selectedFiles.length) * 80));
        
        // Create form data
        const formData = new FormData();
        formData.append("image", file);
        formData.append("entityType", entityType);
        formData.append("type", type); // Determines size limit on server
        formData.append("includeFeedback", "true");
        
        if (entityId) {
          formData.append("entityId", entityId);
        }
        
        // Upload file
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }
        
        const result = await response.json();
        
        if (result.urls?.[0]) {
          newUrls.push(result.urls[0]);
          
          // Save size info if feedback is provided
          if (result.feedback) {
            newSizeInfo[result.urls[0]] = {
              original: result.feedback.originalSize,
              compressed: result.feedback.compressedSize,
            };
          }
        }
      }
      
      // Final progress
      setUploadProgress(100);
      
      // Update image state
      if (isThumbnail) {
        // For thumbnails, replace the current image
        setImages(newUrls);
        setSizeInfo(newSizeInfo);
        onChange?.(newUrls[0] || "");
      } else {
        // For multiple images, add to the existing array
        const updatedImages = [...images, ...newUrls];
        setImages(updatedImages);
        setSizeInfo({...sizeInfo, ...newSizeInfo});
        onChange?.(updatedImages);
      }
      
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      // Reset upload state after a delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };
  
  // Handle image removal
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    const removedUrl = newImages.splice(index, 1)[0];
    
    // Update image state
    setImages(newImages);
    
    // Remove from size info
    const newSizeInfo = {...sizeInfo};
    delete newSizeInfo[removedUrl];
    setSizeInfo(newSizeInfo);
    
    // Notify parent
    if (isThumbnail) {
      onChange?.("");
    } else {
      onChange?.(newImages);
    }
  };
  
  // Handle triggering file selection
  const handleSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Determine if more uploads are allowed
  const canAddMore = isThumbnail ? images.length === 0 : images.length < maxImages;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      
      {/* Thumbnail display (single image) */}
      {isThumbnail && images.length > 0 && (
        <div className="relative h-40 w-full overflow-hidden rounded-md border border-gray-200">
          <Image 
            src={images[0]} 
            alt="Thumbnail"
            fill
            className="object-cover"
            unoptimized
          />
          
          <button
            type="button"
            onClick={() => handleRemoveImage(0)}
            className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600"
            aria-label="Remove image"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          
          {/* Size info */}
          {showSizeInfo && sizeInfo[images[0]] && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1 text-center text-xs text-white">
              {sizeInfo[images[0]].original}KB → {sizeInfo[images[0]].compressed}KB 
              ({Math.round((1 - sizeInfo[images[0]].compressed / sizeInfo[images[0]].original) * 100)}% reduction)
            </div>
          )}
        </div>
      )}
      
      {/* Multiple images display */}
      {!isThumbnail && images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, index) => (
            <div key={url} className="group relative aspect-video overflow-hidden rounded-md border border-gray-200">
              <Image 
                src={url} 
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600"
                aria-label="Remove image"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
              
              {/* Size info */}
              {showSizeInfo && sizeInfo[url] && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1 text-center text-xs text-white">
                  {sizeInfo[url].compressed}KB
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Upload button & progress */}
      {canAddMore && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            multiple={!isThumbnail}
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-xs text-gray-500">
                {uploadProgress < 100 ? "Uploading..." : "Processing..."}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSelectClick}
              className="flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 py-3 text-sm text-gray-600 hover:border-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
              </svg>
              {isThumbnail 
                ? "Upload thumbnail (WebP, max 80KB)" 
                : `Upload images (WebP, max 120KB) ${images.length > 0 ? `${images.length}/${maxImages}` : ""}`}
            </button>
          )}
          
          {/* Help text */}
          {helpText && !error && (
            <p className="text-xs text-gray-500">{helpText}</p>
          )}
          
          {/* Error message */}
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </>
      )}
    </div>
  );
}

export default ImageUpload;
