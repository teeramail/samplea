import { NextResponse } from "next/server";
import { uploadImages } from "~/lib/s3-upload";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No thumbnail file uploaded" },
        { status: 400 },
      );
    }
    if (file.size > 30 * 1024) {
      return NextResponse.json(
        { error: "Thumbnail must be less than 30KB" },
        { status: 400 },
      );
    }
    // entityType and entityId are optional for thumbnail
    const entityType =
      typeof formData.get("entityType") === "string"
        ? formData.get("entityType")
        : undefined;
    const entityId =
      typeof formData.get("entityId") === "string"
        ? formData.get("entityId")
        : undefined;
    const result = await uploadImages(
      [file],
      (entityType as string) || "venue-thumbnail",
      entityId as string | undefined,
    );
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Upload failed with unknown error" },
        { status: 400 },
      );
    }
    return NextResponse.json({ urls: result.urls ?? [] });
  } catch (error) {
    console.error("Error handling thumbnail upload:", error);
    const message =
      error instanceof Error ? error.message : "Unknown internal server error";
    return NextResponse.json(
      { error: "Failed to process thumbnail upload", details: message },
      { status: 500 },
    );
  }
}
