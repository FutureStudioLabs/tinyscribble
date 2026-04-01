import {
  paidMonthlyLimitsForStripePriceId,
  subscriptionMainPriceId,
} from "@/lib/paid-plan-limits";
import type { BillingCustomerStripeRow } from "@/lib/billing-customer-read";
import { paidGalleryUsageSinceMs } from "@/lib/paid-usage-since";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  countGalleryGeneratedForUserSince,
  countGalleryVideosForUserSince,
} from "@/lib/trial-gallery-counts";
import { subscriptionCurrentPeriodEndUnix } from "@/lib/stripe-subscription-period";
import type Stripe from "stripe";

type BillingRowForBonus = {
  auth_user_id: string | null;
  paid_quota_reset_at: string | null;
  upgrade_scene_bonus: number | null;
  upgrade_video_bonus: number | null;
  last_stripe_plan_price_id: string | null;
  billing_period_end_at: string | null;
};

/**
 * When a subscriber moves to a higher paid tier mid-period, add unused allowance from the
 * previous tier as bonuses until the Stripe billing period rolls. Idempotent per price id pair
 * (retries / duplicate webhooks do not double-count).
 */
export async function syncPaidTierUpgradeBonusesFromStripeSubscription(
  email: string,
  sub: Stripe.Subscription
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  const periodEndUnix = subscriptionCurrentPeriodEndUnix(sub);
  if (periodEndUnix == null) return;

  const periodEndIso = new Date(periodEndUnix * 1000).toISOString();
  const newPriceId = subscriptionMainPriceId(sub)?.trim() || null;

  try {
    const admin = createAdminClient();
    const { data: row, error: selErr } = await admin
      .from("billing_customers")
      .select(
        "auth_user_id, paid_quota_reset_at, upgrade_scene_bonus, upgrade_video_bonus, last_stripe_plan_price_id, billing_period_end_at"
      )
      .eq("email", normalized)
      .maybeSingle();

    if (selErr) {
      console.error("plan upgrade bonus: billing_customers select", selErr);
      return;
    }

    const r = row as BillingRowForBonus | null;
    if (!r) return;

    let sceneBonus = Number(r.upgrade_scene_bonus) || 0;
    let videoBonus = Number(r.upgrade_video_bonus) || 0;

    const storedEnd = r.billing_period_end_at?.trim() || null;
    if (storedEnd && storedEnd !== periodEndIso) {
      sceneBonus = 0;
      videoBonus = 0;
    }

    const authUserId = r.auth_user_id?.trim() || null;
    const oldPriceId = r.last_stripe_plan_price_id?.trim() || null;

    if (
      authUserId &&
      oldPriceId &&
      newPriceId &&
      oldPriceId !== newPriceId
    ) {
      const oldL = paidMonthlyLimitsForStripePriceId(oldPriceId);
      const newL = paidMonthlyLimitsForStripePriceId(newPriceId);
      const upgraded =
        newL.sceneLimit > oldL.sceneLimit || newL.videoLimit > oldL.videoLimit;
      if (upgraded) {
        const usageRow: Pick<BillingCustomerStripeRow, "paid_quota_reset_at"> = {
          paid_quota_reset_at: r.paid_quota_reset_at,
        };
        const sinceMs = paidGalleryUsageSinceMs(usageRow, sub);
        if (sinceMs != null) {
          const [scenesUsed, videosUsed] = await Promise.all([
            countGalleryGeneratedForUserSince(admin, authUserId, sinceMs),
            countGalleryVideosForUserSince(admin, authUserId, sinceMs),
          ]);
          sceneBonus += Math.max(0, oldL.sceneLimit - scenesUsed);
          videoBonus += Math.max(0, oldL.videoLimit - videosUsed);
        }
      }
    }

    const { error: updErr } = await admin
      .from("billing_customers")
      .update({
        upgrade_scene_bonus: sceneBonus,
        upgrade_video_bonus: videoBonus,
        last_stripe_plan_price_id: newPriceId,
        billing_period_end_at: periodEndIso,
        updated_at: new Date().toISOString(),
      })
      .eq("email", normalized);

    if (updErr) {
      console.error("plan upgrade bonus: billing_customers update", updErr);
    }
  } catch (e) {
    console.error("syncPaidTierUpgradeBonusesFromStripeSubscription", e);
  }
}
