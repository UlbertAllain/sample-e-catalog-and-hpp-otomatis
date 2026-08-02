import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";

export const runtime = "nodejs";

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return false;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return true;
}

export async function POST(request: Request) {
  const admin = await verifyAdminSession();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!configureCloudinary()) return NextResponse.json({ message: "Cloudinary belum dikonfigurasi." }, { status: 503 });

  const { publicId } = (await request.json()) as { publicId?: string };
  if (!publicId || !publicId.startsWith("juice-catalog/products/")) {
    return NextResponse.json({ message: "Public ID tidak valid." }, { status: 400 });
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Gambar gagal dihapus." }, { status: 500 });
  }
}
