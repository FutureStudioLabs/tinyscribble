import { getAppUrl } from "@/lib/app-url";
import { getStripe } from "@/lib/stripe-server";
import { syncBillingFromCheckoutSession } from "@/lib/sync-billing-customer";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * After Stripe Checkout, user lands on /checkout/success with session_id.
 * This route verifies the session, syncs billing, and redirects to login with
 * email prefilled and auto-send of 6-digit OTP so the user can verify and sign in.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const origin = getAppUrl();

  if (!sessionId?.startsWith("cs_")) {
    return NextResponse.redirect(`${origin}/login?error=invalid_checkout`);
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.status !== "complete") {
      return NextResponse.redirect(`${origin}/login?error=checkout_incomplete`);
    }

    /** Fills `billing_customers` when Stripe webhooks haven’t run (local / misconfigured). */
    await syncBillingFromCheckoutSession(session, stripe);

    const email = (
      session.customer_details?.email ||
      session.customer_email ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=no_checkout_email`);
    }

    const returnTo =
      (session.metadata as Record<string, string> | null)?.return_to?.trim() ||
      "";
    const nextPath =
      returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/generate";

    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("next", nextPath);
    loginUrl.searchParams.set("email", email);
    loginUrl.searchParams.set("auto_send", "1");
    return NextResponse.redirect(loginUrl.toString());
  } catch (e) {
    console.error("complete-checkout stripe", e);
    return NextResponse.redirect(`${origin}/login?error=checkout_verify_failed`);
  }
}
