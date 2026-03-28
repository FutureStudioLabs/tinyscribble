/**
 * Epoch seconds for counting paid-plan usage (videos/scenes per billing period).
 * Avoids falling back to `start_date` before `trial_end`: that counts trial-era
 * activity against the first paid month after upgrade.
 *
 * Supports period start on the subscription root or on `items[].current_period_start`
 * (Stripe Billing API where root fields are omitted).
 */
export function subscriptionUsagePeriodStartSec(sub: {
  current_period_start?: number | null;
  items?: { data: Array<{ current_period_start?: number | null }> };
  start_date?: number | null;
  trial_end?: number | null;
}): number | null {
  const fromItems = sub.items?.data
    ?.map((i) => i.current_period_start)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const cpsFromItems =
    fromItems && fromItems.length > 0 ? Math.min(...fromItems) : null;
  const cpsRoot =
    typeof sub.current_period_start === "number" && sub.current_period_start > 0
      ? sub.current_period_start
      : null;
  const cps = cpsRoot ?? cpsFromItems;
  const trialEnd =
    typeof sub.trial_end === "number" && sub.trial_end > 0 ? sub.trial_end : null;
  const startDate =
    typeof sub.start_date === "number" && sub.start_date > 0 ? sub.start_date : null;

  if (cps != null) {
    if (trialEnd != null && cps < trialEnd) return trialEnd;
    return cps;
  }
  if (trialEnd != null) return trialEnd;
  return startDate;
}
