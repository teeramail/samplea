import { NextResponse } from "next/server";
import { uploadImages } from "~/lib/s3-upload";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    // Use native Request.formData() instead of formidable
    const formData = await req.formData();
    
    // Get entity type and ensure it's a primitive string
    const entityTypeEntry = formData.get("entityType");
    // Check if it's a string (primitive or object) and not empty
    if (!(typeof entityTypeEntry === 'string' && entityTypeEntry.trim())) {
      return NextResponse.json({ error: "Entity type string is required and cannot be empty" }, { status: 400 });
    }
    const entityType = entityTypeEntry.trim(); // Use the primitive string
    
    // Get entity ID if provided and ensure it's a primitive string
    const entityIdEntry = formData.get("entityId");
    const entityIdStr = (typeof entityIdEntry === 'string' && entityIdEntry.trim()) 
                          ? entityIdEntry.trim() 
                          : undefined;
    
    // Process files
    const files: File[] = [];
    
    // Extract all files from the form data
    for (const [key, value] of formData.entries()) {
      // Ensure value is a File object
      if (value instanceof File && key.startsWith("image")) {
        files.push(value);
      }
    }
    
    if (files.length === 0) {
      return NextResponse.json({ error: "No files were uploaded" }, { status: 400 });
    }
    
    // Upload to DigitalOcean Spaces
    const result = await uploadImages(files, entityType, entityIdStr);
    
    if (!result.success) {
      // Use ?? for default error message
      return NextResponse.json({ error: result.error ?? 'Upload failed with unknown error' }, { status: 400 });
    }
    
    // Return the URLs, use ?? for default empty array
    return NextResponse.json({ urls: result.urls ?? [] });
    
  } catch (error) {
    console.error("Error handling upload:", error);
    // Determine error message safely
    const message = (error instanceof Error) ? error.message : 'Unknown internal server error';
    return NextResponse.json(
      { 
        error: "Failed to process upload", 
        details: message
      }, 
      { status: 500 }
    );
  }
} 