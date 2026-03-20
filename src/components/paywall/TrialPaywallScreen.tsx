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
  useMemo,
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
    sub: "$47.99 billed yearly",
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

  const billingDateLabel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
      className="flex h-[100vh] min-h-[100vh] flex-col bg-white text-[#1A1A1A]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
          className="min-h-0 flex-1 overflow-y-auto px-5 pb-4"
        >
        <h1
          className="mb-8 text-center text-[22px] font-bold leading-tight sm:text-[24px]"
          style={{ fontFamily: "var(--font-fredoka)" }}
        >
          <span className="block">Start your 3-day</span>
          <span className="mt-0.5 block">FREE trial to continue.</span>
        </h1>

        {/* Timeline — solid orange → orange → black circles; peach bars; gray tail (matches reference) */}
        <div className="mb-8 px-3 sm:px-4">
          <ul className="flex flex-col">
            <li className="flex gap-4">
              <div className="flex w-11 shrink-0 flex-col items-center">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF7B5C]"
                  aria-hidden
                >
                  <LockOpenIcon size={22} weight="regular" className="text-white" />
                </div>
                <div
                  className="mt-0 h-12 w-[12px] shrink-0 rounded-none bg-[#EDD5C8]"
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1 pb-3 pt-1.5">
                <p className="text-[15px] font-bold">Today</p>
                <p className="mt-0.5 text-[14px] leading-snug text-[#6B6B6B]">
                  Unlock video creation and everything TinyScribble offers for your family.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex w-11 shrink-0 flex-col items-center">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF7B5C]"
                  aria-hidden
                >
                  <BellIcon size={22} weight="regular" className="text-white" />
                </div>
                <div
                  className="mt-0 h-12 w-[12px] shrink-0 rounded-none bg-[#EDD5C8]"
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1 pb-3 pt-1.5">
                <p className="text-[15px] font-bold">In 2 days — Reminder</p>
                <p className="mt-0.5 text-[14px] leading-snug text-[#6B6B6B]">
                  We&apos;ll email you that your trial is ending soon — cancel anytime before then.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex w-11 shrink-0 flex-col items-center">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A]"
                  aria-hidden
                >
                  <CrownIcon size={22} weight="regular" className="text-white" />
                </div>
                <div
                  className="mt-0 h-7 w-[12px] shrink-0 rounded-b-lg bg-[#C4C4C4]"
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1 pt-1.5">
                <p className="text-[15px] font-bold">In 3 days — Billing starts</p>
                <p className="mt-0.5 text-[14px] leading-snug text-[#6B6B6B]">
                  You&apos;ll be charged on {billingDateLabel} unless you cancel anytime before.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Plan cards */}
        <p className="mb-3 text-center text-[13px] font-semibold uppercase tracking-wide text-[#9B9B9B]">
          Choose your plan
        </p>
        <div className="mb-4 grid grid-cols-2 gap-3">
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
                <p className="text-[15px] font-bold">{COPY.monthly.label}</p>
                <p className="mt-1 text-[18px] font-bold">
                  {COPY.monthly.display}
                  <span className="text-[14px] font-semibold text-[#6B6B6B]">
                    {COPY.monthly.suffix}
                  </span>
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
            className={`relative rounded-2xl border-2 p-4 pb-5 text-left transition-all ${
              plan === "yearly"
                ? "border-[#1A1A1A] bg-[#FAFAFA] shadow-sm"
                : "border-[#E8E8E8] bg-white hover:border-[#D0D0D0]"
            }`}
          >
            <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1A1A1A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              3 days free
            </span>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[15px] font-bold">{COPY.yearly.label}</p>
                <p className="mt-1 text-[18px] font-bold">
                  {COPY.yearly.display}
                  <span className="text-[14px] font-semibold text-[#6B6B6B]">
                    {COPY.yearly.suffix}
                  </span>
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#9B9B9B]">{COPY.yearly.sub}</p>
              </div>
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  plan === "yearly" ? "border-[#1A1A1A] bg-[#1A1A1A]" : "border-[#CCC]"
                }`}
              >
                {plan === "yearly" ? (
                  <CheckIcon size={14} weight="bold" className="text-white" />
                ) : null}
              </span>
            </div>
          </button>
        </div>
        </main>

        {/* Pinned bottom: CTA + legal (matches app flow pages) */}
        <div className="shrink-0 border-t border-[#F0F0F0] px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="mb-3 text-center text-[15px] font-semibold text-[#2E7D32]">
            ✓ No Payment Due Now
          </p>
          {checkoutError ? (
            <p
              className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-center text-[13px] font-medium text-red-800"
              role="alert"
            >
              {checkoutError}
            </p>
          ) : null}
          <PaywallPrimaryButton
            disabled={checkoutLoading}
            onClick={() => void handleStartTrial()}
            className="mb-3"
          >
            {checkoutLoading ? "Redirecting…" : "Start My 3-Day Free Trial"}
          </PaywallPrimaryButton>
          <p className="mb-4 text-center text-[12px] leading-relaxed text-[#9B9B9B]">{footerLine}</p>
          <p className="text-center text-[12px] text-[#9B9B9B]">
            <Link href="/terms" className="underline underline-offset-2 hover:text-[#6B6B6B]">
              Terms
            </Link>
            <span className="mx-1">·</span>
            <Link href="/privacy" className="underline underline-offset-2 hover:text-[#6B6B6B]">
              Privacy
            </Link>
          </p>
        </div>
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
