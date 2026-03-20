import { isSubscriptionEntitled } from "@/lib/billing-entitlement";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type BillingEntitlementResponse = BillingEntitlementPayload;

/**
 * Whether the current session may use subscription-gated features (e.g. video).
 * Uses RLS: `billing_customers` row must match `auth.jwt() ->> 'email'`.
 */
export async function GET(): Promise<NextResponse<BillingEntitlementResponse>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({
      authenticated: false,
      entitled: false,
      subscriptionStatus: null,
    });
  }

  const { data, error } = await supabase
    .from("billing_customers")
    .select("status")
    .maybeSingle();

  if (error) {
    console.error("billing entitlement select", error);
    return NextResponse.json({
      authenticated: true,
      entitled: false,
      subscriptionStatus: null,
    });
  }

  const status = data?.status ?? null;
  return NextResponse.json({
    authenticated: true,
    entitled: isSubscriptionEntitled(status),
    subscriptionStatus: status,
  });
}
