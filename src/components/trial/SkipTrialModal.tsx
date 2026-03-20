"use client";

import { PaywallPrimaryButton } from "@/components/paywall/PaywallPrimaryButton";
import { STARTER_PLAN_DISPLAY } from "@/constants/starter-plan-display";
import {
  SKIP_TRIAL_DISMISSED_EVENT,
  SKIP_TRIAL_MODAL_DISMISSED_KEY,
  TRIAL_VIDEO_QUOTA_CHANGED_EVENT,
} from "@/constants/trial";
import { createClient } from "@/lib/supabase/client";
import { openStripeBillingPortal } from "@/lib/open-stripe-billing-portal-client";
import { CheckIcon, ShieldCheckIcon, VideoCameraIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

type BillingPlan = "monthly" | "annual";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SkipTrialModal({ open, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [plan, setPlan] = useState<BillingPlan>("annual");

  useEffect(() => {
    if (!open) {
      setPortalError(null);
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

  const handleOpenPortalInstead = useCallback(async () => {
    setPortalError(null);
    setBusy(true);
    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      const email = user?.email?.trim();
      if (!email) {
        setPortalError("Sign in again to open billing.");
        return;
      }
      await openStripeBillingPortal(email, {
        returnPath:
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/dashboard/billing",
      });
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : "Could not open billing.");
    } finally {
      setBusy(false);
    }
  }, []);

  const handleNoThanks = useCallback(() => {
    try {
      localStorage.setItem(SKIP_TRIAL_MODAL_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(SKIP_TRIAL_DISMISSED_EVENT));
    onClose();
  }, [onClose]);

  const primaryLabel =
    plan === "monthly"
      ? `Charge ${STARTER_PLAN_DISPLAY.monthly} and continue`
      : `Charge ${STARTER_PLAN_DISPLAY.yearlyTotal}/yr and continue`;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skip-trial-title"
    >
      <button
        type="button"
        aria-label="No thanks"
        className="absolute inset-0 animate-fade-in bg-[#1A0F0C]/55 backdrop-blur-md"
        onClick={handleNoThanks}
      />

      <div
        className="animate-scale-in relative w-full max-w-2xl overflow-hidden rounded-[1.75rem] shadow-[0_0_0_1px_rgba(26,26,26,0.04),0_32px_64px_-12px_rgba(26,15,12,0.45),0_12px_24px_-8px_rgba(255,123,92,0.12)]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#FFFAF7] via-white to-[#FFF5F0]"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF7B5C]/35 to-transparent"
          aria-hidden
        />

        <div className="relative px-5 pb-8 pt-7 sm:px-8 sm:pb-9 sm:pt-8">
          <div className="mb-5 flex justify-center">
            <div
              className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7B5C] to-[#FF9E6C] shadow-[0_8px_24px_-4px_rgba(255,123,92,0.55)]"
              aria-hidden
            >
              <VideoCameraIcon size={28} weight="fill" className="text-white drop-shadow-sm" />
            </div>
          </div>

          <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9B9B9B]">
            Trial · Video limit
          </p>

          <h2
            id="skip-trial-title"
            className="mb-3 text-center text-[1.5rem] font-bold leading-[1.2] tracking-tight text-[#1A1A1A] sm:text-[1.75rem]"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            Ready for your next animation?
          </h2>

          <p className="mx-auto mb-2 max-w-2xl text-center text-[15px] leading-relaxed text-[#6B6B6B] sm:text-base">
            Your trial included one video. Pick how you&apos;d like to be billed — we&apos;ll end
            the trial and charge your card on file for the plan you choose.
          </p>

          <p className="mx-auto mb-5 text-center text-[13px] leading-snug text-[#9B9B9B]">
            Same Starter pricing as signup · change or cancel anytime in Stripe.
          </p>

          <p className="mb-3 text-center text-[13px] font-semibold uppercase tracking-wide text-[#9B9B9B]">
            Choose billing
          </p>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPlan("monthly")}
              className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                plan === "monthly"
                  ? "border-[#1A1A1A] bg-[#FAFAFA] shadow-sm"
                  : "border-[#E8E8E8] bg-white hover:border-[#D0D0D0]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-bold text-[#1A1A1A]">Monthly</p>
                  <p className="mt-1 text-[18px] font-bold tabular-nums">
                    {STARTER_PLAN_DISPLAY.monthly.replace("/mo", "")}
                    <span className="text-[14px] font-semibold text-[#6B6B6B]">/mo</span>
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
              className={`relative rounded-2xl border-2 p-4 pb-5 text-left transition-all ${
                plan === "annual"
                  ? "border-[#1A1A1A] bg-[#FAFAFA] shadow-sm"
                  : "border-[#E8E8E8] bg-white hover:border-[#D0D0D0]"
              }`}
            >
              <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1A1A1A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Best value
              </span>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-bold text-[#1A1A1A]">Yearly</p>
                  <p className="mt-1 text-[18px] font-bold tabular-nums">
                    {STARTER_PLAN_DISPLAY.yearlyEquivalent.replace("/mo", "")}
                    <span className="text-[14px] font-semibold text-[#6B6B6B]">/mo</span>
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-[#9B9B9B]">
                    {STARTER_PLAN_DISPLAY.yearlyTotal} billed yearly
                  </p>
                </div>
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    plan === "annual" ? "border-[#1A1A1A] bg-[#1A1A1A]" : "border-[#CCC]"
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
            {busy ? "Updating your plan…" : primaryLabel}
          </PaywallPrimaryButton>

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleOpenPortalInstead()}
            className="mt-3 w-full py-2 text-center text-[14px] font-semibold text-[#6B6B6B] underline underline-offset-2 transition-colors hover:text-[#1A1A1A] disabled:opacity-50"
          >
            Open customer portal instead
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={handleNoThanks}
            className="mt-1 w-full py-2 text-center text-[15px] font-semibold text-[#6B6B6B] transition-colors hover:text-[#1A1A1A] disabled:opacity-50"
          >
            No thanks
          </button>

          <div className="mt-6 flex items-start justify-center gap-3 border-t border-[#F0E8E4] pt-5">
            <ShieldCheckIcon
              size={20}
              weight="fill"
              className="mt-0.5 shrink-0 text-[#2E7D32]"
              aria-hidden
            />
            <p className="min-w-0 text-left text-[12px] leading-relaxed text-[#9B9B9B] sm:text-[13px]">
              <span className="font-semibold text-[#6B6B6B]">Stripe</span> handles payment and
              receipts. We never store your card on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
