/** Products exposed to the checkout API (maps to env price IDs). */
export const STRIPE_CHECKOUT_PRODUCTS = [
  "starter_monthly",
  "starter_annual",
  "starter_exit_annual",
] as const;

export type StripeCheckoutProduct = (typeof STRIPE_CHECKOUT_PRODUCTS)[number];

export function isStripeCheckoutProduct(
  value: unknown
): value is StripeCheckoutProduct {
  return (
    typeof value === "string" &&
    (STRIPE_CHECKOUT_PRODUCTS as readonly string[]).includes(value)
  );
}

/** 3-day trial on Starter — set in Checkout, not on Stripe product (handoff). */
export const STARTER_TRIAL_DAYS = 3;

export function priceIdForProduct(
  product: StripeCheckoutProduct
): string | undefined {
  const env: Record<StripeCheckoutProduct, string | undefined> = {
    starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    starter_annual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
    starter_exit_annual: process.env.STRIPE_PRICE_STARTER_EXIT_ANNUAL,
  };
  const id = env[product]?.trim();
  if (!id || !id.startsWith("price_")) return undefined;
  return id;
}
