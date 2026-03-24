import { verifyStripeCheckoutSession } from "@/lib/verify-stripe-checkout-session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * JSON variant of complete-checkout: verifies Stripe session + syncs billing.
 * Used by `/login` after Stripe redirects with `?session_id=` so OTP UI can show on one page.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId?.trim()) {
    return NextResponse.json(
      { ok: false as const, error: "missing_session" },
      { status: 400 }
    );
  }

  const result = await verifyStripeCheckoutSession(sessionId.trim());
  if (!result.ok) {
    return NextResponse.json({ ok: false as const, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true as const,
    email: result.email,
    next: result.nextPath,
  });
}
