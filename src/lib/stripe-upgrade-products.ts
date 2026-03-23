import type { PaidUpgradeTierId } from "@/constants/upgrade-plans-display";

/** Stripe Price IDs for upgrade-only annual plans (env). */
export function priceIdForPaidUpgradeTier(
  tier: PaidUpgradeTierId
): string | undefined {
  const raw =
    tier === "family"
      ? process.env.STRIPE_PRICE_FAMILY_ANNUAL
      : process.env.STRIPE_PRICE_POWER_ANNUAL;
  const id = raw?.trim();
  if (!id || !id.startsWith("price_")) return undefined;
  return id;
}
