import { PAID_MONTHLY_SCENE_LIMIT, PAID_MONTHLY_VIDEO_LIMIT } from "@/constants/plan";
import { UPGRADE_PLANS_DISPLAY } from "@/constants/upgrade-plans-display";
import {
  priceIdForProduct,
  STRIPE_CHECKOUT_PRODUCTS,
} from "@/lib/stripe-checkout";
import type Stripe from "stripe";

/** Starter + Family + Power price IDs (for finding the plan line on a subscription). */
export function knownStripePlanPriceIds(): Set<string> {
  const s = new Set<string>();
  for (const p of STRIPE_CHECKOUT_PRODUCTS) {
    const id = priceIdForProduct(p);
    if (id) s.add(id);
  }
  const fam = process.env.STRIPE_PRICE_FAMILY_ANNUAL?.trim();
  const pow = process.env.STRIPE_PRICE_POWER_ANNUAL?.trim();
  if (fam) s.add(fam);
  if (pow) s.add(pow);
  return s;
}

/**
 * Paid monthly video/scene caps from the subscription's Stripe Price (Starter vs Family vs Power).
 */
export function paidMonthlyLimitsForStripePriceId(
  priceId: string | null | undefined
): { videoLimit: number; sceneLimit: number } {
  const fam = process.env.STRIPE_PRICE_FAMILY_ANNUAL?.trim();
  const pow = process.env.STRIPE_PRICE_POWER_ANNUAL?.trim();
  if (priceId && fam && priceId === fam) {
    return {
      videoLimit: UPGRADE_PLANS_DISPLAY.family.videosPerMonth,
      sceneLimit: UPGRADE_PLANS_DISPLAY.family.scenesPerMonth,
    };
  }
  if (priceId && pow && priceId === pow) {
    return {
      videoLimit: UPGRADE_PLANS_DISPLAY.power.videosPerMonth,
      sceneLimit: UPGRADE_PLANS_DISPLAY.power.scenesPerMonth,
    };
  }
  return {
    videoLimit: PAID_MONTHLY_VIDEO_LIMIT,
    sceneLimit: PAID_MONTHLY_SCENE_LIMIT,
  };
}

/** First subscription line item price id (expanded retrieve). */
export function subscriptionMainPriceId(
  sub: Stripe.Subscription | null | undefined
): string | undefined {
  if (!sub?.items?.data?.length) return undefined;
  for (const item of sub.items.data) {
    const p = item.price;
    if (!p) continue;
    const id = typeof p === "string" ? p : p.id;
    if (id) return id;
  }
  return undefined;
}

/** Line item to replace when upgrading (known plan price), else first item. */
export function findPlanSubscriptionItemId(sub: Stripe.Subscription): string | undefined {
  const known = knownStripePlanPriceIds();
  for (const item of sub.items.data) {
    const pid = typeof item.price === "string" ? item.price : item.price?.id;
    if (pid && known.has(pid)) return item.id;
  }
  return sub.items.data[0]?.id;
}
