import { getStripe } from "@/lib/stripe-server";
import { syncBillingFromCheckoutSession } from "@/lib/sync-billing-customer";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Safe subset of Checkout session for post-payment UI (after Stripe redirect). */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId?.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.status !== "complete") {
      return NextResponse.json({ error: "Checkout not complete" }, { status: 400 });
    }

    try {
      await syncBillingFromCheckoutSession(session, stripe);
    } catch (syncErr) {
      console.error("checkout-session: billing sync", syncErr);
    }

    const email = (
      session.customer_details?.email ||
      session.customer_email ||
      ""
    ).trim();

    return NextResponse.json({
      email: email || null,
      mode: session.mode,
    });
  } catch (e) {
    console.error("checkout-session GET", e);
    return NextResponse.json({ error: "Could not load session" }, { status: 500 });
  }
}
