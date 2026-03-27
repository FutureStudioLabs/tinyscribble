/** Primary OpenAI-compatible gateway (docs: APIYI_INTEGRATION_BRIEF.md). */
export const APIYI_DEFAULT_PRIMARY = "https://api.apiyi.com";

/** Backup when primary returns 5xx / HTML error page (same key, per APIYI docs). */
export const APIYI_DEFAULT_FALLBACK = "https://vip.apiyi.com";

/**
 * Ordered base URLs to try. Override with APIYI_BASE_URL / APIYI_FALLBACK_BASE_URL.
 */
export function getApiyiBaseUrls(): string[] {
  const primary = (
    process.env.APIYI_BASE_URL?.trim() || APIYI_DEFAULT_PRIMARY
  ).replace(/\/$/, "");
  const raw = process.env.APIYI_FALLBACK_BASE_URL?.trim();
  const fallback = (raw || APIYI_DEFAULT_FALLBACK).replace(/\/$/, "");
  if (!fallback || fallback === primary) return [primary];
  return [primary, fallback];
}

/** True if `url` (with or without trailing slash) is an allowed APIYI base for this deploy. */
export function normalizeApiyiBase(url: string): string {
  return url.trim().replace(/\/$/, "");
}

export function isAllowedApiyiBase(url: string): boolean {
  const n = normalizeApiyiBase(url);
  return getApiyiBaseUrls().some((b) => b === n);
}

/** Retry another gateway: overload, upstream 5xx, or HTML error page instead of JSON. */
export function shouldRetryApiyiFailure(status: number, bodyText: string): boolean {
  if (status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  const t = bodyText.trimStart().slice(0, 256).toLowerCase();
  if (t.startsWith("<!doctype") || t.startsWith("<html")) return true;
  return false;
}
