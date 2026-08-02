"use client";

import { ChangeEvent, useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";

export function CloudinaryUpload({ onUploaded }: { onUploaded: (result: { url: string; publicId: string }) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/cloudinary/upload", { method: "POST", body: formData });
      const result = await response.json() as { url?: string; publicId?: string; message?: string };
      if (!response.ok || !result.url) throw new Error(result.message || "Upload gagal.");
      onUploaded({ url: result.url, publicId: result.publicId ?? "" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload gagal.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className={`inline-flex cursor-pointer items-center gap-2 admin-button-secondary ${uploading ? "pointer-events-none opacity-60" : ""}`}>
        {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {uploading ? "Mengunggah..." : "Upload gambar"}
        <input type="file" accept="image/*" onChange={upload} className="sr-only" />
      </label>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
