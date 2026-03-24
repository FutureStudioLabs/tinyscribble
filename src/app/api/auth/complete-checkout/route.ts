import { getAppUrl } from "@/lib/app-url";
import { verifyStripeCheckoutSession } from "@/lib/verify-stripe-checkout-session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Legacy / bookmark: redirects to `/login?session_id=` so the same OTP flow runs as Stripe success_url.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const origin = getAppUrl();

  if (!sessionId?.trim()) {
    return NextResponse.redirect(`${origin}/login?error=invalid_checkout`);
  }

  const result = await verifyStripeCheckoutSession(sessionId.trim());
  if (!result.ok) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(result.error)}`);
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("session_id", sessionId.trim());
  loginUrl.searchParams.set("next", result.nextPath);
  return NextResponse.redirect(loginUrl.toString());
}
