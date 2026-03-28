/**
 * Family / Power upgrade — display copy (see docs/STRIPE_CLIENT_HANDOFF.md).
 * Video/scene caps and plan names stay here. Dollar strings are fallbacks when
 * `/api/stripe/upgrade-plan-prices` cannot load live Stripe Price data.
 */
export const UPGRADE_PLANS_DISPLAY = {
  family: {
    name: "Family",
    monthlyEquivalent: "$6.99/mo",
    billedYearly: "$89.99/yr",
    videosPerMonth: 6,
    scenesPerMonth: 25,
  },
  power: {
    name: "Power",
    monthlyEquivalent: "$9.99/mo",
    billedYearly: "$119.99/yr",
    videosPerMonth: 10,
    scenesPerMonth: 30,
  },
} as const;

export type PaidUpgradeTierId = keyof typeof UPGRADE_PLANS_DISPLAY;
