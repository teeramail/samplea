"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { type ProcessedImage } from "~/lib/image-processing";
import dynamic from "next/dynamic";
import clsx from "clsx";

// Import types only
type Crop = {
  unit: "px" | "%";
  width: number;
  height: number;
  x: number;
  y: number;
  aspect?: number;
};

// Dynamically import ReactCrop to avoid SSR issues
const ReactCrop = dynamic(
  () => import("react-image-crop").then((mod) => mod.default),
  { ssr: false }
);

// S3 upload helper
async function uploadToS3(
  file: File,
  type: "thumbnail" | "image",
  entityType: string,
  entityId?: string,
): Promise<{ url: string; feedback?: any } | null> {
  try {
    // Create form data
    const formData = new FormData();
    formData.append("image", file);
    formData.append("entityType", entityType);
    formData.append("type", type); // Send type to determine size limit
    formData.append("includeFeedback", "true");
    
    if (entityId) {
      formData.append("entityId", entityId);
    }

    // Upload to S3
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const result = await response.json();
    return { 
      url: result.urls?.[0] ?? null,
      feedback: result.feedback
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    return null;
  }
}

export interface ImageUploadResult {
  url: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  format: string;
  quality: number;
}

export interface ImageUploaderProps {
  type: "thumbnail" | "image";
  entityType: string;
  entityId?: string;
  initialImage?: string;
  onUploadSuccess?: (result: ImageUploadResult) => void;
  onUploadError?: (error: string) => void;
  onUploadStart?: () => void;
  className?: string;
  cropEnabled?: boolean;
  cropAspect?: number;
  maxWidth?: number;
}

export function ImageUploader({
  type = "image",
  entityType,
  entityId,
  initialImage,
  onUploadSuccess,
  onUploadError,
  onUploadStart,
  className,
  cropEnabled = false,
  cropAspect,
  maxWidth,
}: ImageUploaderProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingInfo, setProcessingInfo] = useState<{
    originalSize: number;
    compressedSize: number;
    quality: number;
    width: number;
    height: number;
  } | null>(null);
  
  // Crop state
  const [showCropUI, setShowCropUI] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    aspect: cropAspect,
  });
  const imgRef = useRef<HTMLImageElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropPreview, setCropPreview] = useState<string | null>(null);
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file change
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setSelectedFile(file);
      
      // Clear file input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Show file preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        
        if (cropEnabled) {
          setCropPreview(preview);
          setShowCropUI(true);
        } else {
          handleImageProcess(file);
        }
      };
      reader.readAsDataURL(file);
    },
    [cropEnabled]
  );

  // Process image without cropping
  const handleImageProcess = useCallback(
    async (file: File) => {
      if (!file) return;
      
      try {
        setIsUploading(true);
        onUploadStart?.();
        
        // Show upload in progress
        setUploadProgress(25);
        
        // Calculate original size in KB
        const originalSizeKB = Math.round(file.size / 1024);
                
        // Update progress
        setUploadProgress(50);
        
        // Upload to S3 - let server handle processing
        setUploadProgress(75);
        const result = await uploadToS3(file, type, entityType, entityId);
        
        if (!result || !result.url) {
          throw new Error("Failed to upload image");
        }
        
        // Update progress
        setUploadProgress(100);
        
        // Set image URL
        setImage(result.url);
        
        // Get feedback about processing if available
        if (result.feedback) {
          setProcessingInfo({
            originalSize: originalSizeKB,
            compressedSize: result.feedback.compressedSize,
            quality: result.feedback.quality,
            width: result.feedback.width,
            height: result.feedback.height,
          });
          
          // Call success callback with feedback data
          onUploadSuccess?.({
            url: result.url,
            originalSize: originalSizeKB,
            compressedSize: result.feedback.compressedSize,
            width: result.feedback.width,
            height: result.feedback.height,
            format: result.feedback.format,
            quality: result.feedback.quality,
          });
        } else {
          // Call success callback with minimal data
          onUploadSuccess?.({
            url: result.url,
            originalSize: originalSizeKB,
            compressedSize: 0,
            width: 0,
            height: 0,
            format: "webp",
            quality: 0,
          });
        }
        
        // Reset progress after a delay
        setTimeout(() => {
          setUploadProgress(0);
          setIsUploading(false);
        }, 500);
      } catch (error) {
        console.error("Error processing image:", error);
        onUploadError?.(error instanceof Error ? error.message : "Failed to process image");
        setUploadProgress(0);
        setIsUploading(false);
      }
    },
    [type, entityType, entityId, onUploadSuccess, onUploadError, onUploadStart]
  );

  // Complete crop and process image
  const completeCrop = useCallback(() => {
    if (!imgRef.current || !selectedFile || !crop.width || !crop.height) {
      setShowCropUI(false);
      return;
    }
    
    const canvas = document.createElement("canvas");
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    const ctx = canvas.getContext("2d");
    const pixelRatio = window.devicePixelRatio;
    
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    
    if (ctx) {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = "high";
      
      ctx.drawImage(
        imgRef.current,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );
    }
    
    // Convert to file
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const croppedFile = new File([blob], selectedFile.name, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      
      // Process the cropped image
      void handleImageProcess(croppedFile);
      setShowCropUI(false);
    }, "image/jpeg", 0.95);
  }, [crop, selectedFile, handleImageProcess]);

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {/* Preview */}
      {image && !isUploading && (
        <div className="relative overflow-hidden rounded-md">
          <div className="aspect-video relative">
            <Image 
              src={image} 
              alt="Uploaded image"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={() => setImage(null)}
            className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      
      {/* Compression info */}
      {processingInfo && !isUploading && (
        <div className="text-xs text-gray-600">
          <p>Original: {processingInfo.originalSize}KB • Compressed: {processingInfo.compressedSize}KB ({Math.round((1 - processingInfo.compressedSize / processingInfo.originalSize) * 100)}% reduction)</p>
          <p>Dimensions: {processingInfo.width}×{processingInfo.height} • Quality: {processingInfo.quality}%</p>
        </div>
      )}
      
      {/* Progress bar */}
      {isUploading && (
        <div className="my-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="mt-1 text-center text-sm text-gray-600">
            {uploadProgress < 100 ? "Processing..." : "Upload complete"}
          </p>
        </div>
      )}
      
      {/* Upload button */}
      {(!image || isUploading) && (
        <div className="flex flex-col items-center justify-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={clsx(
              "flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              isUploading && "cursor-not-allowed opacity-50"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            {type === "thumbnail" ? "Upload Thumbnail" : "Upload Image"}
            {type === "thumbnail" ? " (max 80KB)" : " (max 120KB)"}
          </button>
          <p className="text-xs text-gray-500">
            {type === "thumbnail" 
              ? "Recommended size: 400×225px, WebP or JPEG format" 
              : "Recommended size: 800×450px, WebP or JPEG format"}
          </p>
        </div>
      )}
      
      {/* Crop UI */}
      {showCropUI && cropPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] max-w-2xl overflow-auto rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-medium">Crop Image</h3>
            <div className="mb-4">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                aspect={cropAspect}
              >
                <img
                  ref={imgRef}
                  src={cropPreview}
                  alt="Preview"
                  className="max-h-[60vh] max-w-full"
                />
              </ReactCrop>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCropUI(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={completeCrop}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
