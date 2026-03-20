/**
 * Canonical site URL for Stripe redirects and absolute links.
 *
 * On Vercel, `VERCEL_URL` is the *deployment* host (e.g. `project-git-branch-xxx.vercel.app`),
 * not your production alias. Without `NEXT_PUBLIC_APP_URL`, Stripe cancel/success would send
 * users to that random host. Prefer `VERCEL_PROJECT_PRODUCTION_URL` when unset (see
 * https://vercel.com/docs/projects/environment-variables/system-environment-variables ).
 */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/\/$/, "");
  if (productionHost) {
    return `https://${productionHost}`;
  }

  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
