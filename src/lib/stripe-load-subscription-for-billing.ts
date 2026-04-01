import type { BillingCustomerStripeRow } from "@/lib/billing-customer-read";
import { getStripe } from "@/lib/stripe-server";
import type Stripe from "stripe";

/**
 * Loads the Stripe subscription for a `billing_customers` row (same strategy as entitlement).
 */
export async function loadStripeSubscriptionForBillingRow(
  row: BillingCustomerStripeRow
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  if (row.stripe_subscription_id) {
    try {
      return await stripe.subscriptions.retrieve(row.stripe_subscription_id, {
        expand: ["items.data.price"],
      });
    } catch (e) {
      console.error("stripe-load-subscription: retrieve by id", e);
    }
  }
  if (row.stripe_customer_id) {
    try {
      const list = await stripe.subscriptions.list({
        customer: row.stripe_customer_id,
        status: "all",
        limit: 10,
        expand: ["data.items.data.price"],
      });
      const sub = list.data.find((s) =>
        ["active", "trialing", "past_due"].includes(s.status)
      );
      return sub ?? null;
    } catch (e) {
      console.error("stripe-load-subscription: list by customer", e);
    }
  }
  return null;
}
