/** Paid subscription monthly limits (Stripe `active` / `past_due` — usage in current billing period). */
export const PAID_MONTHLY_VIDEO_LIMIT = 3;
export const PAID_MONTHLY_SCENE_LIMIT = 20;

export const PAID_SCENE_LIMIT_CODE = "PAID_SCENE_LIMIT_EXHAUSTED" as const;
export const PAID_VIDEO_LIMIT_CODE = "PAID_VIDEO_LIMIT_EXHAUSTED" as const;
