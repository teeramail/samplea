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
    
    // Get entity type
    const entityType = formData.get("entityType");
    if (!entityType || typeof entityType !== "string") {
      return NextResponse.json({ error: "Entity type is required" }, { status: 400 });
    }
    
    // Get entity ID if provided
    const entityId = formData.get("entityId");
    const entityIdStr = entityId && typeof entityId === "string" ? entityId : undefined;
    
    // Process files
    const files: File[] = [];
    
    // Extract all files from the form data
    for (const [key, value] of formData.entries()) {
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
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    // Return the URLs
    return NextResponse.json({ urls: result.urls });
    
  } catch (error) {
    console.error("Error handling upload:", error);
    return NextResponse.json(
      { 
        error: "Failed to process upload", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }, 
      { status: 500 }
    );
  }
} 