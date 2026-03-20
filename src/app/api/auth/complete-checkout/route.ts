import { getAppUrl } from "@/lib/app-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe-server";
import { syncBillingFromCheckoutSession } from "@/lib/sync-billing-customer";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * After Stripe Checkout, user lands on /checkout/success with session_id.
 * This route verifies the session and redirects to a one-click Supabase magic link
 * (same email as Checkout) so they're signed in and you can match `billing_customers`.
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

    try {
      const admin = createAdminClient();
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/generate")}`;

      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });

      if (error || !data?.properties?.action_link) {
        console.error("complete-checkout generateLink", error);
        return NextResponse.redirect(
          `${origin}/login?next=${encodeURIComponent("/generate")}&email=${encodeURIComponent(email)}&hint=sign_in`
        );
      }

      return NextResponse.redirect(data.properties.action_link);
    } catch (e) {
      console.error("complete-checkout admin client", e);
      return NextResponse.redirect(
        `${origin}/login?next=${encodeURIComponent("/generate")}&email=${encodeURIComponent(email)}&hint=sign_in`
      );
    }
  } catch (e) {
    console.error("complete-checkout stripe", e);
    return NextResponse.redirect(`${origin}/login?error=checkout_verify_failed`);
  }
}
