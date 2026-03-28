import type { BillingCustomerStripeRow } from "@/lib/billing-customer-read";
import { subscriptionUsagePeriodStartSec } from "@/lib/stripe-billing-period-start";

type StripeSubLike = {
  current_period_start?: number | null;
  items?: { data: Array<{ current_period_start?: number | null }> };
  start_date?: number | null;
  trial_end?: number | null;
  trial_start?: number | null;
};

/**
 * Epoch ms for counting paid-plan gallery usage (videos + scenes in billing period).
 * Prefers `billing_customers.paid_quota_reset_at` (trial → paid handoff); otherwise Stripe period start.
 */
export function paidGalleryUsageSinceMs(
  row: Pick<BillingCustomerStripeRow, "paid_quota_reset_at">,
  stripeSub: StripeSubLike | null
): number | null {
  const raw = row.paid_quota_reset_at?.trim();
  if (raw) {
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) return t;
  }
  const sec = stripeSub ? subscriptionUsagePeriodStartSec(stripeSub) : null;
  if (sec == null) return null;
  return sec * 1000;
}
