import { NextResponse } from "next/server";
import { processImageFile } from "~/lib/image-processing";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "~/env";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize the S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION ?? "sgp1",
  endpoint: env.AWS_ENDPOINT ?? "https://sgp1.digitaloceanspaces.com",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

export async function POST(req: Request) {
  try {
    // Use native Request.formData() instead of formidable
    const formData = await req.formData();

    // First try to extract entity type from the referrer URL if available
    let entityType: string;
    const referrer = req.headers.get('referer') || '';
    
    // Try to extract entity type from URL path
    // Pattern: /admin/{entityType}
    const urlMatch = referrer.match(/\/admin\/([^\/\?]+)/);
    
    if (urlMatch && urlMatch[1]) {
      // Use the path segment after /admin/ as the entity type
      entityType = urlMatch[1].trim();
      console.log("[API Route] Detected entity type from URL:", entityType);
    } else {
      // Fall back to the form data
      const entityTypeEntry = formData.get("entityType");
      // Check if it's a string (primitive or object) and not empty
      if (!(typeof entityTypeEntry === "string" && entityTypeEntry.trim())) {
        return NextResponse.json(
          { error: "Entity type could not be determined from URL and was not provided in the form data" },
          { status: 400 },
        );
      }
      entityType = entityTypeEntry.trim(); // Use the primitive string
    }

    // Get entity ID if provided and ensure it's a primitive string
    const entityIdEntry = formData.get("entityId");
    const entityIdStr =
      typeof entityIdEntry === "string" && entityIdEntry.trim()
        ? entityIdEntry.trim()
        : undefined;

    // Check if this is a thumbnail upload (different size limit)
    const isThumbnail = formData.get("type") === "thumbnail";
    
    // Get the file from form data
    const imageFile = formData.get("image");
    
    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: "No valid image file found" },
        { status: 400 },
      );
    }
    
    // Validate file type
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Uploaded file must be an image" },
        { status: 400 },
      );
    }
    
    // Get the original filename without extension
    const originalFilename = imageFile.name;
    const fileNameWithoutExt = originalFilename.split('.').slice(0, -1).join('.') || originalFilename;
    
    // Process the image with appropriate size limits
    const processedImage = await processImageFile(imageFile, {
      format: "webp",
      maxWidth: isThumbnail ? 400 : 800,
      maxSizeKB: isThumbnail ? 80 : 120,
      quality: 80,
    });
    
    let folderPath: string;
    let s3FileName: string;
    
    // Get the base directory from environment variable
    const baseDirectory = env.AWS_S3_ROOT_FOLDER;
    console.log("[API Route] Using S3 root folder:", baseDirectory);
    
    if (entityType === "testup2") {
      // Use the base directory for testup2 as well
      const entityPath = "testup2";
      folderPath = `${baseDirectory}/${entityPath}`;
      s3FileName = `${folderPath}/${fileNameWithoutExt}-${Date.now()}.${processedImage.format}`;
      console.log("[API Route] testup2 upload path:", folderPath);
    } else if (entityType === "test") {
      // Use the base directory for test as well
      const entityPath = "test";
      folderPath = `${baseDirectory}/${entityPath}`;
      s3FileName = `${folderPath}/${fileNameWithoutExt}-${Date.now()}.${processedImage.format}`;
    } else {
      // Original logic for other entity types
      const entitySpecificPath = entityIdStr
        ? `${entityType}/${entityIdStr}`
        : `${entityType}/${uuidv4()}`;
      folderPath = `${baseDirectory}/${entitySpecificPath}`;
      s3FileName = `${folderPath}/${Date.now()}-${isThumbnail ? 'thumb' : 'image'}.${processedImage.format}`;
    }
    const fileName = s3FileName; // Use s3FileName for clarity in S3Client PutObjectCommand
    
    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET ?? "",
        Key: fileName,
        Body: processedImage.buffer,
        ContentType: `image/${processedImage.format}`,
        ACL: "public-read",
      }),
    );
    
    // Construct the public URL
    const bucketUrl = `${env.AWS_ENDPOINT}/${env.AWS_S3_BUCKET}`;
    const imageUrl = `${bucketUrl}/${fileName}`;
    
    // Determine if we should include feedback
    const includeFeedback = formData.get("includeFeedback") === "true";
    
    // Calculate original size in KB
    const originalSizeKB = Math.round(imageFile.size / 1024);
    
    // Return the URL, original filename, and processing info
    return NextResponse.json({
      url: imageUrl,
      originalFilename: originalFilename,
      feedback: includeFeedback ? {
        originalSize: originalSizeKB,
        compressedSize: processedImage.sizeKB,
        width: processedImage.width,
        height: processedImage.height,
        format: processedImage.format,
        quality: processedImage.quality,
        reduction: Math.round((1 - processedImage.sizeKB / originalSizeKB) * 100),
      } : undefined
    });
  } catch (error) {
    console.error("Error handling upload:", error);
    // Determine error message safely
    const message =
      error instanceof Error ? error.message : "Unknown internal server error";
    return NextResponse.json(
      {
        error: "Failed to process upload",
        details: message,
      },
      { status: 500 },
    );
  }
}
