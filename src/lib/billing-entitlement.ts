/**
 * Stripe subscription `status` values we treat as "can use paid features"
 * (video, etc.). Synced from webhooks into `billing_customers.status`.
 * @see https://stripe.com/docs/api/subscriptions/object#subscription_object-status
 */
const ENTITLED_STATUSES = new Set([
  "active",
  "trialing",
  "past_due", // still a customer; Stripe is retrying payment
]);

export function isSubscriptionEntitled(status: string | null | undefined): boolean {
  if (!status || typeof status !== "string") return false;
  return ENTITLED_STATUSES.has(status.trim().toLowerCase());
}
