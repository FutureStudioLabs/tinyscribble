/**
 * Starter trial: max full videos while Stripe subscription is `trialing` only.
 * `GET /api/billing/entitlement` sets `trialVideoQuota` only when status is `trialing`.
 */
export const TRIAL_FREE_VIDEO_LIMIT = 1;

/** Max `generated/*` gallery rows while `trialing` (subscribers get 1 scene per generation). */
export const TRIAL_FREE_IMAGE_LIMIT = 5;

export const TRIAL_VIDEO_EXHAUSTED_CODE = "TRIAL_VIDEO_EXHAUSTED" as const;
export const TRIAL_IMAGE_LIMIT_CODE = "TRIAL_IMAGE_LIMIT" as const;

/** Dispatch after a trial video completes so the header quota refetches. */
export const TRIAL_VIDEO_QUOTA_CHANGED_EVENT = "tinyscribble:trial-video-quota";

/** After user dismisses Skip Trial (“No thanks”), show sticky upgrade banner. */
export const SKIP_TRIAL_MODAL_DISMISSED_KEY = "tinyscribble:skip-trial-modal-dismissed";

export const SKIP_TRIAL_DISMISSED_EVENT = "tinyscribble:skip-trial-dismissed";
