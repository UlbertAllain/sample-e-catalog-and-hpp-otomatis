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
  if (!configureCloudinary()) {
    return NextResponse.json({ message: "Cloudinary belum dikonfigurasi." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File gambar wajib diisi." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "Hanya file gambar yang diperbolehkan." }, { status: 415 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ message: "Ukuran gambar maksimal 5 MB." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "juice-catalog/products",
          resource_type: "image",
          transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }]
        },
        (error, uploadResult) => {
          if (error || !uploadResult) reject(error ?? new Error("Upload gagal."));
          else resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch {
    return NextResponse.json({ message: "Gambar gagal diunggah." }, { status: 500 });
  }
}
