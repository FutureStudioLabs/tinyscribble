"use client";

import Link from "next/link";
import { LockIcon } from "@phosphor-icons/react";
import { TRIAL_VIDEO_QUOTA_CHANGED_EVENT } from "@/constants/trial";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import {
  getImageQuota,
  getVideoQuota,
  isPaidSubscriptionStatus,
  isTrialingStatus,
} from "@/lib/billing-entitlement-client";
import { DASHBOARD_COPY, DASHBOARD_PAYWALL_UPLOAD_HREF } from "@/constants/dashboard-client-copy";
import { useCallback, useEffect, useState } from "react";

type Props = {
  /** First name or short display name (from server). */
  greetingName: string;
  /** Trial — Start early → opens same modal (video used + scenes left, or all credits used). */
  onStartEarlyClick?: () => void;
  /** Paid — no videos left (with scenes) or all credits used: opens Family/Power upgrade modal. */
  onPaidUpgradeClick?: () => void;
};

/**
 * Gradient welcome card — trial & paid quota states (Options 3–7).
 */
export function DashboardHeroCard({
  greetingName,
  onStartEarlyClick,
  onPaidUpgradeClick,
}: Props) {
  const [ent, setEnt] = useState<BillingEntitlementPayload | undefined>(undefined);

  const load = useCallback(() => {
    void fetch("/api/billing/entitlement", { credentials: "include" })
      .then((r) => r.json())
      .then((d: BillingEntitlementPayload) => setEnt(d))
      .catch(() =>
        setEnt({
          authenticated: false,
          entitled: false,
          subscriptionStatus: null,
          trialVideoQuota: null,
          trialImageQuota: null,
          trialEndsAt: null,
          billingPeriodEndsAt: null,
          paidVideoQuota: null,
          paidImageQuota: null,
          planInterval: null,
        })
      );
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(TRIAL_VIDEO_QUOTA_CHANGED_EVENT, load);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener(TRIAL_VIDEO_QUOTA_CHANGED_EVENT, load);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  const trialVideo = getVideoQuota(ent);
  const trialImage = getImageQuota(ent);

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FF7B5C] via-[#F28B66] to-[#FF9E6C] px-5 py-7 text-left text-white shadow-[0_12px_40px_-12px_rgba(255,123,92,0.55)]">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/[0.12]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 right-4 h-44 w-44 rounded-full bg-white/[0.08]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/4 top-1/3 h-24 w-24 rounded-full bg-white/[0.06]"
        aria-hidden
      />

      <p
        className="relative text-sm font-medium text-white/90"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {DASHBOARD_COPY.hero.welcomeBack}
      </p>
      <h2
        className="relative mt-1 text-[28px] font-bold leading-[1.15] tracking-tight sm:text-[32px]"
        style={{ fontFamily: "var(--font-fredoka)" }}
      >
        {greetingName}{" "}
        <span aria-hidden className="inline-block">
          ✨
        </span>
      </h2>

      {trialVideo != null && trialImage != null ? (
        trialVideo.remaining === 0 && trialImage.remaining > 0 ? (
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
                {DASHBOARD_COPY.hero.scenesLeft(trialImage.remaining)}
              </p>
            </div>
            {isTrialingStatus(ent?.subscriptionStatus) && onStartEarlyClick ? (
              <button
                type="button"
                onClick={onStartEarlyClick}
                className="relative z-10 inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#FF7B5C] shadow-sm transition hover:bg-white/95"
              >
                {DASHBOARD_COPY.hero.ctaStartEarly}
              </button>
            ) : isPaidSubscriptionStatus(ent?.subscriptionStatus) && onPaidUpgradeClick ? (
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
                {isTrialingStatus(ent?.subscriptionStatus)
                  ? DASHBOARD_COPY.hero.ctaStartEarly
                  : DASHBOARD_COPY.hero.ctaUpgrade}
              </Link>
            )}
          </div>
        ) : trialVideo.remaining === 0 && trialImage.remaining === 0 ? (
          isTrialingStatus(ent?.subscriptionStatus) ? (
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
          ) : isPaidSubscriptionStatus(ent?.subscriptionStatus) ? (
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
          ) : null
        ) : trialVideo.remaining > 0 && trialImage.remaining === 0 ? (
          <div
            className="relative mt-4 rounded-2xl border border-white/30 bg-white/10 p-3.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <p className="flex items-center gap-2 text-sm font-bold leading-snug text-white">
              <span aria-hidden>🎬</span>
              {DASHBOARD_COPY.hero.videosLeft(trialVideo.remaining)}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-bold leading-snug text-white">
              <span aria-hidden>✨</span>
              {DASHBOARD_COPY.hero.noScenesLeft}
            </p>
          </div>
        ) : (
          <div
            className="relative mt-4 rounded-2xl border border-white/30 bg-white/10 p-3.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <p className="flex items-center gap-2 text-sm font-bold leading-snug text-white">
              <span aria-hidden>🎬</span>
              {DASHBOARD_COPY.hero.videosLeft(trialVideo.remaining)}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-bold leading-snug text-white">
              <span aria-hidden>✨</span>
              {DASHBOARD_COPY.hero.scenesLeft(trialImage.remaining)}
            </p>
          </div>
        )
      ) : ent === undefined ? (
        <div
          className="relative mt-4 h-8 w-48 max-w-full animate-pulse rounded-full bg-white/15"
          aria-hidden
        />
      ) : ent.authenticated && !ent.entitled ? (
        <div
          className="relative mt-4 rounded-2xl border border-white/30 bg-white/10 p-3.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold leading-snug text-white">
                {DASHBOARD_COPY.hero.noPlanTitle}
              </p>
              <p className="mt-1 text-sm leading-snug text-white/90">{DASHBOARD_COPY.hero.noPlanBody}</p>
            </div>
            <Link
              href={DASHBOARD_PAYWALL_UPLOAD_HREF}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#FF7B5C] shadow-sm no-underline transition hover:bg-white/95"
            >
              {DASHBOARD_COPY.hero.ctaChoosePlan}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
