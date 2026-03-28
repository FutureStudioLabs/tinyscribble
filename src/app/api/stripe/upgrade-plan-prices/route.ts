import { upgradePriceDisplayFromStripe } from "@/lib/stripe-upgrade-price-display";
import { getStripe } from "@/lib/stripe-server";
import { priceIdForPaidUpgradeTier } from "@/lib/stripe-upgrade-products";
import { NextResponse } from "next/server";

type Body = {
  family: ReturnType<typeof upgradePriceDisplayFromStripe>;
  power: ReturnType<typeof upgradePriceDisplayFromStripe>;
};

/**
 * Public-ish display amounts for Family / Power (from Stripe Price objects).
 * Used by the upgrade modal so copy stays in sync with Stripe Dashboard pricing.
 */
export async function GET() {
  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json<Body>({ family: null, power: null });
  }

  const familyId = priceIdForPaidUpgradeTier("family");
  const powerId = priceIdForPaidUpgradeTier("power");

  async function load(
    priceId: string | undefined
  ): Promise<ReturnType<typeof upgradePriceDisplayFromStripe>> {
    if (!priceId) return null;
    try {
      const price = await stripe.prices.retrieve(priceId);
      return upgradePriceDisplayFromStripe(price);
    } catch (e) {
      console.error("upgrade-plan-prices retrieve", priceId, e);
      return null;
    }
  }

  const [family, power] = await Promise.all([load(familyId), load(powerId)]);

  return NextResponse.json<Body>({ family, power });
}
