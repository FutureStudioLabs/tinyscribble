/**
 * Client-approved dashboard copy (hero + upload + preview).
 * Update this file to match design screenshots — preview and production import from here.
 */
import { PAID_MONTHLY_SCENE_LIMIT, PAID_MONTHLY_VIDEO_LIMIT } from "@/constants/plan";

/** Paywall entry from dashboard welcome card / upload (return path after checkout). */
export const DASHBOARD_PAYWALL_UPLOAD_HREF = "/paywall?next=/dashboard/upload" as const;

export type DashboardStateCaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const DASHBOARD_STATE_CASES: {
  id: DashboardStateCaseId;
  section: "trial" | "paid";
  title: string;
  subtitle: string;
}[] = [
  { id: 1, section: "trial", title: "Trial — video available", subtitle: "1 video + 5 scenes left" },
  {
    id: 2,
    section: "trial",
    title: "Trial — video used, scenes left",
    subtitle: "Inline ‘Start early’ CTA in header",
  },
  {
    id: 3,
    section: "trial",
    title: "Trial — all credits used",
    subtitle: "Auto-renew date + start early option",
  },
  { id: 4, section: "paid", title: "Paid — normal", subtitle: "2 videos + 18 scenes left" },
  {
    id: 5,
    section: "paid",
    title: "Paid — no videos left",
    subtitle: "Upsell CTA in greeting card",
  },
  { id: 6, section: "paid", title: "Paid — no scenes left", subtitle: "Convert from gallery" },
  { id: 7, section: "paid", title: "Paid — all credits used", subtitle: "Reset date shown" },
];

/** Sample dates for design preview only (toolbar mock states). */
export const DASHBOARD_PREVIEW_SAMPLE_DATES = {
  trialPlanStart: "25 Mar 2026",
  sceneReset: "1 Apr 2026",
} as const;

export const DASHBOARD_COPY = {
  hero: {
    welcomeBack: "Welcome back",
    noVideosLeft: "No videos left",
    noScenesLeft: "No scenes left",
    allTrialCreditsUsed: "All trial credits used",
    allCreditsUsedThisMonth: "All credits used this month",
    ctaStartEarly: "Start early →",
    ctaUpgrade: "Upgrade →",
    videosLeft: (n: number) => `${n} video${n === 1 ? "" : "s"} left`,
    scenesLeft: (n: number) => `${n} scene${n === 1 ? "" : "s"} left`,
    /** Preview case 1 */
    previewTrialVideoLine: "1 video left",
    previewTrialScenesLine: "5 scenes left",
    /** Preview case 4 */
    previewPaidNormalVideoLine: "2 videos left",
    previewPaidNormalScenesLine: "18 scenes left",
    /** Preview case 2 */
    previewTrialVideoPauseScenesLine: "3 scenes left",
    /** Preview case 5 */
    previewPaidVideoPauseScenesLine: "12 scenes left",
    /** Preview case 6 */
    previewPaidVideosNoScenesVideoLine: "2 videos left",
  },
  upload: {
    headline: "Turn a drawing into magic",
    chooseDrawing: "Choose your child's drawing",
    uploadForScenes: "Upload for scenes",
    formatsLine: "JPEG · PNG · HEIC · WebP",
    uploadCta: "Upload drawing",
    starting: "Starting…",
    trialExhausted: {
      planStartsTitle: (date: string) => `Your plan starts automatically on ${date}`,
      planStartsSub:
        "No action needed — or start early to use your full allowance now.",
      cardTitle: "Trial credits used up",
      cardBody: "Start early to unlock 3 videos and 20 scenes right now.",
      ctaPrimary: "Start plan early ✨",
      waitLineWithDate: (date: string) =>
        `Or wait — credits unlock automatically on ${date}.`,
      waitLineTrialEnds: "Or wait — credits unlock automatically when your trial ends.",
    },
    paidExhausted: {
      cardTitle: "All credits used",
      cardBodyWithDate: (date: string) =>
        `${PAID_MONTHLY_VIDEO_LIMIT} videos and ${PAID_MONTHLY_SCENE_LIMIT} scenes reset on ${date}.`,
      cardBodyNextBilling: `${PAID_MONTHLY_VIDEO_LIMIT} videos and ${PAID_MONTHLY_SCENE_LIMIT} scenes reset on your next billing date.`,
      ctaDisabledWithDate: (date: string) => `Credits reset on ${date}`,
      ctaDisabledFallback: "Credits reset next billing cycle",
    },
    noScenes: {
      cardTitle: "No scenes left",
      cardBody: "You can still convert existing scenes to video from the gallery.",
      galleryCta: "Go to gallery → convert to video",
      sceneResetLineWithDate: (date: string) => `Scene credits reset on ${date}`,
      sceneResetTrialing: "Scene credits reset when your trial ends",
      sceneResetBilling: "Scene credits reset next billing cycle",
    },
  },
};

export function uploadVideoPausedSubline(opts: {
  scenesRemaining: number;
  planDateLabel: string | null;
  isTrialing: boolean;
}): string {
  const { scenesRemaining, planDateLabel, isTrialing } = opts;
  const sceneWord = scenesRemaining === 1 ? "scene" : "scenes";
  const base = `${scenesRemaining} ${sceneWord} left. Video conversion paused — `;
  if (planDateLabel) return `${base}resets ${planDateLabel}.`;
  return `${base}${isTrialing ? "when your trial ends." : "next billing cycle."}`;
}

/** Preview toolbar: fixed “video paused” subline for cases 2 & 5. */
export function uploadVideoPausedSublinePreview(): string {
  return uploadVideoPausedSubline({
    scenesRemaining: 12,
    planDateLabel: DASHBOARD_PREVIEW_SAMPLE_DATES.sceneReset,
    isTrialing: false,
  });
}
