import { getAppUrl } from "@/lib/app-url";
import {
  isStripeCheckoutProduct,
  priceIdForProduct,
  STARTER_TRIAL_DAYS,
} from "@/lib/stripe-checkout";
import { getStripe } from "@/lib/stripe-server";
import { NextRequest, NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { product, supabaseUserId: rawUserId, returnTo: rawReturnTo } = body as {
    product?: unknown;
    supabaseUserId?: unknown;
    returnTo?: unknown;
  };

  if (!isStripeCheckoutProduct(product)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const supabaseUserId =
    typeof rawUserId === "string" ? rawUserId.trim() : "";

  if (supabaseUserId && !UUID_RE.test(supabaseUserId)) {
    return NextResponse.json(
      { error: "Invalid supabaseUserId" },
      { status: 400 }
    );
  }

  const priceId = priceIdForProduct(product);
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          "Stripe price is not configured. Set STRIPE_PRICE_* in the environment.",
      },
      { status: 500 }
    );
  }

  const origin = getAppUrl();
  const cancelPath =
    product === "starter_exit_annual" ? "/paywall/exit" : "/paywall";

  const returnTo =
    typeof rawReturnTo === "string" && rawReturnTo.startsWith("/")
      ? rawReturnTo
      : "";

  const metadata: Record<string, string> = {
    product,
  };
  if (supabaseUserId) {
    metadata.supabase_user_id = supabaseUserId;
  }
  if (returnTo) {
    metadata.return_to = returnTo;
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: STARTER_TRIAL_DAYS,
        metadata,
      },
      success_url: `${origin}/login?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      metadata,
      client_reference_id: supabaseUserId || undefined,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe checkout session create failed", e);
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
