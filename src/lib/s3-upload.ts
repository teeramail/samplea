import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "~/env";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

// Initialize the S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION ?? "sgp1",
  endpoint: env.AWS_ENDPOINT ?? "https://sgp1.digitaloceanspaces.com",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const MAX_FILE_SIZE = 120 * 1024; // 120KB
const MAX_IMAGES = 5;

// Interface for upload response
export interface UploadResponse {
  success: boolean;
  urls?: string[];
  error?: string;
}

/**
 * Process and optimize image before upload
 */
async function processImage(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Process with sharp to optimize and resize if needed
  return await sharp(buffer)
    .resize(800) // Resize to max width of 800px
    .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
    .toBuffer();
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Upload multiple images to S3
 */
export async function uploadImages(
  files: File[],
  entityType: string, // e.g., 'region', 'fighter', etc.
  entityId?: string // Optional entity ID for organizing files
): Promise<UploadResponse> {
  try {
    // Validate number of files
    if (files.length > MAX_IMAGES) {
      return { 
        success: false, 
        error: `Too many files. Maximum allowed is ${MAX_IMAGES}` 
      };
    }
    
    // Filter for image files only
    const imageFiles = files.filter(isImageFile);
    
    if (imageFiles.length === 0) {
      return { 
        success: false, 
        error: "No valid image files found" 
      };
    }
    
    // Prepend the main directory
    const baseDirectory = "thaiboxinghub"; 
    
    // Construct folder path under the base directory
    const entitySpecificPath = entityId 
      ? `${entityType}/${entityId}`
      : `${entityType}/${uuidv4()}`;
      
    const folderPath = `${baseDirectory}/${entitySpecificPath}`;
    
    // Process and upload each file
    const uploadPromises = imageFiles.map(async (file, index) => {
      try {
        // Check file size before processing - each file must be under 120KB individually
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File ${file.name} (${Math.round(file.size / 1024)}KB) exceeds maximum size of 120KB`);
        }
        
        // Process the image
        const processedBuffer = await processImage(file);
        
        // Check processed size - each processed image must still be under 120KB
        if (processedBuffer.length > MAX_FILE_SIZE) {
          throw new Error(`Processed file ${file.name} (${Math.round(processedBuffer.length / 1024)}KB) still exceeds maximum size of 120KB. Please use a smaller or more compressed image.`);
        }
        
        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const fileName = `${folderPath}/${Date.now()}-${index}.${fileExtension}`;
        
        // Upload to S3
        await s3Client.send(
          new PutObjectCommand({
            Bucket: env.AWS_S3_BUCKET ?? "",
            Key: fileName,
            Body: processedBuffer,
            ContentType: file.type,
            ACL: "public-read",
          })
        );
        
        // Construct the public URL correctly - URLs should look like:
        // https://sgp1.digitaloceanspaces.com/teerabucketone/region/xxx-0.jpg
        const bucketUrl = `${env.AWS_ENDPOINT}/${env.AWS_S3_BUCKET}`;
        return `${bucketUrl}/${fileName}`;
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw error; // Re-throw to handle in the outer catch
      }
    });
    
    // Wait for all uploads to complete
    const urls = await Promise.all(uploadPromises);
    
    return {
      success: true,
      urls
    };
  } catch (error) {
    console.error("Error uploading images:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during upload"
    };
  }
}

/**
 * Delete an image from S3
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Extract the key from the URL
    const urlObj = new URL(url);
    const key = urlObj.pathname.substring(1); // Remove leading slash
    
    // Use DeleteObjectCommand instead of PutObjectCommand with private ACL
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET ?? "",
        Key: key,
      })
    );
    
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
} 