import type Stripe from "stripe";

export type UpgradeTierPriceDisplay = {
  monthlyEquivalent: string;
  billedYearly: string;
};

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * UI strings for the upgrade modal from a live Stripe Price.
 * Annual: monthly line = yearly ÷ 12, rounded to nearest cent (matches what customers pay over the year).
 */
export function upgradePriceDisplayFromStripe(
  price: Stripe.Price
): UpgradeTierPriceDisplay | null {
  const unitAmount = price.unit_amount;
  const currency = price.currency;
  if (unitAmount == null || !currency) return null;

  const interval = price.recurring?.interval;

  if (interval === "year") {
    const yearly = formatMoney(unitAmount, currency);
    const monthlyCents = Math.round(unitAmount / 12);
    const monthly = formatMoney(monthlyCents, currency);
    return {
      monthlyEquivalent: `${monthly}/mo`,
      billedYearly: `${yearly}/yr`,
    };
  }

  if (interval === "month") {
    const monthly = formatMoney(unitAmount, currency);
    return {
      monthlyEquivalent: `${monthly}/mo`,
      billedYearly: `${monthly}/mo`,
    };
  }

  const once = formatMoney(unitAmount, currency);
  return {
    monthlyEquivalent: once,
    billedYearly: once,
  };
}
