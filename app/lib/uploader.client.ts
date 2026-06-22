/*
 * Thin client wrapper over the uploader scaffold (POST /api/uploader/:type).
 * Used for action-plan supporting documents (PDFs, guidelines, etc.).
 */
export interface UploadResult {
  url: string;
  path: string;
  originalname: string;
  size: number;
  mimeType: string;
}

export async function uploadDocument(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/uploader/document", { method: "POST", body: form });
  const payload = (await res.json()) as { success?: boolean; data?: UploadResult; message?: string };
  if (!res.ok || !payload.success || !payload.data) {
    throw new Error(payload.message ?? "Upload failed");
  }
  return payload.data;
}
