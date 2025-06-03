/**
 * Client-side image processing utilities to optimize images before upload
 * Converts to WebP and reduces size
 */

// Check if WebP is supported in this browser
export function isWebPSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) {
    return false;
  }
}

interface ProcessedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

interface ImageProcessingOptions {
  maxWidth: number;
  maxHeight?: number;
  quality: number;
  maxSizeKB: number;
  maintainAspectRatio?: boolean;
}

/**
 * Process and optimize an image on the client-side
 */
export async function processImage(
  file: File,
  options: ImageProcessingOptions
): Promise<ProcessedImage> {
  const originalSize = Math.round(file.size / 1024); // KB
  
  // Create image bitmap from file
  const imageBitmap = await createImageBitmap(file);
  
  // Determine dimensions while maintaining aspect ratio if needed
  let width = imageBitmap.width;
  let height = imageBitmap.height;
  
  // Resize if needed
  if (width > options.maxWidth) {
    const aspectRatio = width / height;
    width = options.maxWidth;
    height = options.maintainAspectRatio !== false ? Math.round(width / aspectRatio) : height;
  }
  
  if (options.maxHeight && height > options.maxHeight) {
    const aspectRatio = width / height;
    height = options.maxHeight;
    width = options.maintainAspectRatio !== false ? Math.round(height * aspectRatio) : width;
  }
  
  // Create canvas for drawing the image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Draw the image on canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  ctx.drawImage(imageBitmap, 0, 0, width, height);
  
  // Start with the specified quality
  let quality = options.quality;
  let blob: Blob;
  let compressedSize: number;
  
  // Try WebP first if supported
  const supportsWebP = isWebPSupported();
  
  // Function to get blob
  const getBlob = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (supportsWebP) {
        canvas.toBlob(
          (b) => resolve(b!),
          'image/webp',
          quality / 100
        );
      } else {
        canvas.toBlob(
          (b) => resolve(b!),
          'image/jpeg',
          quality / 100
        );
      }
    });
  };
  
  // Initial compression
  blob = await getBlob();
  compressedSize = Math.round(blob.size / 1024); // KB
  
  // Reduce quality if image is still too large
  while (compressedSize > options.maxSizeKB && quality > 40) {
    quality -= 10;
    blob = await getBlob();
    compressedSize = Math.round(blob.size / 1024);
  }
  
  // Create file from blob
  const extension = supportsWebP ? 'webp' : 'jpg';
  const optimizedFile = new File(
    [blob],
    `${file.name.split('.')[0]}.${extension}`,
    { type: supportsWebP ? 'image/webp' : 'image/jpeg' }
  );
  
  return {
    file: optimizedFile,
    originalSize,
    compressedSize,
    width,
    height,
  };
}

/**
 * Process an image as a thumbnail (max 80KB)
 */
export async function processThumbnail(file: File): Promise<ProcessedImage> {
  return processImage(file, {
    maxWidth: 400,
    quality: 85,
    maxSizeKB: 80,
    maintainAspectRatio: true,
  });
}

/**
 * Process an image for gallery (max 120KB)
 */
export async function processGalleryImage(file: File): Promise<ProcessedImage> {
  return processImage(file, {
    maxWidth: 800,
    quality: 85,
    maxSizeKB: 120,
    maintainAspectRatio: true,
  });
}

/**
 * Process an image for ultra-small size (max 30KB) - for thumbnails or previews
 */
export async function processUltraSmallImage(file: File): Promise<ProcessedImage> {
  return processImage(file, {
    maxWidth: 300,
    quality: 70,
    maxSizeKB: 30,
    maintainAspectRatio: true,
  });
}

/**
 * Check if client-side processing is supported in this browser
 */
export function isClientProcessingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'createImageBitmap' in window &&
    'toBlob' in HTMLCanvasElement.prototype
  );
}
