/**
 * Epoch seconds for counting paid-plan usage (videos/scenes per billing period).
 * Avoids falling back to `start_date` before `trial_end`: that counts trial-era
 * activity against the first paid month after upgrade.
 */
export function subscriptionUsagePeriodStartSec(sub: {
  current_period_start?: number | null;
  start_date?: number | null;
  trial_end?: number | null;
}): number | null {
  const cps =
    typeof sub.current_period_start === "number" && sub.current_period_start > 0
      ? sub.current_period_start
      : null;
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
