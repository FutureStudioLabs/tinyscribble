"use client";

import Link from "next/link";
import { LockIcon } from "@phosphor-icons/react";
import { DashboardUploadLegal } from "@/components/dashboard/DashboardUploadLegal";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";
import {
  DASHBOARD_COPY,
  DASHBOARD_PAYWALL_UPLOAD_HREF,
  DASHBOARD_PREVIEW_SAMPLE_DATES,
  DASHBOARD_STATE_CASES,
  uploadVideoPausedSublinePreview,
  type DashboardStateCaseId,
} from "@/constants/dashboard-client-copy";

export type { DashboardStateCaseId };
export { DASHBOARD_STATE_CASES };

export function DashboardStatesPreviewHero({
  c,
  displayName = "Preview ✨",
  onStartEarlyClick,
  onPaidUpgradeClick,
}: {
  c: DashboardStateCaseId;
  displayName?: string;
  /** Trial case 2 — Start early → opens modal when set. */
  onStartEarlyClick?: () => void;
  /** Paid cases 5 & 7 — Upgrade → opens Family/Power modal when set. */
  onPaidUpgradeClick?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FF7B5C] via-[#F28B66] to-[#FF9E6C] px-5 py-7 text-left text-white shadow-[0_12px_40px_-12px_rgba(255,123,92,0.55)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/[0.12]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-16 right-4 h-44 w-44 rounded-full bg-white/[0.08]" aria-hidden />

      <p className="relative text-sm font-medium text-white/90" style={{ fontFamily: "var(--font-body)" }}>
        {DASHBOARD_COPY.hero.welcomeBack}
      </p>
      <h2
        className="relative mt-1 text-[28px] font-bold leading-[1.15] tracking-tight sm:text-[32px]"
        style={{ fontFamily: "var(--font-fredoka)" }}
      >
        {displayName}
      </h2>

      {c === 1 || c === 4 ? (
        <div
          className="relative mt-4 rounded-2xl border border-white/30 bg-white/10 p-3.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <p className="flex items-center gap-2 text-sm font-bold leading-snug text-white">
            <span aria-hidden>🎬</span>
            {c === 1
              ? DASHBOARD_COPY.hero.previewTrialVideoLine
              : DASHBOARD_COPY.hero.previewPaidNormalVideoLine}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold leading-snug text-white">
            <span aria-hidden>✨</span>
            {c === 1
              ? DASHBOARD_COPY.hero.previewTrialScenesLine
              : DASHBOARD_COPY.hero.previewPaidNormalScenesLine}
          </p>
        </div>
      ) : null}

      {c === 2 || c === 5 ? (
        <div
          className="relative mt-4 flex flex-row items-center justify-between gap-3 rounded-2xl border border-white/30 bg-white/10 p-3.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:gap-4"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <div className="min-w-0 flex-1 space-y-1 text-sm font-semibold leading-snug text-white">
            <p className="flex items-center gap-1.5">
              <span aria-hidden>🎬</span>
              {DASHBOARD_COPY.hero.noVideosLeft}
            </p>
            <p className="flex items-center gap-1.5 text-white/95">
              <span aria-hidden>✨</span>
              {c === 2
                ? DASHBOARD_COPY.hero.previewTrialVideoPauseScenesLine
                : DASHBOARD_COPY.hero.previewPaidVideoPauseScenesLine}
            </p>
          </div>
          {c === 2 && onStartEarlyClick ? (
            <button
              type="button"
              onClick={onStartEarlyClick}
              className="relative z-10 inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#FF7B5C] shadow-sm transition hover:bg-white/95"
            >
              {DASHBOARD_COPY.hero.ctaStartEarly}
            </button>
          ) : c === 5 && onPaidUpgradeClick ? (
            <button
              type="button"
              onClick={onPaidUpgradeClick}
              className="relative z-10 inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#FF7B5C] shadow-sm transition hover:bg-white/95"
            >
              {DASHBOARD_COPY.hero.ctaUpgrade}
            </button>
          ) : (
            <Link
              href={DASHBOARD_PAYWALL_UPLOAD_HREF}
              className="relative z-10 inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#FF7B5C] shadow-sm no-underline transition hover:bg-white/95"
            >
              {c === 2 ? DASHBOARD_COPY.hero.ctaStartEarly : DASHBOARD_COPY.hero.ctaUpgrade}
            </Link>
          )}
        </div>
      ) : null}

      {c === 3 ? (
        <div
          className="relative mt-4 flex flex-row items-center justify-between gap-3 rounded-2xl border border-white/30 bg-white/10 p-3.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:gap-4"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <p className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-white">
            <LockIcon size={22} weight="fill" className="shrink-0 text-white/95" aria-hidden />
            {DASHBOARD_COPY.hero.allTrialCreditsUsed}
          </p>
          {onStartEarlyClick ? (
            <button
              type="button"
              onClick={onStartEarlyClick}
              className="relative z-10 inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#FF7B5C] shadow-sm transition hover:bg-white/95"
            >
              {DASHBOARD_COPY.hero.ctaStartEarly}
            </button>
          ) : (
            <Link
              href={DASHBOARD_PAYWALL_UPLOAD_HREF}
              className="relative z-10 inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#FF7B5C] shadow-sm no-underline transition hover:bg-white/95"
            >
              {DASHBOARD_COPY.hero.ctaStartEarly}
            </Link>
          )}
        </div>
      ) : null}

      {c === 6 ? (
        <div
          className="relative mt-4 rounded-2xl border border-white/30 bg-white/10 p-3.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <p className="flex items-center gap-2 text-sm font-bold leading-snug text-white">
            <span aria-hidden>🎬</span>
            {DASHBOARD_COPY.hero.previewPaidVideosNoScenesVideoLine}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold leading-snug text-white">
            <span aria-hidden>✨</span>
            {DASHBOARD_COPY.hero.noScenesLeft}
          </p>
        </div>
      ) : null}

      {c === 7 ? (
        <div
          className="relative mt-4 flex flex-row items-center justify-between gap-3 rounded-2xl border border-white/30 bg-white/10 p-3.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:gap-4"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <p className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-white">
            <span aria-hidden>🔒</span>
            {DASHBOARD_COPY.hero.allCreditsUsedThisMonth}
          </p>
          {onPaidUpgradeClick ? (
            <button
              type="button"
              onClick={onPaidUpgradeClick}
              className="relative z-10 inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#FF7B5C] shadow-sm transition hover:bg-white/95"
            >
              {DASHBOARD_COPY.hero.ctaUpgrade}
            </button>
          ) : (
            <Link
              href={DASHBOARD_PAYWALL_UPLOAD_HREF}
              className="relative z-10 inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#FF7B5C] shadow-sm no-underline transition hover:bg-white/95"
            >
              {DASHBOARD_COPY.hero.ctaUpgrade}
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardStatesPreviewUpload({
  c,
  onStartEarlyClick,
}: {
  c: DashboardStateCaseId;
  onStartEarlyClick?: () => void;
}) {
  if (c === 3) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1 py-2">
        <div className="rounded-2xl border border-[#FFD4C4] bg-[#FFF5F0] px-4 py-3.5">
          <p
            className="text-center text-[15px] font-bold leading-snug text-[#E85A3C] sm:text-left"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {DASHBOARD_COPY.upload.trialExhausted.planStartsTitle(DASHBOARD_PREVIEW_SAMPLE_DATES.trialPlanStart)}
          </p>
          <p
            className="mt-2 text-center text-xs leading-relaxed text-[#B8735C] sm:text-left"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {DASHBOARD_COPY.upload.trialExhausted.planStartsSub}
          </p>
        </div>
        <div className="mt-4 rounded-2xl border-2 border-dashed border-[#C8C8C8] bg-[#F7F7F7] px-5 py-12 text-center">
          <LockIcon size={56} weight="duotone" className="mx-auto mb-5 text-[#D4A574]" aria-hidden />
          <h3 className="mb-2 text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
            {DASHBOARD_COPY.upload.trialExhausted.cardTitle}
          </h3>
          <p className="text-sm leading-relaxed text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
            {DASHBOARD_COPY.upload.trialExhausted.cardBody}
          </p>
        </div>
        <div className="mt-auto pt-6">
          {onStartEarlyClick ? (
            <button
              type="button"
              onClick={onStartEarlyClick}
              className={`${funnelPrimaryButtonClassName} inline-flex w-full justify-center`}
            >
              {DASHBOARD_COPY.upload.trialExhausted.ctaPrimary}
            </button>
          ) : (
            <span
              className={`${funnelPrimaryButtonClassName} pointer-events-none inline-flex w-full justify-center opacity-90`}
            >
              {DASHBOARD_COPY.upload.trialExhausted.ctaPrimary}
            </span>
          )}
          <p className="mt-3 text-center text-xs text-[#9B9B9B]" style={{ fontFamily: "var(--font-body)" }}>
            {DASHBOARD_COPY.upload.trialExhausted.waitLineWithDate(DASHBOARD_PREVIEW_SAMPLE_DATES.trialPlanStart)}
          </p>
        </div>
      </div>
    );
  }

  if (c === 6) {
    return (
      <div className="flex min-h-0 flex-1 flex-col py-2">
        <h2
          className="mb-4 text-left text-xl font-bold text-[#1A1A1A] sm:text-2xl"
          style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
        >
          {DASHBOARD_COPY.upload.headline}
        </h2>
        <div className="rounded-2xl border-2 border-dashed border-[#C8C8C8] bg-[#F7F7F7] px-5 py-12 text-center">
          <span className="mb-5 block text-[4.5rem] leading-none" aria-hidden>
            ✨
          </span>
          <h3 className="mb-2 text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
            {DASHBOARD_COPY.upload.noScenes.cardTitle}
          </h3>
          <p className="text-sm leading-relaxed text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
            {DASHBOARD_COPY.upload.noScenes.cardBody}
          </p>
        </div>
        <div className="mt-auto pt-6">
          <span className="flex h-14 w-full items-center justify-center rounded-full border-[3px] border-[#FF7B5C] bg-white text-base font-bold text-[#FF7B5C]">
            {DASHBOARD_COPY.upload.noScenes.galleryCta}
          </span>
          <p className="mt-3 text-center text-xs text-[#9B9B9B]" style={{ fontFamily: "var(--font-body)" }}>
            {DASHBOARD_COPY.upload.noScenes.sceneResetLineWithDate(DASHBOARD_PREVIEW_SAMPLE_DATES.sceneReset)}
          </p>
        </div>
      </div>
    );
  }

  if (c === 7) {
    return (
      <div className="flex min-h-0 flex-1 flex-col py-2">
        <div className="rounded-2xl border-2 border-dashed border-[#C8C8C8] bg-white px-5 py-12 text-center shadow-sm">
          <LockIcon size={56} weight="duotone" className="mx-auto mb-5 text-[#D4A574]" aria-hidden />
          <h3 className="mb-2 text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
            {DASHBOARD_COPY.upload.paidExhausted.cardTitle}
          </h3>
          <p className="text-sm leading-relaxed text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
            {DASHBOARD_COPY.upload.paidExhausted.cardBodyWithDate(DASHBOARD_PREVIEW_SAMPLE_DATES.sceneReset)}
          </p>
        </div>
        <div className="mt-auto pt-6">
          <button
            type="button"
            disabled
            className="flex h-14 w-full cursor-default items-center justify-center rounded-full bg-[#EAEAEA] px-5 text-base font-bold text-[#555555]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {DASHBOARD_COPY.upload.paidExhausted.ctaDisabledWithDate(DASHBOARD_PREVIEW_SAMPLE_DATES.sceneReset)}
          </button>
        </div>
      </div>
    );
  }

  const showScenePause = c === 2 || c === 5;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col py-2">
          <h2
            className="mb-4 text-left text-xl font-bold text-[#1A1A1A] sm:text-2xl"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            {DASHBOARD_COPY.upload.headline}
          </h2>
          <button
            type="button"
            className="group w-full rounded-[26px] border border-[#F0EBE6] bg-[#FDF8F5] px-6 py-10 text-center shadow-sm"
          >
            <span className="mb-4 block text-[4.5rem] leading-none" aria-hidden>
              🎨
            </span>
            <span
              className="mb-2 block text-lg font-bold text-[#1A1A1A] sm:text-xl"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {showScenePause ? DASHBOARD_COPY.upload.uploadForScenes : DASHBOARD_COPY.upload.chooseDrawing}
            </span>
            <span className="block text-sm text-[#9B9B9B]" style={{ fontFamily: "var(--font-body)" }}>
              {showScenePause ? uploadVideoPausedSublinePreview() : DASHBOARD_COPY.upload.formatsLine}
            </span>
          </button>
        </div>
        <div className="mt-auto border-t border-transparent pt-4">
          <FunnelPrimaryButton type="button" className="w-full" disabled>
            {DASHBOARD_COPY.upload.uploadCta}
            <span className="text-lg" aria-hidden>
              ↑
            </span>
          </FunnelPrimaryButton>
          <DashboardUploadLegal className="mt-3" />
        </div>
      </div>
    </div>
  );
}
