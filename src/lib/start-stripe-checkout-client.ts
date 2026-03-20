"use client";

import type { StripeCheckoutProduct } from "@/lib/stripe-checkout";

/**
 * Creates a Stripe Checkout Session and redirects the browser to hosted Checkout.
 */
export async function startStripeCheckout(
  product: StripeCheckoutProduct,
  options?: { supabaseUserId?: string }
): Promise<void> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product,
      ...(options?.supabaseUserId
        ? { supabaseUserId: options.supabaseUserId }
        : {}),
    }),
  });

  const data = (await res.json()) as { url?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.error || "Checkout failed");
  }
  if (!data.url) {
    throw new Error("No checkout URL returned");
  }

  window.location.assign(data.url);
}
