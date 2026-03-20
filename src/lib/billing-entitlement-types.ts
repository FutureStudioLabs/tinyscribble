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
};
