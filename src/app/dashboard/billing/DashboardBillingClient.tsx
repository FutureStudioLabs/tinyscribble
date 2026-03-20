"use client";

import { ArrowLeftIcon, CreditCardIcon, SparkleIcon } from "@phosphor-icons/react";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { openStripeBillingPortal } from "@/lib/open-stripe-billing-portal-client";
import Link from "next/link";
import { useState } from "react";

type Props = {
  email: string;
};

export function DashboardBillingClient({ email }: Props) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  async function handleOpenPortal() {
    setPortalError(null);
    setPortalLoading(true);
    try {
      await openStripeBillingPortal(email, { returnPath: "/dashboard/billing" });
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : "Something went wrong.");
      setPortalLoading(false);
    }
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pb-10 pt-2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-2 flex min-h-[1.5rem] items-center gap-2.5">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6B6B6B] transition-colors hover:bg-black/[0.05] hover:text-[#1A1A1A]"
              aria-label="Back to dashboard"
            >
              <ArrowLeftIcon size={22} weight="bold" aria-hidden />
            </Link>
            <p
              className="text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Billing
            </p>
          </div>
          <h2
            className="mb-2 text-[28px] font-bold text-[#1A1A1A] sm:text-[32px]"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            Subscription &amp; payments
          </h2>
          <p
            className="mb-8 text-sm leading-relaxed text-[#6B6B6B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Start a trial, switch plans, or manage cards and invoices. Stripe handles secure
            checkout; use the portal for everything after you&apos;ve subscribed.
          </p>

          <div className="mb-4 w-full rounded-[1.25rem] border border-white/80 bg-white p-6 shadow-[0_16px_40px_-20px_rgba(255,123,92,0.2)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7B5C] to-[#FF9B7B] shadow-md shadow-[#FF7B5C]/20">
                <SparkleIcon size={24} weight="bold" color="white" />
              </div>
              <div>
                <h3
                  className="text-base font-bold text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-fredoka)" }}
                >
                  Plans &amp; free trial
                </h3>
                <p className="text-xs text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                  Choose monthly or yearly after your 3-day trial.
                </p>
              </div>
            </div>
            <Link
              href="/paywall"
              className="inline-flex h-12 w-full items-center justify-center rounded-full border-2 border-[#1A1A1A] text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
              style={{ fontFamily: "var(--font-body)" }}
            >
              View plans &amp; start trial
            </Link>
          </div>

          <div className="w-full rounded-[1.25rem] border border-[#E8E8E8] bg-white/80 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F0ED]">
                <CreditCardIcon size={24} weight="bold" className="text-[#1A1A1A]" />
              </div>
              <div>
                <h3
                  className="text-base font-bold text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-fredoka)" }}
                >
                  Stripe billing portal
                </h3>
                <p className="text-xs text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                  Signed in as <span className="font-semibold text-[#1A1A1A]">{email}</span>
                </p>
              </div>
            </div>
            <p
              className="mb-4 text-sm leading-relaxed text-[#6B6B6B]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Update payment method, download invoices, or cancel — same email as when you checked
              out on Stripe.
            </p>
            <FunnelPrimaryButton
              type="button"
              disabled={portalLoading}
              onClick={() => void handleOpenPortal()}
              style={{ fontFamily: "var(--font-body)" }}
            >
              {portalLoading ? "Opening portal…" : "Open billing portal"}
            </FunnelPrimaryButton>
            {portalError ? (
              <p className="mt-3 text-sm font-medium text-red-700" role="alert">
                {portalError}
              </p>
            ) : null}
          </div>

          <p
            className="mt-8 text-center text-xs leading-relaxed text-[#9B9B9B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Wrong email on your Stripe account? Use the{" "}
            <Link href="/paywall" className="font-semibold text-[#6B6B6B] underline underline-offset-2">
              paywall
            </Link>{" "}
            “Restore subscription” flow with the email from checkout.
          </p>
        </div>
      </div>
    </main>
  );
}
