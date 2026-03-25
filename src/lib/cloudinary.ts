// Cloudinary Image Upload Integration
// Sign up at https://cloudinary.com (free tier: 25GB storage, 25GB bandwidth/month)

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

interface UploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload an image to Cloudinary from a base64 string or URL
 */
export async function uploadImage(
  file: string, // base64 data URI or URL
  folder: string = "amana/products"
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "amana_unsigned"); // Create this preset in Cloudinary dashboard
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Cloudinary upload error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Upload using signed upload (more secure, for server-side use)
 */
export async function uploadImageSigned(
  file: string,
  folder: string = "amana/products"
): Promise<UploadResult> {
  const timestamp = Math.round(Date.now() / 1000);

  // Create signature
  const crypto = await import("crypto");
  const signatureString = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Cloudinary upload error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  const timestamp = Math.round(Date.now() / 1000);
  const crypto = await import("crypto");
  const signatureString = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("signature", signature);

  await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
    {
      method: "POST",
      body: formData,
    }
  );
}

/**
 * Generate an optimized Cloudinary URL with transformations
 */
export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  const { width = 800, height, quality = 80 } = options;
  const transforms = [`q_${quality}`, `w_${width}`, "f_auto", "c_limit"];
  if (height) transforms.push(`h_${height}`);

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transforms.join(",")}/${publicId}`;
}
