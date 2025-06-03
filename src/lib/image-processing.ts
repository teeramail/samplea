import sharp from "sharp";

export interface ImageProcessingOptions {
  format: "webp" | "jpeg";
  maxWidth: number;
  maxSizeKB: number;
  quality: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  sizeKB: number;
  quality: number;
}

const DEFAULT_THUMBNAIL_OPTIONS: ImageProcessingOptions = {
  format: "webp",
  maxWidth: 400,
  maxSizeKB: 80, // 80KB max for thumbnails
  quality: 80,
};

const DEFAULT_IMAGE_OPTIONS: ImageProcessingOptions = {
  format: "webp",
  maxWidth: 800,
  maxSizeKB: 120, // 120KB max for regular images
  quality: 80,
};

const DEFAULT_ULTRA_SMALL_OPTIONS: ImageProcessingOptions = {
  format: "webp",
  maxWidth: 300,
  maxSizeKB: 30, // 30KB max for ultra-small images
  quality: 70,
};

/**
 * Process an image with optimizations
 * @param imageBuffer Input image buffer
 * @param options Processing options
 * @returns Processed image buffer and metadata
 */
export async function processImage(
  imageBuffer: Buffer,
  options: Partial<ImageProcessingOptions> = {},
): Promise<ProcessedImage> {
  // Merge with default options based on image type
  const isThumb = options.maxSizeKB === 80;
  const defaultOptions = isThumb ? DEFAULT_THUMBNAIL_OPTIONS : DEFAULT_IMAGE_OPTIONS;
  const opts = { ...defaultOptions, ...options };

  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata();
  
  // Only resize if the image is larger than maxWidth
  const needsResize = metadata.width && metadata.width > opts.maxWidth;
  
  // Start processing pipeline
  let processor = sharp(imageBuffer);
  
  if (needsResize) {
    processor = processor.resize(opts.maxWidth);
  }
  
  // Convert to the specified format
  let processedBuffer: Buffer;
  let currentQuality = opts.quality;
  
  if (opts.format === "webp") {
    processedBuffer = await processor.webp({ quality: currentQuality }).toBuffer();
  } else {
    processedBuffer = await processor.jpeg({ quality: currentQuality }).toBuffer();
  }
  
  // If still too large, progressively reduce quality
  while (processedBuffer.length > opts.maxSizeKB * 1024 && currentQuality > 40) {
    currentQuality -= 10;
    
    if (opts.format === "webp") {
      processedBuffer = await sharp(imageBuffer)
        .resize(needsResize ? opts.maxWidth : undefined)
        .webp({ quality: currentQuality })
        .toBuffer();
    } else {
      processedBuffer = await sharp(imageBuffer)
        .resize(needsResize ? opts.maxWidth : undefined)
        .jpeg({ quality: currentQuality })
        .toBuffer();
    }
  }
  
  // If still too large after quality reduction, reduce dimensions
  let currentWidth = opts.maxWidth;
  while (
    processedBuffer.length > opts.maxSizeKB * 1024 && 
    currentWidth > Math.floor(opts.maxWidth / 2)
  ) {
    currentWidth = Math.floor(currentWidth * 0.8); // Reduce by 20%
    
    if (opts.format === "webp") {
      processedBuffer = await sharp(imageBuffer)
        .resize(currentWidth)
        .webp({ quality: currentQuality })
        .toBuffer();
    } else {
      processedBuffer = await sharp(imageBuffer)
        .resize(currentWidth)
        .jpeg({ quality: currentQuality })
        .toBuffer();
    }
  }
  
  // Get final image info
  const finalMetadata = await sharp(processedBuffer).metadata();
  
  return {
    buffer: processedBuffer,
    format: opts.format,
    width: finalMetadata.width ?? 0,
    height: finalMetadata.height ?? 0,
    sizeKB: Math.round(processedBuffer.length / 1024),
    quality: currentQuality,
  };
}

/**
 * Process image file from FormData
 */
export async function processImageFile(
  file: File,
  options: Partial<ImageProcessingOptions> = {},
): Promise<ProcessedImage> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return processImage(buffer, options);
}

/**
 * Generate optimized thumbnail
 */
export async function generateThumbnail(file: File): Promise<ProcessedImage> {
  return processImageFile(file, {
    maxSizeKB: 80,
    maxWidth: 400,
    format: "webp",
  });
}

/**
 * Generate optimized image
 */
export async function generateOptimizedImage(file: File): Promise<ProcessedImage> {
  return processImageFile(file, {
    maxSizeKB: 120,
    maxWidth: 800,
    format: "webp",
  });
}

/**
 * Generate ultra-small optimized image (30KB max)
 */
export async function generateUltraSmallImage(file: File): Promise<ProcessedImage> {
  return processImageFile(file, {
    maxSizeKB: 30,
    maxWidth: 300,
    format: "webp",
    quality: 70,
  });
}
