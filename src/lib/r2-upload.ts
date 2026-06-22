import { supabase } from "@/integrations/supabase/client";
import { signR2Upload } from "./r2.functions";

export type UploadProvider = "r2" | "lovable";
export interface UploadResult {
  url: string;
  path: string;
  provider: UploadProvider;
}

/**
 * Upload a file directly to Cloudflare R2 via a signed PUT URL.
 * Falls back to the internal `property-media` bucket if R2 fails.
 * Reports real upload progress (0-100) via the optional callback.
 */
export async function uploadPropertyMedia(
  userId: string,
  file: File,
  subdir: string,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const id = crypto.randomUUID();
  const key = `properties/${userId}/${subdir}/${id}.${ext}`;
  const contentType = file.type || "application/octet-stream";

  // 1) Try R2
  try {
    const { uploadUrl, publicUrl } = await signR2Upload({ data: { key, contentType } });
    await xhrPut(uploadUrl, file, contentType, onProgress);
    return { url: publicUrl, path: key, provider: "r2" };
  } catch (err) {
    console.warn("[upload] R2 failed, falling back to backup storage:", err);
    onProgress?.(0);
  }

  // 2) Fallback: backup storage (private bucket + signed URL)
  const fbPath = `${userId}/${subdir}/${id}.${ext}`;
  const { error } = await supabase.storage.from("property-media").upload(fbPath, file, { upsert: false, contentType });
  if (error) throw error;
  const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
  const { data, error: signErr } = await supabase.storage
    .from("property-media")
    .createSignedUrl(fbPath, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("Failed to sign URL");
  onProgress?.(100);
  return { url: data.signedUrl, path: fbPath, provider: "lovable" };
}

function xhrPut(
  url: string,
  file: File,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(95, Math.round((e.loaded / e.total) * 95)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`R2 PUT ${xhr.status}: ${xhr.responseText?.slice(0, 200) ?? ""}`));
      }
    };
    xhr.onerror = () => reject(new Error("R2 network error"));
    xhr.onabort = () => reject(new Error("R2 upload aborted"));
    xhr.send(file);
  });
}