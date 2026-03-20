/**
 * Exit-offer surface (`/paywall/exit`) — client rules (not previously in PROJECT_SCOPE text).
 *
 * 1. **Idle dwell:** user stays on the main trial paywall with no interaction for this long → show exit offer.
 * 2. **Back / leave intent:** in-app back from trial paywall → exit offer first (not straight to `/generate`).
 *
 * Adjust with product if the client specifies different timing or triggers.
 */
export const PAYWALL_EXIT_OFFER_IDLE_MS = 20_000;

export type PaywallExitOfferSource = "idle" | "back";

export function paywallExitPath(source: PaywallExitOfferSource): string {
  const q = new URLSearchParams({ source });
  return `/paywall/exit?${q.toString()}`;
}
