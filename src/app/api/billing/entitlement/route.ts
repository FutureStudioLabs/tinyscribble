import { PAID_MONTHLY_SCENE_LIMIT, PAID_MONTHLY_VIDEO_LIMIT } from "@/constants/plan";
import { TRIAL_FREE_IMAGE_LIMIT, TRIAL_FREE_VIDEO_LIMIT } from "@/constants/trial";
import type { BillingCustomerStripeRow } from "@/lib/billing-customer-read";
import {
  fetchBillingCustomerStatusForUser,
  fetchBillingCustomerStripeRowForUser,
} from "@/lib/billing-customer-read";
import { isSubscriptionEntitled } from "@/lib/billing-entitlement";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { getStripe } from "@/lib/stripe-server";
import { paidGalleryUsageSinceMs } from "@/lib/paid-usage-since";
import {
  countGalleryGeneratedForUser,
  countGalleryGeneratedForUserSince,
  countGalleryVideosForUser,
  countGalleryVideosForUserSince,
} from "@/lib/trial-gallery-counts";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";
import { NextResponse } from "next/server";

/** Stripe subscription fields we read (SDK typings omit some billing fields in strict builds). */
type StripeSubscriptionFields = {
  trial_end?: number | null;
  start_date?: number;
  current_period_start?: number;
  current_period_end?: number;
  items?: { data: Array<{ price?: { recurring?: { interval?: string } } }> };
};

function planIntervalFromSubscription(
  sub: StripeSubscriptionFields
): BillingEntitlementPayload["planInterval"] {
  const raw = sub.items?.data?.[0]?.price?.recurring?.interval;
  return raw === "month" || raw === "year" ? raw : null;
}

/**
 * Prefer subscription id; if missing (sync lag) fall back to listing by Stripe customer id.
 */
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
      console.error("entitlement: subscription retrieve", e);
    }
  }
  if (row.stripe_customer_id) {
    try {
      const list = await stripe.subscriptions.list({
        customer: row.stripe_customer_id,
        status: "all",
        limit: 10,
      });
      const sub = list.data.find((s) =>
        ["active", "trialing", "past_due"].includes(s.status)
      );
      return sub ? (sub as unknown as StripeSubscriptionFields) : null;
    } catch (e) {
      console.error("entitlement: subscription list by customer", e);
    }
  }
  return null;
}

export type BillingEntitlementResponse = BillingEntitlementPayload;

const emptyPayload = {
  trialVideoQuota: null,
  trialImageQuota: null,
  trialEndsAt: null,
  billingPeriodEndsAt: null,
  paidVideoQuota: null,
  paidImageQuota: null,
  planInterval: null,
} satisfies Partial<BillingEntitlementPayload>;

/**
 * Whether the current session may use subscription-gated features (e.g. video).
 * Reads `billing_customers` with the user session (RLS).
 */
export async function GET(): Promise<NextResponse<BillingEntitlementResponse>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({
      authenticated: false,
      entitled: false,
      subscriptionStatus: null,
      ...emptyPayload,
    });
  }

  const { status, errorMessage } = await fetchBillingCustomerStatusForUser(
    supabase,
    user
  );

  if (errorMessage) {
    console.error("billing entitlement select", errorMessage);
    return NextResponse.json({
      authenticated: true,
      entitled: false,
      subscriptionStatus: null,
      ...emptyPayload,
    });
  }

  const normalized = status?.trim().toLowerCase() ?? "";
  const isTrialing = normalized === "trialing";
  let trialVideoQuota: BillingEntitlementPayload["trialVideoQuota"] = null;
  let trialImageQuota: BillingEntitlementPayload["trialImageQuota"] = null;
  let trialEndsAt: BillingEntitlementPayload["trialEndsAt"] = null;
  let billingPeriodEndsAt: BillingEntitlementPayload["billingPeriodEndsAt"] = null;
  let paidVideoQuota: BillingEntitlementPayload["paidVideoQuota"] = null;
  let paidImageQuota: BillingEntitlementPayload["paidImageQuota"] = null;
  let planInterval: BillingEntitlementPayload["planInterval"] = null;

  if (isTrialing) {
    const videosUsed = await countGalleryVideosForUser(supabase, user.id);
    const remaining = Math.max(0, TRIAL_FREE_VIDEO_LIMIT - videosUsed);
    trialVideoQuota = { remaining, limit: TRIAL_FREE_VIDEO_LIMIT };

    const imagesUsed = await countGalleryGeneratedForUser(supabase, user.id);
    const imgRemaining = Math.max(0, TRIAL_FREE_IMAGE_LIMIT - imagesUsed);
    trialImageQuota = {
      used: imagesUsed,
      remaining: imgRemaining,
      limit: TRIAL_FREE_IMAGE_LIMIT,
    };

    const { row: stripeRow } = await fetchBillingCustomerStripeRowForUser(supabase, user);
    if (stripeRow && (stripeRow.stripe_subscription_id || stripeRow.stripe_customer_id)) {
      try {
        const stripe = getStripe();
        const sub = await loadStripeSubscriptionForBillingRow(stripe, stripeRow);
        if (sub) {
          planInterval = planIntervalFromSubscription(sub);
          if (typeof sub.trial_end === "number" && sub.trial_end > 0) {
            trialEndsAt = new Date(sub.trial_end * 1000).toISOString();
          }
          if (typeof sub.current_period_end === "number" && sub.current_period_end > 0) {
            billingPeriodEndsAt = new Date(sub.current_period_end * 1000).toISOString();
          }
        }
      } catch (e) {
        console.error("entitlement: trial stripe", e);
      }
    }
  }

  const isPaidPlan = normalized === "active" || normalized === "past_due";
  if (isPaidPlan) {
    const { row: stripeRow } = await fetchBillingCustomerStripeRowForUser(supabase, user);
    if (stripeRow && (stripeRow.stripe_subscription_id || stripeRow.stripe_customer_id)) {
      try {
        const stripe = getStripe();
        const sub = await loadStripeSubscriptionForBillingRow(stripe, stripeRow);
        if (sub) {
          planInterval = planIntervalFromSubscription(sub);
          if (typeof sub.current_period_end === "number" && sub.current_period_end > 0) {
            billingPeriodEndsAt = new Date(sub.current_period_end * 1000).toISOString();
          }
        }
        const sinceMs = paidGalleryUsageSinceMs(stripeRow, sub);
        if (sinceMs != null) {
          const videosUsed = await countGalleryVideosForUserSince(supabase, user.id, sinceMs);
          const scenesUsed = await countGalleryGeneratedForUserSince(supabase, user.id, sinceMs);
          const vRem = Math.max(0, PAID_MONTHLY_VIDEO_LIMIT - videosUsed);
          const sRem = Math.max(0, PAID_MONTHLY_SCENE_LIMIT - scenesUsed);
          paidVideoQuota = { remaining: vRem, limit: PAID_MONTHLY_VIDEO_LIMIT };
          paidImageQuota = {
            used: scenesUsed,
            remaining: sRem,
            limit: PAID_MONTHLY_SCENE_LIMIT,
          };
        } else {
          const videosUsed = await countGalleryVideosForUser(supabase, user.id);
          const scenesUsed = await countGalleryGeneratedForUser(supabase, user.id);
          const vRem = Math.max(0, PAID_MONTHLY_VIDEO_LIMIT - videosUsed);
          const sRem = Math.max(0, PAID_MONTHLY_SCENE_LIMIT - scenesUsed);
          paidVideoQuota = { remaining: vRem, limit: PAID_MONTHLY_VIDEO_LIMIT };
          paidImageQuota = {
            used: scenesUsed,
            remaining: sRem,
            limit: PAID_MONTHLY_SCENE_LIMIT,
          };
        }
      } catch (e) {
        console.error("entitlement: paid period", e);
      }
    }
    if (!paidVideoQuota && stripeRow) {
      const sinceMs = paidGalleryUsageSinceMs(stripeRow, null);
      if (sinceMs != null) {
        const videosUsed = await countGalleryVideosForUserSince(supabase, user.id, sinceMs);
        const scenesUsed = await countGalleryGeneratedForUserSince(supabase, user.id, sinceMs);
        const vRem = Math.max(0, PAID_MONTHLY_VIDEO_LIMIT - videosUsed);
        const sRem = Math.max(0, PAID_MONTHLY_SCENE_LIMIT - scenesUsed);
        paidVideoQuota = { remaining: vRem, limit: PAID_MONTHLY_VIDEO_LIMIT };
        paidImageQuota = {
          used: scenesUsed,
          remaining: sRem,
          limit: PAID_MONTHLY_SCENE_LIMIT,
        };
      } else {
        const videosUsed = await countGalleryVideosForUser(supabase, user.id);
        const scenesUsed = await countGalleryGeneratedForUser(supabase, user.id);
        const vRem = Math.max(0, PAID_MONTHLY_VIDEO_LIMIT - videosUsed);
        const sRem = Math.max(0, PAID_MONTHLY_SCENE_LIMIT - scenesUsed);
        paidVideoQuota = { remaining: vRem, limit: PAID_MONTHLY_VIDEO_LIMIT };
        paidImageQuota = {
          used: scenesUsed,
          remaining: sRem,
          limit: PAID_MONTHLY_SCENE_LIMIT,
        };
      }
    }
  }

  return NextResponse.json({
    authenticated: true,
    entitled: isSubscriptionEntitled(status),
    subscriptionStatus: status,
    trialVideoQuota,
    trialImageQuota,
    trialEndsAt,
    billingPeriodEndsAt,
    paidVideoQuota,
    paidImageQuota,
    planInterval,
  });
}
