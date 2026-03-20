/**
 * Sanitize `next` / post-login redirects: internal paths only, no open redirects,
 * no loops back to login or auth callback.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (next == null || typeof next !== "string") return "/";
  const pathOnly = next.trim().split("?")[0] ?? "";
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//")) return "/";
  if (pathOnly === "/login" || pathOnly.startsWith("/login/")) return "/";
  if (pathOnly === "/auth/callback" || pathOnly.startsWith("/auth/callback/")) {
    return "/";
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
