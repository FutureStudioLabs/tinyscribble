/**
 * Starter tier — copy shown on main paywall (PROJECT_SCOPE §3.5).
 * Source of truth for customer-facing amounts; keep aligned with `TrialPaywallScreen` COPY.
 */
export const STARTER_PLAN_DISPLAY = {
  monthly: "$8.99/mo",
  /** Annual — shown as monthly equivalent (scope §3.5) */
  yearlyEquivalent: "$3.99/mo",
  /** Annual total (shown with “/yearly” in plan cards) */
  yearlyTotal: "$47.99",
} as const;
