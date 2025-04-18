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
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key.startsWith("image")) {
        if (value.size > 120 * 1024) {
          return NextResponse.json({ error: `Venue image ${value.name || ''} must be less than 120KB` }, { status: 400 });
        }
        files.push(value);
      }
    }
    if (files.length === 0) {
      return NextResponse.json({ error: "No venue images uploaded" }, { status: 400 });
    }
    const entityType = typeof formData.get("entityType") === 'string' ? formData.get("entityType") : undefined;
    const entityId = typeof formData.get("entityId") === 'string' ? formData.get("entityId") : undefined;
    const result = await uploadImages(files, entityType as string || "venue-image", entityId as string | undefined);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Upload failed with unknown error' }, { status: 400 });
    }
    return NextResponse.json({ urls: result.urls ?? [] });
  } catch (error) {
    console.error("Error handling venue images upload:", error);
    const message = (error instanceof Error) ? error.message : 'Unknown internal server error';
    return NextResponse.json({ error: "Failed to process venue images upload", details: message }, { status: 500 });
  }
}
