/**
 * Sanitize `next` / post-login redirects: internal paths only, no open redirects,
 * no loops back to login or auth callback.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (next == null || typeof next !== "string") return "/";
  const trimmed = next.trim();
  const q = trimmed.indexOf("?");
  const pathOnly = (q === -1 ? trimmed : trimmed.slice(0, q)).split("#")[0] ?? "";
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//")) return "/";
  if (pathOnly === "/login" || pathOnly.startsWith("/login/")) return "/";
  if (pathOnly === "/auth/callback" || pathOnly.startsWith("/auth/callback/")) {
    return "/";
  }

  // Keep variant index for video page (login `next` is often `/generate/video?v=0`)
  if (q !== -1 && pathOnly === "/generate/video") {
    const search = trimmed.slice(q + 1).split("#")[0] ?? "";
    const params = new URLSearchParams(search);
    const v = params.get("v");
    if (v !== null && /^[0-2]$/.test(v)) {
      return `/generate/video?v=${v}`;
    }
  }

  return pathOnly || "/";
}

/** Default signed-in landing when `next` is missing or `/`. */
export function resolvePostLoginDestination(next: string | null | undefined): string {
  const p = safeNextPath(next);
  if (p === "/") return "/dashboard";
  return p;
}

export function switchAccountRequested(
  raw: string | string[] | undefined
): boolean {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "1" || v === "true";
}
