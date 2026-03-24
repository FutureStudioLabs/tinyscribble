"use client";

import { PaywallPrimaryButton } from "@/components/paywall/PaywallPrimaryButton";
import { PAID_MONTHLY_SCENE_LIMIT, PAID_MONTHLY_VIDEO_LIMIT } from "@/constants/plan";
import { STARTER_PLAN_DISPLAY } from "@/constants/starter-plan-display";
import {
  SKIP_TRIAL_DISMISSED_EVENT,
  SKIP_TRIAL_MODAL_DISMISSED_KEY,
  TRIAL_VIDEO_QUOTA_CHANGED_EVENT,
} from "@/constants/trial";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { CheckIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";

type BillingPlan = "monthly" | "annual";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Kept for API compatibility; copy is unified with the upgrade sheet. */
  variant?: "video" | "image";
};

function parseUsdAmount(s: string): number {
  const m = s.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

function formatTrialEndLabel(iso: string | null): string | null {
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

export function SkipTrialModal({ open, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [plan, setPlan] = useState<BillingPlan>("annual");
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  const savePct = useMemo(() => {
    const monthly = parseUsdAmount(STARTER_PLAN_DISPLAY.monthly);
    const yearlyTotal = parseUsdAmount(STARTER_PLAN_DISPLAY.yearlyTotal);
    if (monthly <= 0) return 56;
    return Math.round(100 * (1 - yearlyTotal / (monthly * 12)));
  }, []);

  useEffect(() => {
    if (!open) {
      setPortalError(null);
      setBusy(false);
      return;
    }
    void fetch("/api/billing/entitlement", { credentials: "include" })
      .then((r) => r.json())
      .then((d: BillingEntitlementPayload) => setTrialEndsAt(d.trialEndsAt ?? null))
      .catch(() => setTrialEndsAt(null));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const trialEndShort = formatTrialEndLabel(trialEndsAt);

  const handleContinueWithPlan = useCallback(async () => {
    setPortalError(null);
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
        setPortalError(data.error || "Could not update your plan.");
        return;
      }
      if (data.ok) {
        window.dispatchEvent(new CustomEvent(TRIAL_VIDEO_QUOTA_CHANGED_EVENT));
        onClose();
        window.location.reload();
      }
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }, [plan, onClose]);

  const handleNoThanks = useCallback(() => {
    try {
      localStorage.setItem(SKIP_TRIAL_MODAL_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(SKIP_TRIAL_DISMISSED_EVENT));
    onClose();
  }, [onClose]);

  if (!open) return null;

  const subtitle =
    trialEndShort != null
      ? `Your trial ends ${trialEndShort} — skip the wait and unlock your credits today.`
      : "Your trial is ending soon — skip the wait and unlock your credits today.";

  const noThanksLine =
    trialEndShort != null
      ? `No thanks, I'll wait until ${trialEndShort}`
      : "No thanks, I'll wait";

  const billedLine =
    plan === "annual"
      ? `Billed as ${STARTER_PLAN_DISPLAY.yearlyTotal}/yr · Cancel anytime`
      : `Billed as ${STARTER_PLAN_DISPLAY.monthly} · Cancel anytime`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skip-trial-title"
    >
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 animate-fade-in bg-[#1A0F0C]/55 backdrop-blur-md"
        onClick={handleNoThanks}
      />

      <div
        className="animate-scale-in relative flex max-h-[min(92dvh,calc(100dvh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] ring-1 ring-[#FF7B5C]/12 shadow-[0_0_0_1px_rgba(255,123,92,0.08),0_32px_64px_-12px_rgba(26,15,12,0.35),0_12px_24px_-8px_rgba(255,123,92,0.14)]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[#FFF8F5]"
          aria-hidden
        />
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

            <h2
              id="skip-trial-title"
              className="mb-2 text-center text-[1.5rem] font-bold leading-[1.2] tracking-tight text-[#1A1A1A] sm:text-[1.75rem]"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
            >
              Ready for more?
            </h2>

            <p className="mx-auto mb-5 max-w-md text-center text-[14px] leading-snug text-[#6B6B6B] sm:text-[15px]">
              {subtitle}
            </p>

            <div className="mx-auto mb-6 max-w-md rounded-[12px] border border-[#E8E4E0] bg-[#FDF8F5] px-4 py-3 text-center text-[14px] font-medium text-[#6B6B6B] sm:text-[15px]">
              <span aria-hidden>🎬</span> {PAID_MONTHLY_VIDEO_LIMIT} videos ·{" "}
              <span aria-hidden>✨</span> {PAID_MONTHLY_SCENE_LIMIT} scenes per month
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-3">
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
                onClick={() => setPlan("annual")}
                className={`relative rounded-2xl border-2 p-3 pb-4 pt-4 text-left transition-all sm:p-4 sm:pb-5 sm:pt-5 ${
                  plan === "annual"
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
                        plan === "annual" ? "text-[#FF7B5C]" : "text-[#9B9B9B]"
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
                      plan === "annual" ? "border-[#FF7B5C] bg-[#FF7B5C]" : "border-[#CCC]"
                    }`}
                  >
                    {plan === "annual" ? (
                      <CheckIcon size={14} weight="bold" className="text-white" />
                    ) : null}
                  </span>
                </div>
              </button>
            </div>

            {portalError ? (
              <p
                className="mb-4 rounded-xl bg-red-50 px-3 py-2.5 text-center text-[13px] font-medium leading-snug text-red-900"
                role="alert"
              >
                {portalError}
              </p>
            ) : null}

            <PaywallPrimaryButton
              disabled={busy}
              onClick={() => void handleContinueWithPlan()}
              className="w-full shadow-[0_2px_0_0_rgba(0,0,0,0.12)]"
            >
              {busy ? "Updating your plan…" : "Unlock my credits now"}
            </PaywallPrimaryButton>

            <p className="mt-3 text-center text-[12px] leading-relaxed text-[#9B9B9B] sm:text-[13px]">
              {billedLine}
            </p>

            <button
              type="button"
              disabled={busy}
              onClick={handleNoThanks}
              className="mt-4 w-full py-2 text-center text-[14px] font-semibold text-[#6B6B6B] transition-colors hover:text-[#1A1A1A] disabled:opacity-50"
            >
              {noThanksLine}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
