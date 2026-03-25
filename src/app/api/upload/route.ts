import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImageSigned } from "@/lib/cloudinary";

// POST /api/upload - Upload image(s)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only sellers can upload images" }, { status: 403 });
    }

    const body = await request.json();
    const { images, folder } = body; // images: array of base64 data URIs

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (images.length > 10) {
      return NextResponse.json({ error: "Maximum 10 images per upload" }, { status: 400 });
    }

    const uploadFolder = folder || "amana/products";

    // Upload all images in parallel
    const results = await Promise.allSettled(
      images.map((img: string) => uploadImageSigned(img, uploadFolder))
    );

    const urls: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        urls.push(result.value.secure_url);
      } else {
        errors.push(`Image ${index + 1}: ${result.reason?.message || "Upload failed"}`);
      }
    });

    return NextResponse.json({
      urls,
      errors: errors.length > 0 ? errors : undefined,
      count: urls.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
