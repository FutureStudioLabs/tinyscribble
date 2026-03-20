import { clearGeneratedVariantKeys } from "@/lib/generated-variants-cache";

const PERSISTED_R2_KEY = "tinyscribble:r2-key";

/**
 * Simple store to pass selected file from upload page to loading page.
 * Used during client-side navigation since we can't pass File via URL.
 * r2Key is persisted to sessionStorage so we can restore after paywall/checkout redirects.
 */
let pendingFile: File | null = null;
let previewUrl: string | null = null;
let r2Key: string | null = null;

export function setPendingUpload(file: File) {
  if (r2Key) clearGeneratedVariantKeys(r2Key);
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  pendingFile = file;
  previewUrl = URL.createObjectURL(file);
  r2Key = null;
  try {
    sessionStorage.removeItem(PERSISTED_R2_KEY);
  } catch {
    /* ignore */
  }
}

export function setR2Key(key: string) {
  r2Key = key;
  try {
    sessionStorage.setItem(PERSISTED_R2_KEY, key);
  } catch {
    /* quota / private mode */
  }
}

export function getPendingUpload(): {
  file: File;
  previewUrl: string;
  r2Key: string | null;
} | null {
  if (!pendingFile || !previewUrl) return null;
  return { file: pendingFile, previewUrl, r2Key };
}

/**
 * Restored state from sessionStorage when in-memory was lost (e.g. after paywall redirect).
 * Use when getPendingUpload() is null but user may have been mid-funnel.
 */
export function getRestoredUploadState(): { r2Key: string; previewUrl: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const key = sessionStorage.getItem(PERSISTED_R2_KEY);
    if (!key || !key.startsWith("uploads/")) return null;
    return {
      r2Key: key,
      previewUrl: `/api/media?key=${encodeURIComponent(key)}`,
    };
  } catch {
    return null;
  }
}

export function clearPendingUpload() {
  if (r2Key) clearGeneratedVariantKeys(r2Key);
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  pendingFile = null;
  previewUrl = null;
  r2Key = null;
  try {
    sessionStorage.removeItem(PERSISTED_R2_KEY);
  } catch {
    /* ignore */
  }
}
