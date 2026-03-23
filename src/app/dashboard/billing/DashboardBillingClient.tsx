"use client";

import {
  ArrowLeftIcon,
  CreditCardIcon,
  FilmStripIcon,
  HourglassIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { PAID_MONTHLY_SCENE_LIMIT, PAID_MONTHLY_VIDEO_LIMIT } from "@/constants/plan";
import { TRIAL_FREE_IMAGE_LIMIT, TRIAL_FREE_VIDEO_LIMIT } from "@/constants/trial";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import {
  getImageQuota,
  getVideoQuota,
  isPaidSubscriptionStatus,
  isTrialingStatus,
} from "@/lib/billing-entitlement-client";
import { openStripeBillingPortal } from "@/lib/open-stripe-billing-portal-client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  email: string;
};

function formatBillingDate(iso: string | null): string {
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

function planTitle(interval: BillingEntitlementPayload["planInterval"]): string {
  if (interval === "year") return "Starter — Annual";
  if (interval === "month") return "Starter — Monthly";
  return "Starter";
}

export function DashboardBillingClient({ email }: Props) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [ent, setEnt] = useState<BillingEntitlementPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      )
      .finally(() => setLoading(false));
  }, []);

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

  const videoQ = getVideoQuota(ent);
  const imageQ = getImageQuota(ent);
  const trialChargeLabel = formatBillingDate(ent?.trialEndsAt ?? null);
  const periodEndLabel = formatBillingDate(ent?.billingPeriodEndsAt ?? null);
  /** Trial: first charge (trial end), else current period end from Stripe. Paid: renewal = current_period_end. */
  const nextBillingIso = isTrialingStatus(ent?.subscriptionStatus)
    ? ent?.trialEndsAt ?? ent?.billingPeriodEndsAt ?? null
    : ent?.billingPeriodEndsAt ?? null;
  const nextBillingLabel = formatBillingDate(nextBillingIso);
  const showUsage =
    ent?.entitled &&
    ent.subscriptionStatus &&
    (isTrialingStatus(ent.subscriptionStatus) || isPaidSubscriptionStatus(ent.subscriptionStatus)) &&
    videoQ &&
    imageQ;

  const videoLimit = videoQ?.limit ?? 0;
  const videoRemaining = videoQ?.remaining ?? 0;
  const videoUsed = Math.max(0, videoLimit - videoRemaining);
  const videoPct = videoLimit > 0 ? Math.min(100, (videoUsed / videoLimit) * 100) : 0;

  const sceneLimit = imageQ?.limit ?? 0;
  const sceneRemaining = imageQ?.remaining ?? 0;
  const sceneUsed = imageQ?.used ?? Math.max(0, sceneLimit - sceneRemaining);
  const scenePct = sceneLimit > 0 ? Math.min(100, (sceneUsed / sceneLimit) * 100) : 0;

  const planLimitLine = isTrialingStatus(ent?.subscriptionStatus)
    ? `${TRIAL_FREE_VIDEO_LIMIT} videos · ${TRIAL_FREE_IMAGE_LIMIT} scenes/month`
    : `${PAID_MONTHLY_VIDEO_LIMIT} videos · ${PAID_MONTHLY_SCENE_LIMIT} scenes/month`;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-md flex-1 px-5 pb-12 pt-6">
          <div className="mb-2">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-1 py-2 text-sm font-semibold text-[#6B6B6B] -ml-1 transition-colors hover:text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7B5C] focus-visible:ring-offset-2"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <ArrowLeftIcon size={20} weight="bold" className="shrink-0" aria-hidden />
              Back
            </Link>
          </div>

          <h1
            className="mb-2 text-[28px] font-bold text-[#1A1A1A] sm:text-[32px]"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.15 }}
          >
            Billing
          </h1>
          <p
            className="mb-8 text-sm leading-relaxed text-[#6B6B6B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Manage your plan and payments
          </p>

          {loading ? (
            <div className="mb-4 h-48 animate-pulse rounded-[1.25rem] bg-[#EDE8E4]" />
          ) : showUsage ? (
            <div className="mb-4 w-full rounded-[1.25rem] border border-[#E8E8E8] bg-white p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.12)]">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFE8D8]">
                  <SparkleIcon size={24} weight="fill" className="text-[#E8A020]" />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-base font-bold text-[#1A1A1A]"
                    style={{ fontFamily: "var(--font-fredoka)" }}
                  >
                    {planTitle(ent?.planInterval ?? null)}
                  </h2>
                  <p
                    className="text-xs text-[#6B6B6B]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {planLimitLine}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
              <div className="rounded-2xl bg-[#F3F3F3] p-4">
                <p
                  className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9E9E9E]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  This month
                </p>

                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                      <FilmStripIcon size={20} weight="duotone" className="text-[#1A1A1A]" />
                      <span style={{ fontFamily: "var(--font-body)" }}>Videos</span>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        videoRemaining === 0 ? "text-[#E53935]" : "text-[#1A1A1A]"
                      }`}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {videoRemaining} left
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8E8E8]">
                    <div
                      className={`h-full rounded-full transition-[width] ${
                        videoRemaining === 0 ? "bg-[#E53935]" : "bg-[#F2855E]"
                      }`}
                      style={{ width: `${videoPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                      <SparkleIcon size={20} weight="duotone" className="text-[#E8A020]" />
                      <span style={{ fontFamily: "var(--font-body)" }}>Scenes</span>
                    </div>
                    <span
                      className="text-sm font-bold text-[#1A1A1A]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {sceneRemaining} left
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8E8E8]">
                    <div
                      className="h-full rounded-full bg-[#F2855E]"
                      style={{ width: `${scenePct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <p
                    className="text-xs leading-relaxed text-[#9E9E9E]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {periodEndLabel ? (
                      <>Resets {periodEndLabel}</>
                    ) : isTrialingStatus(ent?.subscriptionStatus) ? (
                      <>Resets when your plan starts</>
                    ) : (
                      <>Resets next billing period</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ECECEC] bg-white px-4 py-3.5">
                <span
                  className="text-sm text-[#6B6B6B]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Next billing
                </span>
                <span
                  className="text-sm font-bold text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {nextBillingLabel || "—"}
                </span>
              </div>
              {!nextBillingIso ? (
                <p
                  className="mt-2 text-xs leading-relaxed text-[#9B9B9B]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  We couldn&apos;t load this from Stripe yet. Open{" "}
                  <span className="font-semibold text-[#6B6B6B]">Manage plan &amp; payments</span>{" "}
                  below to see your next invoice, or wait a minute if you just subscribed.
                </p>
              ) : null}
              </div>

              {isTrialingStatus(ent?.subscriptionStatus) && trialChargeLabel && !nextBillingIso ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#FFF5F0] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <HourglassIcon
                      size={22}
                      weight="duotone"
                      className="shrink-0 text-[#C17A4A]"
                    />
                    <span
                      className="text-sm font-medium text-[#A85C3A]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      No charge until
                    </span>
                  </div>
                  <span
                    className="shrink-0 text-sm font-bold text-[#7A3E22]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {trialChargeLabel}
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mb-4 w-full rounded-[1.25rem] border border-[#E8E8E8] bg-white p-6 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFE8D8]">
                  <SparkleIcon size={24} weight="fill" className="text-[#E8A020]" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold text-[#1A1A1A]"
                    style={{ fontFamily: "var(--font-fredoka)" }}
                  >
                    Starter plan
                  </h2>
                  <p className="text-xs text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                    Subscribe to unlock uploads and video.
                  </p>
                </div>
              </div>
              <Link
                href="/paywall?next=/dashboard/billing"
                className="inline-flex h-12 w-full items-center justify-center rounded-full border-2 border-[#1A1A1A] text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
                style={{ fontFamily: "var(--font-body)" }}
              >
                View plans &amp; pricing
              </Link>
            </div>
          )}

          <div className="w-full rounded-[1.25rem] border border-[#E8E8E8] bg-white p-6 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0EEEB]">
                <CreditCardIcon size={24} weight="bold" className="text-[#1A1A1A]" />
              </div>
              <div>
                <h2
                  className="text-base font-bold text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-fredoka)" }}
                >
                  Payment &amp; invoices
                </h2>
                <p className="text-xs text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                  Update card, download invoices, cancel plan
                </p>
              </div>
            </div>
            <FunnelPrimaryButton
              type="button"
              disabled={portalLoading}
              onClick={() => void handleOpenPortal()}
              className="w-full !bg-[#F2855E] hover:!bg-[#E07850]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {portalLoading ? "Opening…" : "Manage plan & payments"}
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
            {isTrialingStatus(ent?.subscriptionStatus) && trialChargeLabel ? (
              <>
                To cancel, tap &apos;Manage plan &amp; payments&apos; above and cancel before{" "}
                {trialChargeLabel}. You won&apos;t be charged.
              </>
            ) : (
              <>
                Cancel anytime from the portal above. Questions?{" "}
                <span className="font-semibold text-[#6B6B6B]">{email}</span> must match your
                checkout email.
              </>
            )}
          </p>

          <p
            className="mt-4 text-center text-xs leading-relaxed text-[#9B9B9B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Wrong email on Stripe?{" "}
            <Link href="/paywall" className="font-semibold text-[#6B6B6B] underline underline-offset-2">
              Paywall
            </Link>{" "}
            → Restore subscription.
          </p>
        </div>
      </div>
    </main>
  );
}
