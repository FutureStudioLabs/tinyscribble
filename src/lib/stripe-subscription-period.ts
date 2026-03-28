import type Stripe from "stripe";

/**
 * Newer Stripe Billing payloads often omit period bounds on the subscription root;
 * each subscription item has `current_period_start` / `current_period_end`.
 */
function maxItemPeriodEnd(sub: Stripe.Subscription): number | null {
  const ends = sub.items?.data
    ?.map((i) => i.current_period_end)
    .filter((n): n is number => typeof n === "number" && n > 0);
  if (!ends?.length) return null;
  return Math.max(...ends);
}

function minItemPeriodStart(sub: Stripe.Subscription): number | null {
  const starts = sub.items?.data
    ?.map((i) => i.current_period_start)
    .filter((n): n is number => typeof n === "number" && n > 0);
  if (!starts?.length) return null;
  return Math.min(...starts);
}

/** Unix seconds — end of the current billing period (renewal / reset). */
export function subscriptionCurrentPeriodEndUnix(
  sub: Stripe.Subscription | null | undefined
): number | null {
  if (!sub) return null;
  const legacy = (sub as { current_period_end?: unknown }).current_period_end;
  if (typeof legacy === "number" && legacy > 0) return legacy;
  return maxItemPeriodEnd(sub);
}

/** Unix seconds — start of the current billing period. */
export function subscriptionCurrentPeriodStartUnix(
  sub: Stripe.Subscription | null | undefined
): number | null {
  if (!sub) return null;
  const legacy = (sub as { current_period_start?: unknown }).current_period_start;
  if (typeof legacy === "number" && legacy > 0) return legacy;
  return minItemPeriodStart(sub);
}
