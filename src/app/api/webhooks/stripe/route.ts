import { subscriptionMainPriceId } from "@/lib/paid-plan-limits";
import { syncPaidTierUpgradeBonusesFromStripeSubscription } from "@/lib/plan-upgrade-bonus";
import { sendPlanActiveEmail } from "@/lib/resend";
import {
  paidPlanDisplayTierFromPriceId,
  tinyScribblePlanLabel,
} from "@/lib/stripe-subscription-plan-display";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseAuthUserIdFromStripeMetadata,
  setPaidQuotaResetAtIfNullForEmail,
  syncBillingFromCheckoutSession,
  upsertBillingCustomer,
} from "@/lib/sync-billing-customer";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook — use URL in Dashboard:
 * https://tinyscribble.vercel.app/api/webhooks/stripe
 *
 * Set STRIPE_WEBHOOK_SECRET in Vercel env (Signing secret from the destination).
 *
 * **Configure these events** in Stripe Dashboard → Webhooks:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 *
 * Rows in `billing_customers` also sync from `/checkout/success` and `complete-checkout`
 * when `SUPABASE_SERVICE_ROLE_KEY` is set (backup if webhooks miss).
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;

  if (!secret || !key) {
    console.error("stripe webhook: missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const stripe = new Stripe(key);
  const rawBody = await request.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("stripe webhook: signature verification failed", msg);
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await syncBillingFromCheckoutSession(session, stripe);
      console.info("checkout.session.completed", session.id);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const cust = sub.customer;
      if (typeof cust !== "string" && cust && "deleted" in cust && cust.deleted) {
        break;
      }
      const customerId = typeof cust === "string" ? cust : cust?.id ?? null;
      if (!customerId) break;

      let email = "";
      let authUserId: string | null = parseAuthUserIdFromStripeMetadata(
        sub.metadata?.supabase_user_id
      );

      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;
        email = (customer.email || "").trim().toLowerCase();
        if (!authUserId) {
          authUserId = parseAuthUserIdFromStripeMetadata(
            customer.metadata?.supabase_user_id
          );
        }
      } catch (err) {
        console.error("stripe webhook: customer retrieve failed", err);
        break;
      }

      if (!email) {
        console.warn(
          "stripe webhook: subscription event skipped — customer has no email",
          sub.id
        );
        break;
      }

      await upsertBillingCustomer({
        email,
        customerId,
        subscriptionId: sub.id,
        status: sub.status,
        authUserId,
      });

      await syncPaidTierUpgradeBonusesFromStripeSubscription(email, sub);

      const prev = event.data.previous_attributes as { status?: string } | undefined;
      if (
        prev?.status === "trialing" &&
        (sub.status === "active" || sub.status === "past_due")
      ) {
        await setPaidQuotaResetAtIfNullForEmail(email);

        // Send "plan active" email
        try {
          const fullSub = await stripe.subscriptions.retrieve(sub.id, {
            expand: ["items.data.price"],
          });
          const priceId = subscriptionMainPriceId(fullSub);
          const tier = paidPlanDisplayTierFromPriceId(priceId);
          const planLabel = tinyScribblePlanLabel(tier);

          const mainItem = fullSub.items.data[0];
          const priceObj =
            mainItem?.price && typeof mainItem.price === "object"
              ? mainItem.price
              : null;
          const unitAmount =
            priceObj && typeof priceObj.unit_amount === "number"
              ? priceObj.unit_amount
              : null;
          const currency =
            priceObj && typeof priceObj.currency === "string"
              ? priceObj.currency
              : "usd";
          const interval = priceObj?.recurring?.interval;
          const intervalLabel =
            interval === "year" ? "per year" : interval === "month" ? "per month" : "";
          const amountFormatted =
            unitAmount != null
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: currency.toUpperCase(),
                }).format(unitAmount / 100)
              : "";

          let firstName = email.split("@")[0];
          if (authUserId) {
            try {
              const admin = createAdminClient();
              const { data: authData } = await admin.auth.admin.getUserById(authUserId);
              const fullName = authData?.user?.user_metadata?.full_name;
              if (typeof fullName === "string" && fullName.trim()) {
                firstName = fullName.trim().split(/\s+/)[0];
              }
            } catch {
              /* fall back to email prefix */
            }
          }

          void sendPlanActiveEmail({
            to: email,
            firstName,
            planLabel,
            amountFormatted,
            intervalLabel,
          }).catch((err) => console.error("plan-active email failed", err));
        } catch (err) {
          console.error("plan-active email setup failed", err);
        }
      }

      console.info(event.type, sub.id, sub.status, email);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
