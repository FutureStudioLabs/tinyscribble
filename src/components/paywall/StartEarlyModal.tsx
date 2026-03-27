"use client";

import { DASHBOARD_PREVIEW_SAMPLE_DATES } from "@/constants/dashboard-client-copy";
import { PAID_MONTHLY_SCENE_LIMIT, PAID_MONTHLY_VIDEO_LIMIT } from "@/constants/plan";
import { STARTER_PLAN_DISPLAY } from "@/constants/starter-plan-display";
import { TRIAL_VIDEO_QUOTA_CHANGED_EVENT } from "@/constants/trial";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { isTrialingStatus } from "@/lib/billing-entitlement-client";
import { CheckIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

type Plan = "yearly" | "monthly";

function formatTrialEndLabel(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** Short date for subtitle / dismiss (matches SkipTrialModal tone). */
function formatTrialEndShort(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

function parseUsdAmount(s: string): number {
  const m = s.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** After successful charge (default: dashboard upload). */
  returnTo?: string;
  /**
   * Design/testing: skip entitlement + Stripe; mock date; primary CTA only closes.
   * Use while dashboard “Test UI” preview is active or on static preview pages.
   */
  staticPreview?: boolean;
};

export function StartEarlyModal({
  open,
  onClose,
  returnTo = "/dashboard/upload",
  staticPreview = false,
}: Props) {
  const titleId = useId();
  const safeReturn = returnTo.startsWith("/") ? returnTo : "/dashboard/upload";

  const [plan, setPlan] = useState<Plan>("yearly");
  const [ent, setEnt] = useState<BillingEntitlementPayload | null>(null);
  const [entLoading, setEntLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePct = useMemo(() => {
    const monthly = parseUsdAmount(STARTER_PLAN_DISPLAY.monthly);
    const yearlyTotal = parseUsdAmount(STARTER_PLAN_DISPLAY.yearlyTotal);
    if (monthly <= 0) return 56;
    return Math.round(100 * (1 - yearlyTotal / (monthly * 12)));
  }, []);

  useEffect(() => {
    if (!open) {
      setError(null);
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || staticPreview) return;
    setEntLoading(true);
    void fetch("/api/billing/entitlement", { credentials: "include" })
      .then((r) => r.json())
      .then((d: BillingEntitlementPayload) => setEnt(d))
      .catch(() => setEnt(null))
      .finally(() => setEntLoading(false));
  }, [open, staticPreview]);

  const trialEndLabel = staticPreview
    ? DASHBOARD_PREVIEW_SAMPLE_DATES.trialPlanStart
    : formatTrialEndLabel(ent?.trialEndsAt ?? null);

  const trialEndShort = staticPreview
    ? "Mar 25"
    : formatTrialEndShort(ent?.trialEndsAt ?? null);

  const handleCharge = useCallback(async () => {
    if (staticPreview) {
      onClose();
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/convert-trial-plan", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billing: plan === "monthly" ? "monthly" : "annual",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "Could not start your plan.");
        return;
      }
      if (data.ok) {
        window.dispatchEvent(new CustomEvent(TRIAL_VIDEO_QUOTA_CHANGED_EVENT));
        onClose();
        window.location.assign(safeReturn);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }, [plan, onClose, safeReturn, staticPreview]);

  if (!open) return null;

  const showContent =
    staticPreview || (!entLoading && ent && isTrialingStatus(ent.subscriptionStatus));
  const notTrialing =
    !staticPreview && !entLoading && ent && !isTrialingStatus(ent.subscriptionStatus);
  const entMissing = !staticPreview && !entLoading && !ent;

  const subtitle =
    trialEndShort != null
      ? `Your trial ends ${trialEndShort} — start your plan now. Videos unlock immediately.`
      : "Start your plan now. Videos unlock immediately.";

  const billedLine =
    plan === "yearly"
      ? `Billed as ${STARTER_PLAN_DISPLAY.yearlyTotal}/yr · Cancel anytime`
      : `Billed as ${STARTER_PLAN_DISPLAY.monthly} · Cancel anytime`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 animate-fade-in bg-[#1A0F0C]/55 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        className="animate-scale-in relative flex max-h-[min(92dvh,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] ring-1 ring-[#FF7B5C]/12 shadow-[0_0_0_1px_rgba(255,123,92,0.08),0_32px_64px_-12px_rgba(26,15,12,0.35),0_12px_24px_-8px_rgba(255,123,92,0.14)]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[#FFF8F5]" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#FF7B5C]/25"
          aria-hidden
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-mobile-browser pt-5 sm:px-8 sm:pb-9 sm:pt-7"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="mx-auto mb-6 h-1 w-10 shrink-0 rounded-full bg-[#D4D4D4]" aria-hidden />

            {staticPreview ? (
              <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-[12px] font-semibold text-amber-900/90">
                Static UI preview — no billing check, no charge
              </p>
            ) : null}

            {!staticPreview && entLoading ? (
              <div className="flex items-center justify-center py-16" aria-busy="true">
                <div className="h-10 w-48 animate-pulse rounded-2xl bg-[#F0F0F0]" />
              </div>
            ) : !staticPreview && entMissing ? (
              <div className="pb-4 pt-2 text-center">
                <p className="text-[15px] font-medium leading-snug text-[#6B6B6B]">
                  Couldn&apos;t load your billing status. Try again in a moment.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#1A1A1A] text-base font-bold text-white"
                >
                  Close
                </button>
              </div>
            ) : !staticPreview && notTrialing ? (
              <div className="pb-4 pt-2 text-center">
                <p className="text-[15px] font-medium leading-snug text-[#6B6B6B]">
                  This option is available while you&apos;re on a free trial.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#1A1A1A] text-base font-bold text-white"
                >
                  Close
                </button>
              </div>
            ) : showContent ? (
              <>
                <h2
                  id={titleId}
                  className="mb-2 text-center text-[1.5rem] font-bold leading-[1.2] tracking-tight text-[#1A1A1A] sm:text-[1.75rem]"
                  style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
                >
                  Start your plan early
                </h2>

                <p className="mx-auto mb-6 max-w-md text-center text-[14px] leading-snug text-[#6B6B6B] sm:text-[15px]">
                  {subtitle}
                </p>

                <div className="mx-auto mb-6 max-w-md rounded-[12px] border border-[#E8E4E0] bg-[#FDF8F5] px-4 py-3 text-center text-[14px] font-medium text-[#6B6B6B] sm:text-[15px]">
                  <span aria-hidden>🎬</span> {PAID_MONTHLY_VIDEO_LIMIT} videos ·{" "}
                  <span aria-hidden>✨</span> {PAID_MONTHLY_SCENE_LIMIT} scenes per month
                </div>

                <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPlan("monthly")}
                    className={`relative rounded-2xl border-2 p-3 text-left transition-all sm:p-4 ${
                      plan === "monthly"
                        ? "border-[#1A1A1A] bg-[#FFF8F5] shadow-sm"
                        : "border-[#E8E4E0] bg-[#FDF8F5] hover:border-[#E0D8D0]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                      <div className="min-w-0">
                        <p
                          className={`text-[13px] font-bold sm:text-[15px] ${
                            plan === "monthly" ? "text-[#1A1A1A]" : "text-[#9B9B9B]"
                          }`}
                        >
                          Monthly
                        </p>
                        <p className="mt-0.5 text-[16px] font-bold tabular-nums text-[#1A1A1A] sm:mt-1 sm:text-[18px]">
                          {STARTER_PLAN_DISPLAY.monthly.replace("/mo", "")}
                          <span className="text-[12px] font-semibold text-[#6B6B6B] sm:text-[14px]">/mo</span>
                        </p>
                      </div>
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          plan === "monthly" ? "border-[#1A1A1A] bg-[#1A1A1A]" : "border-[#CCC]"
                        }`}
                      >
                        {plan === "monthly" ? (
                          <CheckIcon size={14} weight="bold" className="text-white" />
                        ) : null}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlan("yearly")}
                    className={`relative rounded-2xl border-2 p-3 pb-4 pt-4 text-left transition-all sm:p-4 sm:pb-5 sm:pt-5 ${
                      plan === "yearly"
                        ? "border-[#FF7B5C] bg-[#FFF0E8] shadow-sm"
                        : "border-[#E8E4E0] bg-[#FDF8F5] hover:border-[#FFD4C4]"
                    }`}
                  >
                    <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#FF7B5C] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:-top-2.5 sm:px-2.5 sm:text-[10px]">
                      SAVE {savePct}%
                    </span>
                    <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                      <div className="min-w-0">
                        <p
                          className={`text-[13px] font-bold sm:text-[15px] ${
                            plan === "yearly" ? "text-[#FF7B5C]" : "text-[#9B9B9B]"
                          }`}
                        >
                          Yearly
                        </p>
                        <p className="mt-0.5 text-[16px] font-bold tabular-nums text-[#1A1A1A] sm:mt-1 sm:text-[18px]">
                          {STARTER_PLAN_DISPLAY.yearlyEquivalent.replace("/mo", "")}
                          <span className="text-[12px] font-semibold text-[#6B6B6B] sm:text-[14px]">/mo</span>
                        </p>
                      </div>
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          plan === "yearly" ? "border-[#FF7B5C] bg-[#FF7B5C]" : "border-[#CCC]"
                        }`}
                      >
                        {plan === "yearly" ? (
                          <CheckIcon size={14} weight="bold" className="text-white" />
                        ) : null}
                      </span>
                    </div>
                  </button>
                </div>

                <p className="mb-4 text-center text-[11px] leading-relaxed text-[#9B9B9B]">
                  Upgrades immediately · Renewal date stays the same · Cancel anytime
                </p>

                {error ? (
                  <p
                    className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-800"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={busy && !staticPreview}
                  onClick={() => void handleCharge()}
                  className="flex h-14 w-full items-center justify-center rounded-full bg-[#FF7B5C] text-base font-bold text-white shadow-[0_4px_14px_-4px_rgba(255,123,92,0.5)] transition active:scale-[0.98] disabled:opacity-60"
                  aria-label={staticPreview ? "Close preview (no charge)" : undefined}
                >
                  {busy && !staticPreview ? "Processing…" : "Unlock my credits now"}
                </button>

                <p className="mt-3 text-center text-[12px] leading-relaxed text-[#9B9B9B] sm:text-[13px]">
                  {billedLine}
                </p>

                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  className="mt-4 w-full py-2 text-center text-[14px] font-semibold text-[#6B6B6B] transition hover:text-[#1A1A1A] disabled:opacity-50"
                >
                  {trialEndShort != null ? (
                    <>No thanks, I&apos;ll wait until {trialEndShort}</>
                  ) : trialEndLabel ? (
                    <>No thanks, I&apos;ll wait until {trialEndLabel}</>
                  ) : (
                    <>No thanks, I&apos;ll wait</>
                  )}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
