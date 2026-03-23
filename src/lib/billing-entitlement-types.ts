export type TrialVideoQuota = {
  remaining: number;
  limit: number;
};

export type TrialImageQuota = {
  /** Rows under `generated/` in gallery. */
  used: number;
  remaining: number;
  limit: number;
};

/** Mirrors `GET /api/billing/entitlement` JSON (for client checks). */
export type BillingEntitlementPayload = {
  authenticated: boolean;
  entitled: boolean;
  subscriptionStatus: string | null;
  trialVideoQuota: TrialVideoQuota | null;
  trialImageQuota: TrialImageQuota | null;
  /** ISO 8601 — Stripe subscription `trial_end` while `trialing`; null if unknown. */
  trialEndsAt: string | null;
  /** ISO 8601 — `current_period_end` while `active` / `past_due`; credits reset. */
  billingPeriodEndsAt: string | null;
  /** Monthly quotas for paid plan (current billing period). Null when not active/past_due. */
  paidVideoQuota: TrialVideoQuota | null;
  paidImageQuota: TrialImageQuota | null;
  /** Stripe subscription price interval when known (Starter monthly vs annual). */
  planInterval: "month" | "year" | null;
};
