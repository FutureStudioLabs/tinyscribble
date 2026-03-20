/** Mirrors `GET /api/billing/entitlement` JSON (for client checks). */
export type BillingEntitlementPayload = {
  authenticated: boolean;
  entitled: boolean;
  subscriptionStatus: string | null;
};
