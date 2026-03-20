"use client";

import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";
import { CheckCircleIcon, CircleNotchIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [email, setEmail] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [continuePending, setContinuePending] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setLoadError("Missing checkout session. Use the link from your payment confirmation email or start again from the app.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/stripe/checkout-session?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = (await res.json()) as { email?: string | null; error?: string };
        if (!res.ok) {
          if (!cancelled) {
            setLoadError(data.error || "Could not verify your payment.");
          }
          return;
        }
        if (!cancelled) {
          setEmail(data.email ?? null);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Could not verify your payment.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <div
          className="animate-fade-in relative w-full overflow-hidden rounded-[1.75rem] border border-white/90 bg-white px-6 py-10 shadow-[0_24px_64px_-20px_rgba(78,205,196,0.14),0_16px_40px_-24px_rgba(255,123,92,0.1)] ring-1 ring-[#FF7B5C]/[0.08]"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Verifying subscription"
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#4ECDC4]/[0.07] blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#FF9E6C]/[0.09] blur-2xl"
            aria-hidden
          />
          <div className="relative flex flex-col items-center">
            <div className="relative mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center">
              <span
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#4ECDC4]/20 via-white to-[#FF9E6C]/12 ring-1 ring-[#FF7B5C]/10"
                aria-hidden
              />
              <span
                className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#4ECDC4]/15"
                aria-hidden
              />
              <CircleNotchIcon
                className="relative size-9 text-[#FF7B5C] animate-spin"
                weight="bold"
                style={{ animationDuration: "0.85s" }}
                aria-hidden
              />
            </div>
            <p
              className="text-[1.25rem] font-bold leading-tight text-[#1A1A1A] sm:text-[1.35rem]"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.25 }}
            >
              Almost there
            </p>
            <p
              className="mt-3 max-w-[280px] text-sm leading-relaxed text-[#6B6B6B]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              We&apos;re confirming your payment with Stripe — usually just a moment.
            </p>
            <div
              className="mt-6 flex w-full max-w-[220px] flex-col gap-2.5"
              aria-hidden
            >
              <span className="mx-auto h-1.5 w-full overflow-hidden rounded-full bg-[#FFF8F5]">
                <span className="block h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-[#FF7B5C]/25 via-[#4ECDC4]/35 to-[#FF7B5C]/25" />
              </span>
              <span className="mx-auto h-1.5 w-4/5 overflow-hidden rounded-full bg-[#FFF8F5]">
                <span
                  className="block h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#4ECDC4]/20 via-[#FF9E6C]/30 to-[#4ECDC4]/20"
                  style={{ animationDelay: "150ms" }}
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col text-center">
        <p className="text-red-800" role="alert" style={{ fontFamily: "var(--font-body)" }}>
          {loadError}
        </p>
        <div className="mt-auto flex flex-col items-center gap-4 pt-10 pb-2">
          <Link
            href="/login?next=%2Fgenerate"
            className={`${funnelPrimaryButtonClassName} inline-block text-center no-underline`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            Sign in manually
          </Link>
        </div>
      </div>
    );
  }

  const continueHref = sessionId
    ? `/api/auth/complete-checkout?session_id=${encodeURIComponent(sessionId)}`
    : "/login?next=%2Fgenerate";

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col text-center">
      <div
        className="relative overflow-hidden rounded-[1.75rem] border border-white/90 bg-white px-6 py-8 text-center shadow-[0_24px_64px_-20px_rgba(78,205,196,0.18),0_16px_40px_-24px_rgba(255,123,92,0.14)] ring-1 ring-[#FF7B5C]/[0.08]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#4ECDC4]/[0.09] blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-[#FF9E6C]/[0.11] blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <div className="mx-auto mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-gradient-to-br from-[#4ECDC4]/25 via-white to-[#FF9E6C]/15 shadow-inner ring-1 ring-[#4ECDC4]/20">
            <CheckCircleIcon
              className="text-[#2A9D8F] drop-shadow-sm"
              weight="fill"
              size={44}
              aria-hidden
            />
          </div>
          <p
            className="text-[1.35rem] font-bold leading-tight tracking-tight text-[#1A1A1A] sm:text-2xl"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.25 }}
          >
            You&apos;re in — payment received
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#6B6B6B]">
            Next, open your TinyScribble account with the same email you used in Stripe.
          </p>
          {email ? (
            <p className="mt-3">
              <span className="inline-block max-w-full break-all rounded-full bg-[#FFF8F5] px-4 py-2 text-sm font-semibold tracking-tight text-[#1A1A1A] ring-1 ring-[#FF7B5C]/12">
                {email}
              </span>
            </p>
          ) : null}
          <p className="mt-3 text-sm leading-relaxed text-[#6B6B6B]">
            That&apos;s how we know you&apos;re subscribed.
          </p>
        </div>
      </div>

      <div className="mt-auto flex w-full flex-col gap-3 pt-8 pb-2">
        <button
          type="button"
          disabled={continuePending}
          aria-busy={continuePending}
          className={`${funnelPrimaryButtonClassName} w-full text-center disabled:cursor-wait disabled:!opacity-100`}
          style={{ fontFamily: "var(--font-body)" }}
          onClick={() => {
            setContinuePending(true);
            window.location.assign(continueHref);
          }}
        >
          {continuePending ? (
            <>
              <CircleNotchIcon
                className="size-6 shrink-0 animate-spin"
                weight="bold"
                aria-hidden
              />
              <span>One moment…</span>
            </>
          ) : (
            "Continue"
          )}
        </button>
        <p className="text-xs text-[#9B9B9B]">
          We&apos;ll send a 6-digit code to your email to finish signing in — no password.
        </p>
        <p className="text-xs text-[#9B9B9B]">
          <span className="text-[#6B6B6B]">Having trouble? </span>
          <Link
            href={
              email
                ? `/login?next=${encodeURIComponent("/generate")}&email=${encodeURIComponent(email)}`
                : "/login?next=%2Fgenerate"
            }
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            Open the login page
          </Link>
          <span className="text-[#6B6B6B]"> instead.</span>
        </p>
      </div>
    </div>
  );
}
