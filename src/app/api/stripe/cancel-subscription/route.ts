import { fetchBillingCustomerStripeRowForUser } from "@/lib/billing-customer-read";
import { loadStripeSubscriptionForBillingRow } from "@/lib/stripe-load-subscription-for-billing";
import { subscriptionCurrentPeriodEndUnix } from "@/lib/stripe-subscription-period";
import { getStripe } from "@/lib/stripe-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const CANCELABLE = new Set(["trialing", "active", "past_due"]);

function customerIdFromSubscription(
  customer: string | { id?: string } | null
): string | null {
  if (typeof customer === "string") return customer;
  if (customer && typeof customer === "object" && "id" in customer) {
    const id = (customer as { id?: string }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

/**
 * Cancel subscription: trialing ends immediately with no charge; paid schedules cancel at period end.
 */
export async function POST() {
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
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  const billingStatus = row?.status?.trim().toLowerCase() ?? "";
  if (!row || !CANCELABLE.has(billingStatus)) {
    return NextResponse.json(
      { error: "No subscription you can cancel from this account." },
      { status: 400 }
    );
  }

  if (!row.stripe_subscription_id) {
    return NextResponse.json(
      { error: "Subscription is still syncing. Try again in a moment." },
      { status: 409 }
    );
  }

  const stripe = getStripe();
  let sub = await loadStripeSubscriptionForBillingRow(row);
  if (!sub || sub.id !== row.stripe_subscription_id) {
    try {
      sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id, {
        expand: ["items.data.price"],
      });
    } catch {
      return NextResponse.json(
        { error: "Could not load your subscription from Stripe." },
        { status: 502 }
      );
    }
  }

  const subCustomerId = customerIdFromSubscription(sub.customer);
  if (
    row.stripe_customer_id &&
    subCustomerId &&
    subCustomerId !== row.stripe_customer_id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sub.status === "canceled") {
    return NextResponse.json(
      { error: "This subscription is already canceled." },
      { status: 400 }
    );
  }

  if (sub.cancel_at_period_end) {
    const periodEnd = subscriptionCurrentPeriodEndUnix(sub);
    return NextResponse.json({
      ok: true as const,
      alreadyScheduled: true as const,
      cancelAtPeriodEnd: true as const,
      accessThrough:
        periodEnd != null
          ? new Date(periodEnd * 1000).toISOString()
          : null,
    });
  }

  try {
    if (sub.status === "trialing") {
      await stripe.subscriptions.cancel(row.stripe_subscription_id);
      return NextResponse.json({
        ok: true as const,
        cancelAtPeriodEnd: false as const,
        endedImmediately: true as const,
        accessThrough: null,
      });
    }

    await stripe.subscriptions.update(row.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const periodEnd = subscriptionCurrentPeriodEndUnix(sub);
    return NextResponse.json({
      ok: true as const,
      cancelAtPeriodEnd: true as const,
      endedImmediately: false as const,
      accessThrough:
        periodEnd != null
          ? new Date(periodEnd * 1000).toISOString()
          : null,
    });
  } catch (e) {
    console.error("cancel-subscription", e);
    const message = e instanceof Error ? e.message : "Stripe request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
