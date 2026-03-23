import { fetchBillingCustomerStripeRowForUser } from "@/lib/billing-customer-read";
import { priceIdForPaidUpgradeTier } from "@/lib/stripe-upgrade-products";
import { getStripe } from "@/lib/stripe-server";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { PaidUpgradeTierId } from "@/constants/upgrade-plans-display";

const TIERS: PaidUpgradeTierId[] = ["family", "power"];

function isTier(value: unknown): value is PaidUpgradeTierId {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value);
}

/**
 * Paid subscriber upgrades Starter → Family or Power (same subscription, new price).
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tier = (body as { tier?: unknown }).tier;
  if (!isTier(tier)) {
    return NextResponse.json({ error: "Choose Family or Power." }, { status: 400 });
  }

  const priceId = priceIdForPaidUpgradeTier(tier);
  if (!priceId) {
    return NextResponse.json(
      { error: "Upgrade price is not configured. Set STRIPE_PRICE_FAMILY_ANNUAL / STRIPE_PRICE_POWER_ANNUAL." },
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
    return NextResponse.json({ error: "No billing profile found." }, { status: 404 });
  }

  const status = row.status.toLowerCase();
  if (status !== "active" && status !== "past_due") {
    return NextResponse.json(
      { error: "Upgrades are available for active paid subscriptions." },
      { status: 400 }
    );
  }

  if (!row.stripe_subscription_id) {
    return NextResponse.json(
      { error: "Subscription is still syncing. Try again in a moment." },
      { status: 409 }
    );
  }

  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    const item = sub.items.data[0];
    if (!item?.id) {
      return NextResponse.json({ error: "Invalid subscription state." }, { status: 500 });
    }

    const currentPriceId = item.price?.id;
    if (currentPriceId === priceId) {
      return NextResponse.json({ ok: true as const, alreadyOnPlan: true as const });
    }

    await stripe.subscriptions.update(row.stripe_subscription_id, {
      items: [{ id: item.id, price: priceId }],
      proration_behavior: "create_prorations",
    });

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("upgrade-subscription", e);
    const message = e instanceof Error ? e.message : "Stripe request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
