"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { 
  isClientProcessingSupported, 
  processUltraSmallImage
} from "~/lib/client-image-processing";

export interface UploadedUltraSmallImageData {
  url: string;
  originalFilename: string;
}

export interface UploadUltraSmallImageProps {
  /** Type of upload - thumbnail (single) or images (multiple) */
  type: "thumbnail" | "images";
  
  /** Entity type for organizing in S3 (e.g., "products", "fighters") */
  entityType: string;
  
  /** Optional entity ID for organizing in S3 */
  entityId?: string;
  
  /** Initial image URL(s) */
  value?: string | string[] | UploadedUltraSmallImageData | UploadedUltraSmallImageData[];
  
  /** Callback when images change */
  onChange: (value: UploadedUltraSmallImageData | UploadedUltraSmallImageData[] | null) => void;
  
  /** Custom label */
  label?: string;
  
  /** Help text */
  helpText?: string;
  
  /** Max images allowed (for type="images" only) */
  maxImages?: number;
  
  /** Additional CSS class */
  className?: string;
  
  /** Show compression info */
  showInfo?: boolean;
}

interface UploadStats {
  [url: string]: {
    originalSize: number;
    compressedSize: number;
    reduction: number;
  };
}

export function UploadUltraSmallImage({
  type = "thumbnail",
  entityType,
  entityId,
  value,
  onChange,
  label,
  helpText,
  maxImages = 8,
  className = "",
  showInfo = true,
}: UploadUltraSmallImageProps) {
  // Current image data (URL and original filename)
  const initialImages: UploadedUltraSmallImageData[] = (
    Array.isArray(value) ? value : value ? [value] : []
  ).map(item =>
    typeof item === 'string' ? { url: item, originalFilename: "" } : item
  );
  const [currentImages, setCurrentImages] = useState<UploadedUltraSmallImageData[]>(initialImages);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Stats about compression (original vs compressed)
  const [stats, setStats] = useState<UploadStats>({});
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Is this a thumbnail (single image) upload?
  const isThumbnail = type === "thumbnail";
  
  // Whether we can upload more images
  const canUploadMore = isThumbnail ? currentImages.length === 0 : currentImages.length < maxImages;
  
  // Determine if client-side processing is available
  const useClientProcessing = isClientProcessingSupported();
  
  // Handle file upload
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Filter to just image files
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length === 0) return;
    
    // For thumbnail, use only first file
    // For images, respect the max limit
    const filesToProcess = isThumbnail 
      ? (imageFiles[0] ? [imageFiles[0]] : [])
      : imageFiles.slice(0, maxImages - currentImages.length);

    const filesToUpload = filesToProcess.filter(f => f instanceof File) as File[];
    
    if (filesToUpload.length === 0) return;
    
    setIsUploading(true);
    setProgress(5);
    setError(null);
    
    try {
      const newlyUploadedItems: UploadedUltraSmallImageData[] = [];
      const newStats: UploadStats = {};
      
      // Process each file
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        if (!file) continue;
        
        // Update progress
        setProgress(Math.round(5 + (i / filesToUpload.length) * 70));
        
        let uploadFile: File | undefined;
        let originalSize: number;
        let compressedSize: number;
        
        // Try client-side processing first if supported
        if (useClientProcessing) {
          try {
            const processed = await processUltraSmallImage(file);
            
            uploadFile = processed.file;
            originalSize = processed.originalSize;
            compressedSize = processed.compressedSize;
          } catch (e) {
            // Fall back to server-side processing
            uploadFile = file;
            originalSize = Math.round(file.size / 1024);
            compressedSize = 0;
          }
        } else {
          // Use server-side processing
          uploadFile = file;
          originalSize = Math.round(file.size / 1024);
          compressedSize = 0;
        }
        
        if (!uploadFile || !(uploadFile instanceof File)) {
          console.error("Invalid file object provided for upload:", uploadFile);
          throw new Error("Invalid file object provided for upload.");
        }

        const formData = new FormData();
        formData.append('image', uploadFile); 
        formData.append('type', 'ultra-small'); // New type for 30KB limit
        formData.append('entityType', entityType);
        if (entityId) {
          formData.append('entityId', entityId);
        }
        if (uploadFile.name) {
            formData.append('originalFilename', uploadFile.name);
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        setProgress(Math.round(5 + (i / filesToUpload.length) * 70 + 25));

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Upload failed with no details' }));
          throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
        }

        const uploadData = await response.json();
        if (!uploadData.url || typeof uploadData.originalFilename !== 'string') {
          throw new Error('Upload response did not include a URL or originalFilename.');
        }
        
        newlyUploadedItems.push({ url: uploadData.url, originalFilename: uploadData.originalFilename });

        if (uploadData.url && typeof uploadData.url === 'string' && uploadData.feedback) {
          newStats[uploadData.url] = {
            originalSize: uploadData.feedback.originalSize ?? originalSize,
            compressedSize: uploadData.feedback.compressedSize ?? compressedSize,
            reduction: uploadData.feedback.reduction ?? 0,
          };
        } else if (uploadData.url && typeof uploadData.url === 'string' && compressedSize > 0) {
          newStats[uploadData.url] = {
            originalSize: originalSize,
            compressedSize: compressedSize,
            reduction: Math.round(((originalSize - compressedSize) / originalSize) * 100),
          };
        }
      }
      
      // Update state with new image data
      setCurrentImages(prevImages => {
        const updatedImages = isThumbnail 
          ? newlyUploadedItems
          : [...prevImages, ...newlyUploadedItems];
        
        const finalImages = (!isThumbnail && updatedImages.length > maxImages)
          ? updatedImages.slice(0, maxImages)
          : updatedImages;

        // Use flushSync to ensure state is updated before calling onChange
        setTimeout(() => {
          onChange(isThumbnail ? (finalImages[0] ?? null) : finalImages);
        }, 0);

        return finalImages;
      });
      
      setStats(prevStats => ({ ...prevStats, ...newStats }));
      
    } catch (e: any) {
      console.error("Upload error:", e);
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      // Reset upload state after a delay
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
      }, 800);
    }
  }, [currentImages, isThumbnail, maxImages, entityType, entityId, useClientProcessing, onChange]);
  
  // Handle dropping files
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      void handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);
  
  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  // Handle clicking the upload area
  const handleClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files);
  }, [handleFiles]);
  
  // Handle image removal
  const handleRemove = useCallback((indexToRemove: number) => {
    setCurrentImages(prevImages => {
      const removedImage = prevImages[indexToRemove];
      const remainingImages = prevImages.filter((_, i) => i !== indexToRemove);
      
      // Clean up stats for the removed image URL
      if (removedImage?.url) {
        setStats(prevStats => {
          const updatedStats = { ...prevStats };
          delete updatedStats[removedImage.url];
          return updatedStats;
        });
      }
      
      // Use setTimeout to avoid setState during render warning
      setTimeout(() => {
        onChange(isThumbnail ? null : remainingImages);
      }, 0);
      
      return remainingImages;
    });
  }, [isThumbnail, onChange]);

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label || (isThumbnail 
            ? "Ultra Small Thumbnail (max 30KB)" 
            : `Ultra Small Images (max ${maxImages} images, each max 30KB)`)}
        </label>
        
        {!isThumbnail && currentImages.length > 0 && (
          <span className="text-xs text-gray-500">
            {currentImages.length} of {maxImages} images
          </span>
        )}
      </div>
      
      {/* Uploaded images */}
      {currentImages.length > 0 && (
        <div className={`mb-3 grid gap-2 ${isThumbnail ? '' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {currentImages.map((image, index) => (
            <div key={index} className="relative aspect-video overflow-hidden rounded-md border border-gray-200">
              {image.url && (
                <Image 
                  src={image.url!} 
                  alt={image.originalFilename || `Uploaded image ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              )}
              
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-xs text-white opacity-80 hover:opacity-100"
                aria-label={`Remove ${image.originalFilename || 'image'}`}
              >
                ✕
              </button>
              
              {/* Show compression stats */}
              {showInfo && image.url && typeof image.url === 'string' && stats[image.url] && (() => {
                const statEntry = stats[image.url];
                if (!statEntry) return null;
                return (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1 text-center text-xs text-white">
                    {statEntry.originalSize}KB → {statEntry.compressedSize}KB 
                    {statEntry.reduction > 0 && ` (${statEntry.reduction}% saved)`}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
      
      {/* Upload area */}
      {canUploadMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            multiple={!isThumbnail}
            onChange={handleFileInputChange}
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="rounded-md border border-gray-300 p-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-sm text-gray-500">
                {progress < 100 ? "Uploading..." : "Processing..."}
              </p>
            </div>
          ) : (
            <div
              className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-4 transition-colors ${
                isDragging 
                  ? "border-blue-400 bg-blue-50" 
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
            >
              <div className="mb-2 h-10 w-10 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <p className="mb-1 text-sm text-gray-600">
                Drag & drop {isThumbnail ? 'ultra small thumbnail' : 'ultra small images'} here, or click to select
              </p>
              <p className="text-xs text-gray-500">
                {useClientProcessing 
                  ? 'Images will be optimized to 30KB before upload' 
                  : 'Images will be converted to WebP format (30KB max)'}
              </p>
            </div>
          )}
          
          {/* Help text or error message */}
          {helpText && !error && (
            <p className="mt-1 text-xs text-gray-500">{helpText}</p>
          )}
          {error && (
            <p className="mt-1 text-xs text-red-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
} 