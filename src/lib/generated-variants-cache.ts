/**
 * Remembers successful image generation for the current R2 upload key so
 * revisiting /generate (e.g. back from paywall) does not call /api/generate-images again.
 */
const PREFIX = "tinyscribble:gen-variants:";

export function saveGeneratedVariantKeys(r2Key: string, keys: string[]): void {
  if (typeof window === "undefined" || !r2Key) return;
  try {
    sessionStorage.setItem(PREFIX + r2Key, JSON.stringify(keys));
  } catch {
    /* quota / private mode */
  }
}

export function getGeneratedVariantKeys(r2Key: string): string[] | null {
  if (typeof window === "undefined" || !r2Key) return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + r2Key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 3) return null;
    if (!parsed.every((k) => typeof k === "string" && k.length > 0)) return null;
    return parsed as string[];
  } catch {
    return null;
  }
}

export function clearGeneratedVariantKeys(r2Key: string): void {
  if (typeof window === "undefined" || !r2Key) return;
  try {
    sessionStorage.removeItem(PREFIX + r2Key);
  } catch {
    /* ignore */
  }
}
