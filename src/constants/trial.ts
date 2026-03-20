/**
 * Starter trial: max full videos while Stripe subscription is `trialing` only.
 * `GET /api/billing/entitlement` sets `trialVideoQuota` only when status is `trialing`.
 */
export const TRIAL_FREE_VIDEO_LIMIT = 1;

/** Dispatch after a trial video completes so the header quota refetches. */
export const TRIAL_VIDEO_QUOTA_CHANGED_EVENT = "tinyscribble:trial-video-quota";
