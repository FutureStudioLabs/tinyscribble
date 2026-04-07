/**
 * Maps a Stripe Price ID to the human-readable price line
 * shown in the trial-ending reminder email.
 *
 * Pricing spec (from Yanick):
 *   monthly          → "$8.99/month"
 *   annual_regular   → "$47.99/year (just $3.99/month)"
 *   annual_exit_promo→ "$35.99/year (just $2.99/month)"
 */
export function trialReminderPriceLine(priceId: string): string {
  const monthly = process.env.STRIPE_PRICE_STARTER_MONTHLY?.trim();
  const annual = process.env.STRIPE_PRICE_STARTER_ANNUAL?.trim();
  const exitAnnual = process.env.STRIPE_PRICE_STARTER_EXIT_ANNUAL?.trim();

  if (priceId === monthly) return "$8.99/month";
  if (priceId === annual) return "$47.99/year (just $3.99/month)";
  if (priceId === exitAnnual) return "$35.99/year (just $2.99/month)";

  return "$8.99/month";
}
