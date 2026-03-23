import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";

export function isTrialingStatus(status: string | null | undefined): boolean {
  return status?.trim().toLowerCase() === "trialing";
}

export function isPaidSubscriptionStatus(status: string | null | undefined): boolean {
  const s = status?.trim().toLowerCase() ?? "";
  return s === "active" || s === "past_due";
}

/** Trial uses `trial*Quota`; paid uses `paid*Quota` (billing period). */
export function getVideoQuota(
  ent: BillingEntitlementPayload | null | undefined
): BillingEntitlementPayload["trialVideoQuota"] {
  if (!ent) return null;
  if (isTrialingStatus(ent.subscriptionStatus)) return ent.trialVideoQuota;
  if (isPaidSubscriptionStatus(ent.subscriptionStatus)) return ent.paidVideoQuota;
  return null;
}

export function getImageQuota(
  ent: BillingEntitlementPayload | null | undefined
): BillingEntitlementPayload["trialImageQuota"] {
  if (!ent) return null;
  if (isTrialingStatus(ent.subscriptionStatus)) return ent.trialImageQuota;
  if (isPaidSubscriptionStatus(ent.subscriptionStatus)) return ent.paidImageQuota;
  return null;
}

/** When trial or paid credits renew (ISO). */
export function getCreditsResetAt(ent: BillingEntitlementPayload | null | undefined): string | null {
  if (!ent) return null;
  if (isTrialingStatus(ent.subscriptionStatus)) return ent.trialEndsAt;
  if (isPaidSubscriptionStatus(ent.subscriptionStatus)) return ent.billingPeriodEndsAt;
  return null;
}
