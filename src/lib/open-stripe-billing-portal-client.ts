"use client";

export type OpenBillingPortalOptions = {
  /** Where Stripe sends the user after the Customer Portal (must be allowlisted server-side). */
  returnPath?: string;
};

export async function openStripeBillingPortal(
  email: string,
  options?: OpenBillingPortalOptions
): Promise<void> {
  const res = await fetch("/api/stripe/billing-portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      ...(options?.returnPath ? { returnPath: options.returnPath } : {}),
    }),
  });

  const data = (await res.json()) as { url?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.error || "Could not open billing portal.");
  }
  if (!data.url) {
    throw new Error("No portal URL returned.");
  }

  window.location.assign(data.url);
}
