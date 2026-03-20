import { TRIAL_FREE_IMAGE_LIMIT, TRIAL_FREE_VIDEO_LIMIT } from "@/constants/trial";
import { fetchBillingCustomerStatusForUser } from "@/lib/billing-customer-read";
import { isSubscriptionEntitled } from "@/lib/billing-entitlement";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import {
  countGalleryGeneratedForUser,
  countGalleryVideosForUser,
} from "@/lib/trial-gallery-counts";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type BillingEntitlementResponse = BillingEntitlementPayload;

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
      trialVideoQuota: null,
      trialImageQuota: null,
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
      trialVideoQuota: null,
      trialImageQuota: null,
    });
  }

  const normalized = status?.trim().toLowerCase() ?? "";
  const isTrialing = normalized === "trialing";
  let trialVideoQuota: BillingEntitlementPayload["trialVideoQuota"] = null;
  let trialImageQuota: BillingEntitlementPayload["trialImageQuota"] = null;

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
  }

  return NextResponse.json({
    authenticated: true,
    entitled: isSubscriptionEntitled(status),
    subscriptionStatus: status,
    trialVideoQuota,
    trialImageQuota,
  });
}
