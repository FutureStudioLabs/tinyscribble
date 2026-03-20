/**
 * POST multipart FormData with real upload byte progress (XHR upload events).
 * Caps at 99% until the server responds, then sets 100% on success.
 */
export function uploadFormDataWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<{ key: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        const pct = Math.min(99, Math.round((100 * e.loaded) / e.total));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      const data = xhr.response as { key?: string; error?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300 && data && typeof data === "object" && data.key) {
        onProgress(100);
        resolve({ key: data.key });
        return;
      }
      const fromJson =
        data && typeof data === "object" && typeof data.error === "string"
          ? data.error
          : null;
      const msg =
        fromJson ||
        tryParseError(xhr.responseText) ||
        `Upload failed (${xhr.status})`;
      reject(new Error(msg));
    };

    xhr.onerror = () => reject(new Error("Network error — check your connection."));
    xhr.send(formData);
  });
}

function tryParseError(text: string): string | null {
  try {
    const j = JSON.parse(text) as { error?: string };
    return j.error ?? null;
  } catch {
    return null;
  }
}
