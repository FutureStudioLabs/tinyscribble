"use client";

import {
  ArrowLeftIcon,
  BellIcon,
  CheckIcon,
  CrownIcon,
  LockOpenIcon,
} from "@phosphor-icons/react";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { PaywallPrimaryButton } from "@/components/paywall/PaywallPrimaryButton";
import {
  PAYWALL_EXIT_OFFER_IDLE_MS,
  paywallExitPath,
} from "@/lib/paywall-exit-offer";
import { openStripeBillingPortal } from "@/lib/open-stripe-billing-portal-client";
import { createClient } from "@/lib/supabase/client";
import { startStripeCheckout } from "@/lib/start-stripe-checkout-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

type Plan = "monthly" | "yearly";

/** Keep amounts aligned with `src/constants/starter-plan-display.ts` (Skip Trial modal). */
const COPY = {
  monthly: { label: "Monthly", display: "$8.99", suffix: "/mo", stripeNote: "$8.99 per month" },
  yearly: {
    label: "Yearly",
    display: "$3.99",
    suffix: "/mo",
    stripeNote: "$47.99 per year ($3.99/mo)",
  },
} as const;

export function TrialPaywallScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("next") ?? "";
  const mainRef = useRef<HTMLElement | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [plan, setPlan] = useState<Plan>("yearly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState("");
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const restoreModalOpenRef = useRef(false);
  const restoreHeadingId = useId();
  const restoreDescId = useId();

  /** Set after mount so server HTML matches first client paint (avoids TZ hydration mismatch). */
  const [billingDateLabel, setBillingDateLabel] = useState("");
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setBillingDateLabel(
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );
  }, []);

  const footerLine =
    plan === "yearly"
      ? `3 days free, then ${COPY.yearly.stripeNote}`
      : `3 days free, then ${COPY.monthly.stripeNote}`;

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setRestoreEmail(user.email);
    });
  }, []);

  async function handleRestoreContinue() {
    setRestoreError(null);
    setRestoreLoading(true);
    try {
      await openStripeBillingPortal(restoreEmail.trim());
    } catch (err) {
      setRestoreError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setRestoreLoading(false);
    }
  }

  async function handleStartTrial() {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const product =
        plan === "monthly" ? "starter_monthly" : "starter_annual";
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await startStripeCheckout(product, {
        ...(user?.id ? { supabaseUserId: user.id } : {}),
        ...(returnTo.startsWith("/") ? { returnTo } : {}),
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      setCheckoutError(message);
      setCheckoutLoading(false);
    }
  }

  const scheduleIdleExitOffer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (restoreModalOpenRef.current) return;
      router.push(paywallExitPath("idle"));
    }, PAYWALL_EXIT_OFFER_IDLE_MS);
  }, [router]);

  useEffect(() => {
    restoreModalOpenRef.current = restoreOpen;
    if (restoreOpen) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    } else {
      scheduleIdleExitOffer();
    }
  }, [restoreOpen, scheduleIdleExitOffer]);

  useEffect(() => {
    scheduleIdleExitOffer();

    const onActivity = () => {
      scheduleIdleExitOffer();
    };

    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity, { passive: true });

    const mainEl = mainRef.current;
    mainEl?.addEventListener("scroll", onActivity, { passive: true });

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      mainEl?.removeEventListener("scroll", onActivity);
    };
  }, [scheduleIdleExitOffer]);

  return (
    <div
      className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-white text-[#1A1A1A]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between px-4 pb-1.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          href={paywallExitPath("back")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-[#1A1A1A] transition-colors hover:bg-black/5"
          aria-label="Back — see special offer"
        >
          <ArrowLeftIcon size={24} weight="bold" />
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-[15px] font-semibold text-[#1A1A1A] underline decoration-[#1A1A1A]/30 underline-offset-2"
            onClick={() => {
              setRestoreError(null);
              setRestoreOpen(true);
            }}
          >
            Restore
          </button>
          <HeaderUserAvatar />
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
        <main
          ref={mainRef}
          className="min-h-0 flex-1 overflow-y-auto px-5"
        >
        <h1
          className="mb-5 text-center text-[19px] font-bold leading-tight sm:mb-6 sm:text-[21px]"
          style={{ fontFamily: "var(--font-fredoka)" }}
        >
          Start your 3-day FREE trial.
        </h1>

        {/* Timeline — solid orange → orange → black circles; peach bars; gray tail (matches reference) */}
        <div className="mb-5 px-2 sm:mb-6 sm:px-3">
          <ul className="flex flex-col">
            <li className="flex gap-3">
              <div className="flex w-9 shrink-0 flex-col items-center">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF7B5C]"
                  aria-hidden
                >
                  <LockOpenIcon size={18} weight="regular" className="text-white" />
                </div>
                <div
                  className="mt-0 h-8 w-[10px] shrink-0 rounded-none bg-[#EDD5C8]"
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1 pb-2 pt-0.5">
                <p className="text-[14px] font-bold leading-tight">Today</p>
                <p className="mt-0.5 text-[13px] leading-snug text-[#6B6B6B]">
                  Unlock video creation and everything TinyScribble offers for your family.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex w-9 shrink-0 flex-col items-center">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF7B5C]"
                  aria-hidden
                >
                  <BellIcon size={18} weight="regular" className="text-white" />
                </div>
                <div
                  className="mt-0 h-8 w-[10px] shrink-0 rounded-none bg-[#EDD5C8]"
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1 pb-2 pt-0.5">
                <p className="text-[14px] font-bold leading-tight">In 2 days — Reminder</p>
                <p className="mt-0.5 text-[13px] leading-snug text-[#6B6B6B]">
                  We&apos;ll email you that your trial is ending soon — cancel anytime before then.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex w-9 shrink-0 flex-col items-center">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A]"
                  aria-hidden
                >
                  <CrownIcon size={18} weight="regular" className="text-white" />
                </div>
                <div
                  className="mt-0 h-5 w-[10px] shrink-0 rounded-b-md bg-[#C4C4C4]"
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[14px] font-bold leading-tight">In 3 days — Billing starts</p>
                <p className="mt-0.5 text-[13px] leading-snug text-[#6B6B6B]">
                  You&apos;ll be charged on {billingDateLabel || "—"} unless you cancel anytime before.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Plan cards */}
        <div
          className="mb-2.5 flex w-full items-center gap-2.5 rounded-2xl bg-[#EFEFEF] px-3.5 py-2.5 sm:mb-3 sm:gap-3 sm:px-4 sm:py-3"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <span className="shrink-0 text-[1.125rem] leading-none sm:text-xl" aria-hidden>
            🎬
          </span>
          <p className="min-w-0 flex-1 text-left text-[13px] font-semibold leading-snug text-[#2C2C2C] sm:text-[14px]">
            3 videos and 20 scenes per month
          </p>
        </div>
        <div className="mb-2 grid grid-cols-2 gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            className={`relative rounded-2xl p-3 text-left transition-all sm:rounded-[1.125rem] sm:p-3.5 ${
              plan === "monthly"
                ? "border-[3px] border-[#E68A6C] bg-[#FDF0E9] shadow-none"
                : "border-2 border-[#E8E8E8] bg-white hover:border-[#D0D0D0]"
            }`}
          >
            <div className="flex items-start justify-between gap-1.5">
              <div>
                <p
                  className={`text-[13px] font-bold sm:text-[14px] ${
                    plan === "monthly" ? "text-[#4A4A4A]" : "text-[#1A1A1A]"
                  }`}
                >
                  {COPY.monthly.label}
                </p>
                <p className="mt-0.5 text-[16px] font-bold text-[#1A1A1A] sm:text-[17px]">
                  {COPY.monthly.display}
                  <span className="text-[12px] font-semibold text-[#6B6B6B] sm:text-[13px]">
                    {COPY.monthly.suffix}
                  </span>
                </p>
              </div>
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 sm:h-6 sm:w-6 ${
                  plan === "monthly"
                    ? "border-[#E68A6C] bg-[#E68A6C]"
                    : "border-[#CCC] bg-white"
                }`}
              >
                {plan === "monthly" ? (
                  <CheckIcon size={12} weight="bold" className="text-white" />
                ) : null}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPlan("yearly")}
            className={`relative rounded-2xl p-3 pb-4 text-left transition-all sm:rounded-[1.125rem] sm:p-3.5 sm:pb-4 ${
              plan === "yearly"
                ? "border-[3px] border-[#E68A6C] bg-[#FDF0E9] shadow-none"
                : "border-2 border-[#E8E8E8] bg-white hover:border-[#D0D0D0]"
            }`}
          >
            <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#E68A6C] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:-top-2.5 sm:px-2.5 sm:py-1 sm:text-[10px]">
              SAVE 56%
            </span>
            <div className="flex items-start justify-between gap-1.5">
              <div>
                <p
                  className={`text-[13px] font-bold sm:text-[14px] ${
                    plan === "yearly" ? "text-[#4A4A4A]" : "text-[#1A1A1A]"
                  }`}
                >
                  {COPY.yearly.label}
                </p>
                <p className="mt-0.5 text-[16px] font-bold text-[#1A1A1A] sm:text-[17px]">
                  {COPY.yearly.display}
                  <span className="text-[12px] font-semibold text-[#6B6B6B] sm:text-[13px]">
                    {COPY.yearly.suffix}
                  </span>
                </p>
              </div>
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 sm:h-6 sm:w-6 ${
                  plan === "yearly"
                    ? "border-[#E68A6C] bg-[#E68A6C]"
                    : "border-[#CCC] bg-white"
                }`}
              >
                {plan === "yearly" ? (
                  <CheckIcon size={12} weight="bold" className="text-white" />
                ) : null}
              </span>
            </div>
          </button>
        </div>

        {/* CTA + pricing note + links — scrolls with page (below plan cards) */}
        <div className="mt-4 w-full border-t border-[#F0F0F0] pt-4 pb-mobile-browser">
          <p
            className="mb-2 text-center text-[14px] font-semibold leading-snug text-[#2E7D32] sm:text-[15px]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            ✓ No Payment Due Now
          </p>
          {checkoutError ? (
            <p
              className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-center text-[12px] font-medium text-red-800 sm:mb-2.5 sm:text-[13px]"
              role="alert"
            >
              {checkoutError}
            </p>
          ) : null}
          <PaywallPrimaryButton
            disabled={checkoutLoading}
            onClick={() => void handleStartTrial()}
            className="mb-2 h-12 min-h-[48px] whitespace-nowrap px-3 text-[13px] sm:mb-2.5 sm:text-[15px]"
          >
            {checkoutLoading ? "Redirecting…" : "Start your 3-day free trial"}
          </PaywallPrimaryButton>
          <p className="mb-2 text-center text-[11px] leading-snug text-[#9B9B9B] sm:mb-2.5 sm:text-[12px]">
            {footerLine}
          </p>
          <p className="text-center text-[11px] text-[#9B9B9B] sm:text-[12px]">
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[#6B6B6B]"
            >
              Terms
            </Link>
            <span className="mx-1">·</span>
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[#6B6B6B]"
            >
              Privacy
            </Link>
          </p>
        </div>
        </main>
      </div>

      {restoreOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !restoreLoading) {
              setRestoreOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={restoreHeadingId}
            aria-describedby={restoreDescId}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={restoreHeadingId}
              className="text-lg font-bold text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-fredoka)" }}
            >
              Restore subscription
            </h2>
            <p
              id={restoreDescId}
              className="mt-2 text-[14px] leading-snug text-[#6B6B6B]"
            >
              Enter the email you used with Stripe. We&apos;ll open your billing
              page so you can manage or restore access.
            </p>
            <label htmlFor="restore-email" className="mt-4 block text-[13px] font-semibold text-[#1A1A1A]">
              Email
            </label>
            <input
              id="restore-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={restoreEmail}
              onChange={(e) => setRestoreEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#E8E8E8] px-4 py-3 text-[16px] outline-none ring-[#FF7B5C] focus:border-[#FF7B5C] focus:ring-2"
              placeholder="you@example.com"
              disabled={restoreLoading}
            />
            {restoreError ? (
              <p className="mt-3 text-[13px] font-medium text-red-700" role="alert">
                {restoreError}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
              <PaywallPrimaryButton
                disabled={restoreLoading}
                onClick={() => void handleRestoreContinue()}
                className="sm:w-auto sm:min-w-[160px]"
              >
                {restoreLoading ? "Opening…" : "Continue"}
              </PaywallPrimaryButton>
              <button
                type="button"
                disabled={restoreLoading}
                onClick={() => setRestoreOpen(false)}
                className="flex h-14 min-h-[56px] w-full items-center justify-center rounded-full border border-[#E0E0E0] text-base font-semibold text-[#1A1A1A] disabled:opacity-60 sm:w-auto sm:min-w-[120px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
