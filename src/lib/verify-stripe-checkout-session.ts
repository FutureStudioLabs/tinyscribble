import { getStripe } from "@/lib/stripe-server";
import { syncBillingFromCheckoutSession } from "@/lib/sync-billing-customer";

export type VerifyStripeCheckoutResult =
  | { ok: true; email: string; nextPath: string }
  | { ok: false; error: string };

/**
 * Validates a completed Stripe Checkout session, syncs billing, returns email + next path.
 * Used by `/api/auth/complete-checkout` (redirect) and `/api/auth/verify-checkout-session` (JSON).
 */
export async function verifyStripeCheckoutSession(
  sessionId: string
): Promise<VerifyStripeCheckoutResult> {
  if (!sessionId?.startsWith("cs_")) {
    return { ok: false, error: "invalid_checkout" };
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.status !== "complete") {
      return { ok: false, error: "checkout_incomplete" };
    }

    await syncBillingFromCheckoutSession(session, stripe);

    const email = (
      session.customer_details?.email ||
      session.customer_email ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      return { ok: false, error: "no_checkout_email" };
    }

    const returnTo =
      (session.metadata as Record<string, string> | null)?.return_to?.trim() ||
      "";
    const nextPath =
      returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/generate";

    return { ok: true, email, nextPath };
  } catch (e) {
    console.error("verifyStripeCheckoutSession", e);
    return { ok: false, error: "checkout_verify_failed" };
  }
}
