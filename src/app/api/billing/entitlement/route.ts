import { fetchBillingCustomerStatusForUser } from "@/lib/billing-customer-read";
import { isSubscriptionEntitled } from "@/lib/billing-entitlement";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type BillingEntitlementResponse = BillingEntitlementPayload;

/**
 * Whether the current session may use subscription-gated features (e.g. video).
 * Reads `billing_customers` with the user session (RLS): own row via `auth_user_id` or email.
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
    });
  }

  return NextResponse.json({
    authenticated: true,
    entitled: isSubscriptionEntitled(status),
    subscriptionStatus: status,
  });
}
