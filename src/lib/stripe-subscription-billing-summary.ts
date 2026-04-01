import { findPlanSubscriptionItemId, subscriptionMainPriceId } from "@/lib/paid-plan-limits";
import {
  paidPlanDisplayTierFromPriceId,
  tinyScribblePlanLabel,
  type PaidPlanDisplayTier,
} from "@/lib/stripe-subscription-plan-display";
import { subscriptionCurrentPeriodEndUnix } from "@/lib/stripe-subscription-period";
import type Stripe from "stripe";

export type SubscriptionBillingSummary = {
  planTier: PaidPlanDisplayTier;
  planLabel: string;
  status: Stripe.Subscription.Status;
  isTrialing: boolean;
  /** When the current period (or trial) ends — next renewal or conversion to paid. */
  renewsAtIso: string | null;
  /** Recurring price for the plan line only (no proration). */
  renewalAmountFormatted: string | null;
  renewalIntervalLabel: string | null;
  cancelAtPeriodEnd: boolean;
  /** When access ends if cancellation is already scheduled. */
  accessThroughIso: string | null;
};

function formatMoney(unitAmount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(unitAmount / 100);
  } catch {
    return (unitAmount / 100).toFixed(2);
  }
}

function mainPlanItem(sub: Stripe.Subscription): Stripe.SubscriptionItem | null {
  const planItemId = findPlanSubscriptionItemId(sub);
  const item = planItemId
    ? sub.items.data.find((i) => i.id === planItemId)
    : undefined;
  return item ?? sub.items.data[0] ?? null;
}

export function buildSubscriptionBillingSummary(
  sub: Stripe.Subscription
): SubscriptionBillingSummary {
  const priceId = subscriptionMainPriceId(sub);
  const tier = paidPlanDisplayTierFromPriceId(priceId);
  const planLabel = tinyScribblePlanLabel(tier);

  const periodEndUnix = subscriptionCurrentPeriodEndUnix(sub);
  const trialEndUnix =
    typeof sub.trial_end === "number" && sub.trial_end > 0
      ? sub.trial_end
      : null;

  const renewsUnix =
    sub.status === "trialing" && trialEndUnix != null
      ? trialEndUnix
      : periodEndUnix;

  const renewsAtIso =
    renewsUnix != null
      ? new Date(renewsUnix * 1000).toISOString()
      : null;

  const item = mainPlanItem(sub);
  const p = item?.price;
  const priceObj = typeof p === "object" && p != null ? p : null;
  const unitAmount =
    priceObj && typeof priceObj.unit_amount === "number"
      ? priceObj.unit_amount
      : null;
  const currency =
    priceObj && typeof priceObj.currency === "string"
      ? priceObj.currency
      : "usd";
  const interval = priceObj?.recurring?.interval;
  const renewalIntervalLabel =
    interval === "year"
      ? "per year"
      : interval === "month"
        ? "per month"
        : null;

  const renewalAmountFormatted =
    unitAmount != null ? formatMoney(unitAmount, currency) : null;

  const cancelAtPeriodEnd = sub.cancel_at_period_end === true;
  const accessThroughIso =
    cancelAtPeriodEnd && periodEndUnix != null
      ? new Date(periodEndUnix * 1000).toISOString()
      : null;

  return {
    planTier: tier,
    planLabel,
    status: sub.status,
    isTrialing: sub.status === "trialing",
    renewsAtIso,
    renewalAmountFormatted,
    renewalIntervalLabel,
    cancelAtPeriodEnd,
    accessThroughIso,
  };
}
