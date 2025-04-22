"use server";

import { NextRequest, NextResponse } from "next/server";
import { uploadImages } from "~/lib/s3-upload";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Get the entity type and ID
    const entityType = formData.get("entityType") as string || "product";
    const entityId = formData.get("entityId") as string;
    
    // Get the files
    const thumbnailFile = formData.get("thumbnail") as File | null;
    const imageFiles = formData.getAll("images") as File[];
    
    // Upload thumbnail if provided
    let thumbnailUrl = "";
    if (thumbnailFile) {
      const thumbRes = await uploadImages([thumbnailFile], entityType, entityId);
      if (!thumbRes.success) {
        return NextResponse.json(
          { error: thumbRes.error || "Failed to upload thumbnail" },
          { status: 400 }
        );
      }
      thumbnailUrl = thumbRes.urls?.[0] || "";
    }
    
    // Upload images if provided
    let productImageUrls: string[] = [];
    if (imageFiles.length > 0) {
      const imagesRes = await uploadImages(imageFiles, entityType, entityId);
      if (!imagesRes.success) {
        return NextResponse.json(
          { error: imagesRes.error || "Failed to upload product images" },
          { status: 400 }
        );
      }
      productImageUrls = imagesRes.urls || [];
    }
    
    // Return the URLs
    return NextResponse.json({
      success: true,
      thumbnailUrl,
      imageUrls: productImageUrls
    });
  } catch (error) {
    console.error("Error handling product image upload:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
