/**
 * Node/undici often throws `TypeError: fetch failed` with a nested `cause`
 * (e.g. ECONNREFUSED, certificate errors). Surfaces that for logs and API errors.
 */
export function getFetchErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const parts: string[] = [err.message];
  const c = (err as Error & { cause?: unknown }).cause;
  if (c instanceof Error) {
    parts.push(c.message);
  } else if (c != null && typeof c === "object" && "code" in c) {
    parts.push(String((c as { code?: unknown }).code));
  } else if (c != null) {
    parts.push(String(c));
  }
  return parts.filter(Boolean).join(" — ");
}
