import { fetchBillingCustomerStripeRowForUser } from "@/lib/billing-customer-read";
import { buildSubscriptionBillingSummary } from "@/lib/stripe-subscription-billing-summary";
import { loadStripeSubscriptionForBillingRow } from "@/lib/stripe-load-subscription-for-billing";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SUBSCRIBED = new Set(["trialing", "active", "past_due"]);

/**
 * Plan name, renewal date, and recurring price (plan line only — no proration) for the billing page.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { row, errorMessage } = await fetchBillingCustomerStripeRowForUser(
    supabase,
    user
  );
  if (errorMessage) {
    console.error("subscription-summary billing row", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  const status = row?.status?.trim().toLowerCase() ?? "";
  if (!row || !SUBSCRIBED.has(status)) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  const sub = await loadStripeSubscriptionForBillingRow(row);
  if (!sub) {
    return NextResponse.json(
      { error: "Subscription details are still syncing. Try again shortly." },
      { status: 503 }
    );
  }

  const summary = buildSubscriptionBillingSummary(sub);
  return NextResponse.json({ ok: true as const, ...summary });
}
