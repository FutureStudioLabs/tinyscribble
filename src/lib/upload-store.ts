/**
 * Simple store to pass selected file from upload page to loading page.
 * Used during client-side navigation since we can't pass File via URL.
 */
let pendingFile: File | null = null;
let previewUrl: string | null = null;
let r2Key: string | null = null;

export function setPendingUpload(file: File) {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  pendingFile = file;
  previewUrl = URL.createObjectURL(file);
  r2Key = null;
}

export function setR2Key(key: string) {
  r2Key = key;
}

export function getPendingUpload(): {
  file: File;
  previewUrl: string;
  r2Key: string | null;
} | null {
  if (!pendingFile || !previewUrl) return null;
  return { file: pendingFile, previewUrl, r2Key };
}

export function clearPendingUpload() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  pendingFile = null;
  previewUrl = null;
  r2Key = null;
}
