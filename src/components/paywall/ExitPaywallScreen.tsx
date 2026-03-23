"use client";

import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { PaywallPrimaryButton } from "@/components/paywall/PaywallPrimaryButton";
import { GiftIcon, XIcon } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { startStripeCheckout } from "@/lib/start-stripe-checkout-client";
import Link from "next/link";
import { useState } from "react";

/**
 * Exit-intent / one-time offer surface (Cal AI–style).
 * Pricing matches TinyScribble Starter exit annual: $35.99/yr → ~$2.99/mo display.
 */
export function ExitPaywallScreen() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleClaim() {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await startStripeCheckout(
        "starter_exit_annual",
        user?.id ? { supabaseUserId: user.id } : undefined
      );
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      setCheckoutError(message);
      setCheckoutLoading(false);
    }
  }

  return (
    <div
      className="relative flex h-[100dvh] min-h-[100dvh] flex-col bg-[#F5F5F5] text-[#1A1A1A]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Soft confetti-like dots */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.35]"
        aria-hidden
      >
        <div className="absolute left-[8%] top-[12%] h-1.5 w-1.5 rounded-full bg-[#FF7B5C]" />
        <div className="absolute left-[22%] top-[8%] h-1 w-1 rounded-full bg-[#4ECDC4]" />
        <div className="absolute right-[15%] top-[18%] h-2 w-2 rounded-full bg-[#FF9E6C]/80" />
        <div className="absolute right-[28%] top-[10%] h-1 w-1 rounded-full bg-[#FF7B5C]" />
        <div className="absolute left-[12%] top-[28%] h-1 w-1 rounded-full bg-[#9B9B9B]" />
        <div className="absolute right-[8%] top-[32%] h-1.5 w-1.5 rounded-full bg-[#4ECDC4]/70" />
      </div>

      <header className="flex shrink-0 items-center justify-end gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <HeaderUserAvatar />
        <Link
          href="/generate"
          className="flex h-11 w-11 items-center justify-center rounded-full text-[#1A1A1A] transition-colors hover:bg-black/5"
          aria-label="Return to my image"
        >
          <XIcon size={26} weight="bold" />
        </Link>
      </header>

      <div className="relative z-[1] mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-mobile-browser pt-4">
          <h1
            className="mb-2 text-center text-[28px] font-bold leading-tight sm:text-[32px]"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            One time offer
          </h1>
          <p className="mb-8 text-center text-[15px] text-[#6B6B6B]">
            You won&apos;t see this price again.
          </p>

          {/* Offer card (gift card) — pricing + CTA + links */}
          <div className="overflow-hidden rounded-[20px] border border-white/80 bg-gradient-to-b from-white via-[#F0F4FF] to-[#E8EEF8] p-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]">
            <div className="mb-6 flex justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md ring-4 ring-white/60">
                <GiftIcon size={32} weight="duotone" className="text-[#FF7B5C]" />
              </span>
            </div>
            <p className="mb-2 text-center text-[16px] font-semibold text-[#1A1A1A]">
              Here&apos;s an{" "}
              <span className="inline-block rounded-full bg-[#1A1A1A] px-2.5 py-0.5 text-[13px] font-bold text-white">
                extra savings
              </span>{" "}
              offer
            </p>
            <p className="mb-1 text-center text-[32px] font-bold tracking-tight sm:text-[36px]">
              Only $2.99<span className="text-[18px] font-bold text-[#6B6B6B]">/mo</span>
            </p>
            <p className="mb-4 text-center text-[13px] font-medium text-[#9B9B9B]">
              $35.99/year — lowest price we offer
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
              onClick={() => void handleClaim()}
              className="mb-4"
            >
              {checkoutLoading ? "Redirecting…" : "Claim your limited offer now!"}
            </PaywallPrimaryButton>
            <p className="text-center text-[12px] leading-relaxed text-[#9B9B9B]">
              <Link href="/paywall" className="underline underline-offset-2 hover:text-[#6B6B6B]">
                Back to trial screen
              </Link>
              <span className="mx-2 text-[#DDD]">·</span>
              <Link href="/generate" className="underline underline-offset-2 hover:text-[#6B6B6B]">
                Return to my image
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
