"use client";

import { DASHBOARD_PREVIEW_SAMPLE_DATES } from "@/constants/dashboard-client-copy";
import { TRIAL_VIDEO_QUOTA_CHANGED_EVENT } from "@/constants/trial";
import { PAID_MONTHLY_SCENE_LIMIT, PAID_MONTHLY_VIDEO_LIMIT } from "@/constants/plan";
import { STARTER_PLAN_DISPLAY } from "@/constants/starter-plan-display";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { isTrialingStatus } from "@/lib/billing-entitlement-client";
import { useCallback, useEffect, useId, useState } from "react";

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

  const primaryLabel =
    plan === "yearly"
      ? `Charge ${STARTER_PLAN_DISPLAY.yearlyTotal} and start now →`
      : `Charge ${STARTER_PLAN_DISPLAY.monthly} and start now →`;

  if (!open) return null;

  const showContent =
    staticPreview || (!entLoading && ent && isTrialingStatus(ent.subscriptionStatus));
  const notTrialing =
    !staticPreview && !entLoading && ent && !isTrialingStatus(ent.subscriptionStatus);
  const entMissing = !staticPreview && !entLoading && !ent;

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
        className="animate-scale-in relative flex max-h-[min(92dvh,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] shadow-[0_0_0_1px_rgba(26,26,26,0.04),0_32px_64px_-12px_rgba(26,15,12,0.45),0_12px_24px_-8px_rgba(255,123,92,0.12)]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FFFAF7] via-white to-[#FFF5F0]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF7B5C]/35 to-transparent"
          aria-hidden
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-mobile-browser pt-7 sm:px-8 sm:pb-9 sm:pt-8"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="mb-5 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-[#E0E0E0]" aria-hidden />
            </div>

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
                  className="mb-5 text-center text-[1.5rem] font-bold leading-[1.2] tracking-tight text-[#1A1A1A] sm:text-[1.75rem]"
                  style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
                >
                  Start your plan early
                </h2>

                <div className="mb-4 rounded-2xl bg-[#FFF0E8] px-4 py-3.5 text-center">
                  <p className="text-[15px] font-bold leading-snug text-[#C2410C]">
                    {trialEndLabel ? (
                      <>Your plan already renews automatically on {trialEndLabel}.</>
                    ) : (
                      <>Your plan renews automatically when your trial ends.</>
                    )}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#9A3412]">
                    Start early and get access to your credits right now.
                  </p>
                </div>

                <div className="mb-5 rounded-full bg-[#F5F5F5] px-4 py-2.5 text-center text-sm font-medium text-[#555555]">
                  🎬 {PAID_MONTHLY_VIDEO_LIMIT} videos/month · ✨ {PAID_MONTHLY_SCENE_LIMIT}{" "}
                  scenes/month
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlan("yearly")}
                    className={`relative rounded-2xl border-2 p-3 text-left transition-all sm:p-4 ${
                      plan === "yearly"
                        ? "border-[#FF7B5C] bg-[#FFF8F5] shadow-sm"
                        : "border-[#E5E5E5] bg-white hover:border-[#D4D4D4]"
                    }`}
                  >
                    <span className="absolute -top-2 right-2 rounded-full bg-[#1A1A1A] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      Best Value
                    </span>
                    <p className="text-xs font-medium text-[#737373]">Yearly</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-[#1A1A1A]">
                      {STARTER_PLAN_DISPLAY.yearlyEquivalent}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#A3A3A3]">
                      Billed as {STARTER_PLAN_DISPLAY.yearlyTotal}/yr
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlan("monthly")}
                    className={`rounded-2xl border-2 p-3 text-left transition-all sm:p-4 ${
                      plan === "monthly"
                        ? "border-[#FF7B5C] bg-[#FFF8F5] shadow-sm"
                        : "border-[#E5E5E5] bg-white hover:border-[#D4D4D4]"
                    }`}
                  >
                    <p className="text-xs font-medium text-[#737373]">Monthly</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-[#1A1A1A]">
                      {STARTER_PLAN_DISPLAY.monthly}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#A3A3A3]">Billed monthly</p>
                  </button>
                </div>

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
                  {busy && !staticPreview ? "Processing…" : primaryLabel}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  className="mt-4 w-full py-2 text-center text-sm text-[#A3A3A3] transition hover:text-[#737373] disabled:opacity-50"
                >
                  {trialEndLabel ? (
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
