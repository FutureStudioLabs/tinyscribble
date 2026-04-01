/**
 * Human-facing plan names for billing UI (maps subscription price id → product tier).
 */

export type PaidPlanDisplayTier = "starter" | "family" | "power";

export function paidPlanDisplayTierFromPriceId(
  priceId: string | undefined
): PaidPlanDisplayTier {
  const fam = process.env.STRIPE_PRICE_FAMILY_ANNUAL?.trim();
  const pow = process.env.STRIPE_PRICE_POWER_ANNUAL?.trim();
  if (priceId && pow && priceId === pow) return "power";
  if (priceId && fam && priceId === fam) return "family";
  return "starter";
}

export function tinyScribblePlanLabel(tier: PaidPlanDisplayTier): string {
  switch (tier) {
    case "power":
      return "TinyScribble Power";
    case "family":
      return "TinyScribble Family";
    default:
      return "TinyScribble Starter";
  }
}
