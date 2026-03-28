import {
  paidMonthlyLimitsForStripePriceId,
  subscriptionMainPriceId,
} from "@/lib/paid-plan-limits";
import type { BillingCustomerStripeRow } from "@/lib/billing-customer-read";
import { fetchBillingCustomerStripeRowForUser } from "@/lib/billing-customer-read";
import { getStripe } from "@/lib/stripe-server";
import { paidGalleryUsageSinceMs } from "@/lib/paid-usage-since";
import {
  countGalleryGeneratedForUser,
  countGalleryGeneratedForUserSince,
  countGalleryVideosForUser,
  countGalleryVideosForUserSince,
} from "@/lib/trial-gallery-counts";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type Stripe from "stripe";

type StripeSubscriptionFields = {
  current_period_start?: number;
  start_date?: number;
  trial_end?: number | null;
};

/**
 * Stripe `active` / `past_due` — monthly scene credits apply (not `trialing`).
 */
export function isPaidPlanStatus(status: string | null | undefined): boolean {
  const s = status?.trim().toLowerCase() ?? "";
  return s === "active" || s === "past_due";
}

async function loadStripeSubscriptionForBillingRow(
  stripe: Stripe,
  row: BillingCustomerStripeRow
): Promise<StripeSubscriptionFields | null> {
  if (row.stripe_subscription_id) {
    try {
      return (await stripe.subscriptions.retrieve(row.stripe_subscription_id, {
        expand: ["items.data.price"],
      })) as StripeSubscriptionFields;
    } catch (e) {
      console.error("paid-scene-quota: subscription retrieve", e);
    }
  }
  if (row.stripe_customer_id) {
    try {
      const list = await stripe.subscriptions.list({
        customer: row.stripe_customer_id,
        status: "all",
        limit: 10,
        expand: ["data.items.data.price"],
      });
      const sub = list.data.find((s) =>
        ["active", "trialing", "past_due"].includes(s.status)
      );
      return sub ? (sub as unknown as StripeSubscriptionFields) : null;
    } catch (e) {
      console.error("paid-scene-quota: subscription list by customer", e);
    }
  }
  return null;
}

/**
 * Remaining scene credits in the current billing period for paid plans.
 * Returns `null` when the user is not on `active` / `past_due`.
 */
export async function getPaidSceneRemainingForUser(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "email">,
  billingStatus: string | null
): Promise<number | null> {
  if (!isPaidPlanStatus(billingStatus)) return null;

  const { row: stripeRow } = await fetchBillingCustomerStripeRowForUser(supabase, user);
  const limitsFromSub = async (): Promise<{ sceneLimit: number }> => {
    if (!stripeRow?.stripe_subscription_id && !stripeRow?.stripe_customer_id) {
      return paidMonthlyLimitsForStripePriceId(undefined);
    }
    try {
      const stripe = getStripe();
      const sub = await loadStripeSubscriptionForBillingRow(stripe, stripeRow);
      if (sub) {
        const priceId = subscriptionMainPriceId(sub as unknown as Stripe.Subscription);
        return paidMonthlyLimitsForStripePriceId(priceId);
      }
    } catch (e) {
      console.error("paid-scene-quota: stripe period", e);
    }
    return paidMonthlyLimitsForStripePriceId(undefined);
  };

  if (!stripeRow?.stripe_subscription_id && !stripeRow?.stripe_customer_id) {
    const { sceneLimit } = await limitsFromSub();
    if (stripeRow) {
      const sinceMs = paidGalleryUsageSinceMs(stripeRow, null);
      if (sinceMs != null) {
        const scenesUsed = await countGalleryGeneratedForUserSince(
          supabase,
          user.id,
          sinceMs
        );
        return Math.max(0, sceneLimit - scenesUsed);
      }
    }
    const scenesUsed = await countGalleryGeneratedForUser(supabase, user.id);
    return Math.max(0, sceneLimit - scenesUsed);
  }

  try {
    const stripe = getStripe();
    const sub = await loadStripeSubscriptionForBillingRow(stripe, stripeRow);
    const { sceneLimit } = paidMonthlyLimitsForStripePriceId(
      sub ? subscriptionMainPriceId(sub as unknown as Stripe.Subscription) : undefined
    );
    const sinceMs = paidGalleryUsageSinceMs(stripeRow, sub);
    if (sinceMs != null) {
      const scenesUsed = await countGalleryGeneratedForUserSince(supabase, user.id, sinceMs);
      return Math.max(0, sceneLimit - scenesUsed);
    }
  } catch (e) {
    console.error("paid-scene-quota: stripe period", e);
  }

  const { sceneLimit } = await limitsFromSub();
  const scenesUsed = await countGalleryGeneratedForUser(supabase, user.id);
  return Math.max(0, sceneLimit - scenesUsed);
}

/**
 * Remaining video credits in the current billing period for paid plans.
 * Returns `null` when the user is not on `active` / `past_due`.
 */
export async function getPaidVideoRemainingForUser(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "email">,
  billingStatus: string | null
): Promise<number | null> {
  if (!isPaidPlanStatus(billingStatus)) return null;

  const { row: stripeRow } = await fetchBillingCustomerStripeRowForUser(supabase, user);
  const limitsFromSub = async (): Promise<{ videoLimit: number }> => {
    if (!stripeRow?.stripe_subscription_id && !stripeRow?.stripe_customer_id) {
      return paidMonthlyLimitsForStripePriceId(undefined);
    }
    try {
      const stripe = getStripe();
      const sub = await loadStripeSubscriptionForBillingRow(stripe, stripeRow);
      if (sub) {
        const priceId = subscriptionMainPriceId(sub as unknown as Stripe.Subscription);
        return paidMonthlyLimitsForStripePriceId(priceId);
      }
    } catch (e) {
      console.error("paid-video-quota: stripe period", e);
    }
    return paidMonthlyLimitsForStripePriceId(undefined);
  };

  if (!stripeRow?.stripe_subscription_id && !stripeRow?.stripe_customer_id) {
    const { videoLimit } = await limitsFromSub();
    if (stripeRow) {
      const sinceMs = paidGalleryUsageSinceMs(stripeRow, null);
      if (sinceMs != null) {
        const videosUsed = await countGalleryVideosForUserSince(supabase, user.id, sinceMs);
        return Math.max(0, videoLimit - videosUsed);
      }
    }
    const videosUsed = await countGalleryVideosForUser(supabase, user.id);
    return Math.max(0, videoLimit - videosUsed);
  }

  try {
    const stripe = getStripe();
    const sub = await loadStripeSubscriptionForBillingRow(stripe, stripeRow);
    const { videoLimit } = paidMonthlyLimitsForStripePriceId(
      sub ? subscriptionMainPriceId(sub as unknown as Stripe.Subscription) : undefined
    );
    const sinceMs = paidGalleryUsageSinceMs(stripeRow, sub);
    if (sinceMs != null) {
      const videosUsed = await countGalleryVideosForUserSince(supabase, user.id, sinceMs);
      return Math.max(0, videoLimit - videosUsed);
    }
  } catch (e) {
    console.error("paid-video-quota: stripe period", e);
  }

  const { videoLimit } = await limitsFromSub();
  const videosUsed = await countGalleryVideosForUser(supabase, user.id);
  return Math.max(0, videoLimit - videosUsed);
}
