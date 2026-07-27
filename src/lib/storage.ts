"use client";

export async function uploadToStorage(
  file: File,
  _folder: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  onProgress?.(50);

  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/upload/freeimage", {
    method: "POST",
    body: form,
  });

  const data = await res.json() as {
    url?: string;
    error?: string;
  };

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed");
  }

  onProgress?.(100);
  return data.url;
}
