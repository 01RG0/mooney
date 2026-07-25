"use client";

const FREEIMAGE_KEY = "6d207e02198a847aa98d0a2a901485a5";

export async function uploadToStorage(
  file: File,
  _folder: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  onProgress?.(50);

  const form = new FormData();
  form.append("key", FREEIMAGE_KEY);
  form.append("action", "upload");
  form.append("source", file);
  form.append("format", "json");

  const res = await fetch("https://freeimage.host/api/1/upload", {
    method: "POST",
    body: form,
  });

  const data = await res.json() as {
    status_code: number;
    image?: { url: string };
    error?: { message: string };
  };

  if (data.status_code !== 200 || !data.image?.url) {
    throw new Error(data.error?.message ?? "Upload failed");
  }

  onProgress?.(100);
  return data.image.url;
}
