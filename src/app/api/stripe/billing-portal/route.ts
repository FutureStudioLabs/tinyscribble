import { getAppUrl } from "@/lib/app-url";
import { getStripe } from "@/lib/stripe-server";
import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Same-origin paths only — billing portal return_url after customer finishes in Stripe. */
const ALLOWED_RETURN_PATHS = new Set([
  "/paywall",
  "/dashboard/billing",
  "/dashboard/upload",
  "/dashboard/gallery",
  "/dashboard",
]);

function resolveReturnPath(body: unknown): string {
  if (typeof body !== "object" || body === null || !("returnPath" in body)) {
    return "/paywall";
  }
  const raw = (body as { returnPath: unknown }).returnPath;
  if (typeof raw !== "string") return "/paywall";
  const path = raw.trim().split("?")[0] ?? "";
  if (!path.startsWith("/") || path.startsWith("//")) return "/paywall";
  if (path.includes("..")) return "/paywall";
  return ALLOWED_RETURN_PATHS.has(path) ? path : "/paywall";
}

/**
 * Opens Stripe Customer Billing Portal for the email used at Checkout.
 * Requires **Customer portal** enabled in Stripe Dashboard → Settings → Billing → Customer portal.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter the email you used when you subscribed." },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const customers = await stripe.customers.list({ email, limit: 1 });

    if (customers.data.length === 0) {
      return NextResponse.json(
        {
          error:
            "We couldn’t find a subscription for that email. Check spelling or use the same email as Stripe checkout.",
        },
        { status: 404 }
      );
    }

    const customerId = customers.data[0]!.id;
    const returnPath = resolveReturnPath(body);
    const returnUrl = `${getAppUrl()}${returnPath}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not start billing portal." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe billing portal session failed", e);
    const message = e instanceof Error ? e.message : "Something went wrong.";
    const isConfig =
      typeof message === "string" &&
      (message.includes("No configuration provided") ||
        message.includes("billing portal") ||
        message.includes("portal"));

    return NextResponse.json(
      {
        error: isConfig
          ? "Billing portal isn’t configured yet in Stripe Dashboard (Settings → Billing → Customer portal)."
          : message,
      },
      { status: 500 }
    );
  }
}
