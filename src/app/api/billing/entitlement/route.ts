import { TRIAL_FREE_VIDEO_LIMIT } from "@/constants/trial";
import { fetchBillingCustomerStatusForUser } from "@/lib/billing-customer-read";
import { isSubscriptionEntitled } from "@/lib/billing-entitlement";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type BillingEntitlementResponse = BillingEntitlementPayload;

async function countGalleryVideos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("gallery_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .like("r2_key", "videos/%");

  if (error) {
    console.error("billing entitlement: video count", error);
    return 0;
  }
  return count ?? 0;
}

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
    });
  }

  const normalized = status?.trim().toLowerCase() ?? "";
  const isTrialing = normalized === "trialing";
  let trialVideoQuota: BillingEntitlementPayload["trialVideoQuota"] = null;

  if (isTrialing) {
    const used = await countGalleryVideos(supabase, user.id);
    const remaining = Math.max(0, TRIAL_FREE_VIDEO_LIMIT - used);
    trialVideoQuota = { remaining, limit: TRIAL_FREE_VIDEO_LIMIT };
  }

  return NextResponse.json({
    authenticated: true,
    entitled: isSubscriptionEntitled(status),
    subscriptionStatus: status,
    trialVideoQuota,
  });
}
