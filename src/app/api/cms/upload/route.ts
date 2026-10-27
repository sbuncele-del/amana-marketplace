import { NextRequest, NextResponse } from "next/server";
import { commerceActor, CommerceError } from "@/lib/commerce/access";
import {
  requireOrigin,
  commerceFailure,
  privateHeaders,
} from "@/lib/commerce/http";
import { canCms } from "@/lib/cms/domain";
import { uploadImageSigned } from "@/lib/cloudinary";
export async function POST(r: NextRequest) {
  try {
    requireOrigin(r);
    if (process.env.VERCEL_ENV === "preview")
      throw new CommerceError(
        403,
        "Saving and publishing are disabled in preview to protect the live database.",
      );
    const a = await commerceActor();
    if (
      !canCms(a.admin, a.grants, "product") &&
      !canCms(a.admin, a.grants, "storefront")
    )
      throw new CommerceError(403, "Store editing access is required.");
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    )
      throw new CommerceError(
        503,
        "Image uploads are not configured. Use an existing image URL or ask your administrator to configure image storage.",
      );
    const body = await r.text();
    if (body.length > 4200000)
      throw new CommerceError(413, "Choose an image smaller than 3 MB.");
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      throw new CommerceError(400, "Invalid image.");
    }
    if (
      typeof data.image !== "string" ||
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image)
    )
      throw new CommerceError(400, "Choose a PNG, JPEG or WebP image.");
    const uploaded = await uploadImageSigned(data.image, "plentovo/cms");
    return NextResponse.json(
      { url: uploaded.secure_url },
      { headers: privateHeaders },
    );
  } catch (e) {
    return commerceFailure(e);
  }
}
