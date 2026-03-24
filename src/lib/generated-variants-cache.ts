/**
 * Remembers successful image generation for the current R2 upload key so
 * revisiting /generate (e.g. back from paywall) does not call /api/generate-images again.
 */
const PREFIX = "tinyscribble:gen-variants:";

export type GeneratedVariantsCachePayload = {
  keys: string[];
  sceneBatchMode: "single" | "triple";
};

export function saveGeneratedVariantKeys(
  r2Key: string,
  keys: string[],
  sceneBatchMode: "single" | "triple"
): void {
  if (typeof window === "undefined" || !r2Key) return;
  try {
    const payload: GeneratedVariantsCachePayload = { keys, sceneBatchMode };
    sessionStorage.setItem(PREFIX + r2Key, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function getGeneratedVariantKeys(r2Key: string): GeneratedVariantsCachePayload | null {
  if (typeof window === "undefined" || !r2Key) return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + r2Key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      "keys" in parsed &&
      Array.isArray((parsed as GeneratedVariantsCachePayload).keys)
    ) {
      const keys = (parsed as GeneratedVariantsCachePayload).keys;
      const mode = (parsed as GeneratedVariantsCachePayload).sceneBatchMode;
      if (
        keys.length > 0 &&
        keys.every((k) => typeof k === "string" && k.length > 0) &&
        (mode === "single" || mode === "triple")
      ) {
        return { keys, sceneBatchMode: mode };
      }
    }

    /** Legacy: raw array of keys (always triple flow). */
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (!parsed.every((k) => typeof k === "string" && k.length > 0)) return null;
      const keys = parsed as string[];
      return {
        keys,
        sceneBatchMode: keys.length === 1 ? "single" : "triple",
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearGeneratedVariantKeys(r2Key: string): void {
  if (typeof window === "undefined" || !r2Key) return;
  try {
    sessionStorage.removeItem(PREFIX + r2Key);
  } catch {
    /* ignore */
  }
}
