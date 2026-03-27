import { fetchBillingCustomerStripeRowForUser } from "@/lib/billing-customer-read";
import { priceIdForProduct } from "@/lib/stripe-checkout";
import { getStripe } from "@/lib/stripe-server";
import { setPaidQuotaResetAtIfNullForEmail } from "@/lib/sync-billing-customer";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Trialing user picks Starter monthly vs annual, ends trial, and moves to paid on that price.
 * Requires `billing_customers.stripe_subscription_id` (webhook / checkout success).
 */
export async function POST(request: NextRequest) {
  let body: { billing?: unknown };
  try {
    body = (await request.json()) as { billing?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const billingRaw =
    typeof body.billing === "string" ? body.billing.trim().toLowerCase() : "";
  if (billingRaw !== "monthly" && billingRaw !== "annual") {
    return NextResponse.json(
      { error: "Choose monthly or annual billing." },
      { status: 400 }
    );
  }

  const product = billingRaw === "monthly" ? "starter_monthly" : "starter_annual";
  const priceId = priceIdForProduct(product);
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price is not configured." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { row, errorMessage } = await fetchBillingCustomerStripeRowForUser(supabase, user);
  if (errorMessage) {
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json(
      { error: "No subscription found for your account." },
      { status: 404 }
    );
  }

  if (row.status.toLowerCase() !== "trialing") {
    return NextResponse.json(
      { error: "This action only applies while you’re on a free trial." },
      { status: 400 }
    );
  }

  if (!row.stripe_subscription_id) {
    return NextResponse.json(
      {
        error:
          "Your plan is still syncing. Try Billing in the dashboard or again in a moment.",
      },
      { status: 409 }
    );
  }

  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    const custId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (row.stripe_customer_id && custId && row.stripe_customer_id !== custId) {
      console.error("convert-trial-plan: customer mismatch");
      return NextResponse.json({ error: "Could not verify subscription." }, { status: 403 });
    }

    const item = sub.items.data[0];
    if (!item?.id) {
      return NextResponse.json({ error: "Invalid subscription state." }, { status: 500 });
    }

    const currentPriceId = item.price?.id;
    if (currentPriceId === priceId) {
      await stripe.subscriptions.update(row.stripe_subscription_id, {
        trial_end: "now",
        proration_behavior: "none",
      });
    } else {
      await stripe.subscriptions.update(row.stripe_subscription_id, {
        items: [{ id: item.id, price: priceId }],
        trial_end: "now",
        proration_behavior: "none",
      });
    }

    await setPaidQuotaResetAtIfNullForEmail(user.email);

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("convert-trial-plan", e);
    const message = e instanceof Error ? e.message : "Stripe request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
