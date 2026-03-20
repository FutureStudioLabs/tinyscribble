/**
 * Canonical site URL for Stripe redirects and absolute links.
 * Set `NEXT_PUBLIC_APP_URL` in production (e.g. https://tinyscribble.vercel.app).
 */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}
