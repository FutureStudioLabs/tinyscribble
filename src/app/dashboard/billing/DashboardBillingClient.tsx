"use client";

import {
  CreditCardIcon,
  FilmStripIcon,
  HourglassIcon,
  SparkleIcon,
  XCircleIcon,
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
import { STARTER_TRIAL_DAYS } from "@/lib/stripe-checkout";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

type Props = {
  email: string;
};

type SubscriptionSummaryData = {
  planTier: "starter" | "family" | "power";
  planLabel: string;
  status: string;
  isTrialing: boolean;
  renewsAtIso: string | null;
  renewalAmountFormatted: string | null;
  renewalIntervalLabel: string | null;
  cancelAtPeriodEnd: boolean;
  accessThroughIso: string | null;
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
  const cancelTitleId = useId();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [ent, setEnt] = useState<BillingEntitlementPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SubscriptionSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelModalError, setCancelModalError] = useState<string | null>(null);
  const [billingNotice, setBillingNotice] = useState<string | null>(null);

  const loadBilling = useCallback(async () => {
    const entRes = await fetch("/api/billing/entitlement", {
      credentials: "include",
    });
    const entData = (await entRes.json()) as BillingEntitlementPayload;
    setEnt(entData);

    const st = entData.subscriptionStatus?.trim().toLowerCase() ?? "";
    const subscribed =
      entData.entitled &&
      st &&
      (isTrialingStatus(entData.subscriptionStatus) ||
        isPaidSubscriptionStatus(entData.subscriptionStatus));

    if (subscribed) {
      setSummaryLoading(true);
      try {
        const sumRes = await fetch("/api/billing/subscription-summary", {
          credentials: "include",
        });
        const sumData = (await sumRes.json()) as {
          ok?: boolean;
          planLabel?: string;
        } & Record<string, unknown>;
        if (sumRes.ok && sumData.ok === true) {
          setSummary({
            planTier: sumData.planTier as SubscriptionSummaryData["planTier"],
            planLabel: String(sumData.planLabel ?? ""),
            status: String(sumData.status ?? ""),
            isTrialing: Boolean(sumData.isTrialing),
            renewsAtIso:
              typeof sumData.renewsAtIso === "string" ? sumData.renewsAtIso : null,
            renewalAmountFormatted:
              typeof sumData.renewalAmountFormatted === "string"
                ? sumData.renewalAmountFormatted
                : null,
            renewalIntervalLabel:
              typeof sumData.renewalIntervalLabel === "string"
                ? sumData.renewalIntervalLabel
                : null,
            cancelAtPeriodEnd: Boolean(sumData.cancelAtPeriodEnd),
            accessThroughIso:
              typeof sumData.accessThroughIso === "string"
                ? sumData.accessThroughIso
                : null,
          });
        } else {
          setSummary(null);
        }
      } finally {
        setSummaryLoading(false);
      }
    } else {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadBilling().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadBilling]);

  useEffect(() => {
    if (!cancelOpen) {
      setCancelModalError(null);
      setCancelBusy(false);
    }
  }, [cancelOpen]);

  useEffect(() => {
    if (!cancelOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [cancelOpen]);

  async function handleOpenPaymentUpdate() {
    setPortalError(null);
    setPortalLoading(true);
    try {
      await openStripeBillingPortal(email, { returnPath: "/dashboard/billing" });
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : "Something went wrong.");
      setPortalLoading(false);
    }
  }

  async function handleConfirmCancel() {
    setCancelModalError(null);
    setCancelBusy(true);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
        alreadyScheduled?: boolean;
        endedImmediately?: boolean;
      };

      if (!res.ok) {
        throw new Error(data.error || "Could not cancel subscription.");
      }

      setCancelOpen(false);
      if (data.endedImmediately) {
        setBillingNotice(
          "Your subscription has been canceled. We're sorry to see you go."
        );
      } else if (data.alreadyScheduled) {
        setBillingNotice(
          "Your plan was already set to cancel at the end of the billing period."
        );
      } else {
        setBillingNotice(
          "Cancellation scheduled. You'll keep full access until the end of your current billing period, and you won't be charged again."
        );
      }
      await loadBilling();
    } catch (e) {
      setCancelModalError(
        e instanceof Error ? e.message : "Something went wrong."
      );
    } finally {
      setCancelBusy(false);
    }
  }

  const videoQ = getVideoQuota(ent);
  const imageQ = getImageQuota(ent);
  const trialChargeLabel = formatBillingDate(ent?.trialEndsAt ?? null);
  const periodEndLabel = formatBillingDate(ent?.billingPeriodEndsAt ?? null);
  const nextBillingIso = isTrialingStatus(ent?.subscriptionStatus)
    ? ent?.trialEndsAt ?? ent?.billingPeriodEndsAt ?? null
    : ent?.billingPeriodEndsAt ?? null;
  const nextBillingLabel = formatBillingDate(nextBillingIso);
  const showUsage =
    ent?.entitled &&
    ent.subscriptionStatus &&
    (isTrialingStatus(ent.subscriptionStatus) ||
      isPaidSubscriptionStatus(ent.subscriptionStatus)) &&
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

  const isTrial = isTrialingStatus(ent?.subscriptionStatus);

  const planHeading = summary?.planLabel
    ? summary.planLabel
    : isTrial
      ? `${STARTER_TRIAL_DAYS}-Day Free Trial`
      : planTitle(ent?.planInterval ?? null);

  const planLimitLine = isTrial
    ? `${TRIAL_FREE_VIDEO_LIMIT} video · ${TRIAL_FREE_IMAGE_LIMIT} scenes included on your trial`
    : videoQ && imageQ
      ? `${videoQ.limit} videos · ${imageQ.limit} scenes per billing period`
      : `${PAID_MONTHLY_VIDEO_LIMIT} videos · ${PAID_MONTHLY_SCENE_LIMIT} scenes per billing period`;

  const usageSectionTitle = isTrial ? "Trial allowance" : "This billing period";

  const planDateRowLabel = isTrial ? "Trial ends" : "Renews on";
  const renewsLabel = summary?.renewsAtIso
    ? formatBillingDate(summary.renewsAtIso)
    : nextBillingLabel;

  const amountLine =
    summary?.renewalAmountFormatted &&
    summary.renewalIntervalLabel
      ? `${summary.renewalAmountFormatted} ${summary.renewalIntervalLabel}`
      : summary?.renewalAmountFormatted
        ? summary.renewalAmountFormatted
        : null;

  const showCancelButton =
    showUsage &&
    !summary?.cancelAtPeriodEnd &&
    (isTrialingStatus(ent?.subscriptionStatus) ||
      isPaidSubscriptionStatus(ent?.subscriptionStatus));

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-md flex-1 px-5 pb-12 pt-6">
          <h1
            className="mb-8 text-[28px] font-bold text-[#1A1A1A] sm:text-[32px]"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.15 }}
          >
            Billing
          </h1>

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
                    {planHeading}
                  </h2>
                  <p
                    className="text-xs text-[#6B6B6B]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {isTrial && summary?.planLabel ? (
                      <>
                        {STARTER_TRIAL_DAYS}-day free trial on {summary.planLabel}
                      </>
                    ) : (
                      planLimitLine
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl bg-[#F3F3F3] p-4">
                  <p
                    className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9E9E9E]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {usageSectionTitle}
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
                      ) : isTrial ? (
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
                    {planDateRowLabel}
                  </span>
                  <span
                    className="text-sm font-bold text-[#1A1A1A]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {renewsLabel || "—"}
                  </span>
                </div>
                {!renewsLabel && !summaryLoading ? (
                  <p
                    className="text-xs leading-relaxed text-[#9B9B9B]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    We couldn&apos;t load your renewal date yet. If you just subscribed, wait a
                    moment and refresh.
                  </p>
                ) : null}
              </div>

              {isTrial && trialChargeLabel && !nextBillingIso ? (
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

          {showUsage ? (
            <div className="mb-4 w-full rounded-[1.25rem] border border-[#E8E8E8] bg-white p-6 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0EEEB]">
                  <CreditCardIcon size={24} weight="bold" className="text-[#1A1A1A]" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold text-[#1A1A1A]"
                    style={{ fontFamily: "var(--font-fredoka)" }}
                  >
                    Your subscription
                  </h2>
                  <p className="text-xs text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                    Plan, renewal, and payment
                  </p>
                </div>
              </div>

              {billingNotice ? (
                <div
                  className="mb-4 rounded-xl border border-[#C8E6C9] bg-[#E8F5E9] px-4 py-3 text-sm font-medium text-[#2E7D32]"
                  style={{ fontFamily: "var(--font-body)" }}
                  role="status"
                >
                  {billingNotice}
                </div>
              ) : null}

              {summary?.cancelAtPeriodEnd ? (
                <div
                  className="mb-4 rounded-xl border border-[#FFE0B2] bg-[#FFF8E1] px-4 py-3 text-sm font-medium text-[#E65100]"
                  style={{ fontFamily: "var(--font-body)" }}
                  role="status"
                >
                  Cancellation scheduled. You keep access until{" "}
                  <span className="font-bold">
                    {formatBillingDate(summary.accessThroughIso)}
                  </span>
                  .
                </div>
              ) : null}

              {summaryLoading ? (
                <div className="mb-4 h-24 animate-pulse rounded-xl bg-[#F3F3F3]" />
              ) : summary ? (
                <dl className="mb-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 border-b border-[#F0F0F0] pb-3">
                    <dt
                      className="text-sm text-[#6B6B6B]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Your plan
                    </dt>
                    <dd
                      className="text-right text-sm font-bold text-[#1A1A1A]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {summary.planLabel}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3 border-b border-[#F0F0F0] pb-3">
                    <dt
                      className="text-sm text-[#6B6B6B]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {summary.isTrialing ? "First charge on" : "Renews on"}
                    </dt>
                    <dd
                      className="text-right text-sm font-bold text-[#1A1A1A]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {formatBillingDate(summary.renewsAtIso) || "—"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3 pb-1">
                    <dt
                      className="text-sm text-[#6B6B6B]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {summary.isTrialing ? "Then" : "Renewal amount"}
                    </dt>
                    <dd
                      className="text-right text-sm font-bold text-[#1A1A1A]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {summary.isTrialing && !amountLine ? (
                        <span className="font-medium text-[#6B6B6B]">No charge during trial</span>
                      ) : amountLine ? (
                        amountLine
                      ) : (
                        <span className="font-medium text-[#6B6B6B]">—</span>
                      )}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p
                  className="mb-4 text-sm text-[#6B6B6B]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  We couldn&apos;t load every billing detail yet. Your usage above is still
                  accurate.
                </p>
              )}

              <p
                className="mb-4 text-xs leading-relaxed text-[#9B9B9B]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Renewal amount is your plan&apos;s regular price only (not one-time charges like
                upgrades or proration).
              </p>

              <button
                type="button"
                disabled={portalLoading}
                onClick={() => void handleOpenPaymentUpdate()}
                className="mb-4 w-full text-center text-sm font-semibold text-[#F2855E] underline-offset-2 hover:underline disabled:opacity-50"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {portalLoading ? "Opening…" : "Update payment method"}
              </button>

              {showCancelButton ? (
                <button
                  type="button"
                  onClick={() => {
                    setBillingNotice(null);
                    setCancelOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#E0E0E0] py-3 text-sm font-bold text-[#5C5C5C] transition-colors hover:border-[#BDBDBD] hover:bg-[#FAFAFA]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <XCircleIcon size={20} weight="bold" className="text-[#757575]" />
                  Cancel plan
                </button>
              ) : null}

              {portalError ? (
                <p className="mt-3 text-sm font-medium text-red-700" role="alert">
                  {portalError}
                </p>
              ) : null}
            </div>
          ) : null}

          <p
            className="mt-8 text-center text-xs leading-relaxed text-[#9B9B9B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {isTrialingStatus(ent?.subscriptionStatus) && trialChargeLabel ? (
              <>
                Cancel before {trialChargeLabel} to avoid being charged. Your checkout email{" "}
                <span className="font-semibold text-[#6B6B6B]">{email}</span> must match this
                account.
              </>
            ) : showUsage ? (
              <>
                Questions? Contact us using{" "}
                <span className="font-semibold text-[#6B6B6B]">{email}</span> (same as checkout).
              </>
            ) : (
              <>
                Subscribe with{" "}
                <span className="font-semibold text-[#6B6B6B]">{email}</span> so your account
                stays in sync.
              </>
            )}
          </p>
        </div>
      </div>

      {cancelOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => {
            if (!cancelBusy) setCancelOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={cancelTitleId}
            className="relative w-full max-w-md rounded-[1.25rem] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={cancelTitleId}
              className="mb-3 text-lg font-bold text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-fredoka)" }}
            >
              Cancel subscription?
            </h2>
            <p
              className="mb-6 text-sm leading-relaxed text-[#5C5C5C]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {isTrial ? (
                <>
                  If you cancel, your trial ends and you won&apos;t be charged. You&apos;ll lose
                  access to paid features right away.
                </>
              ) : (
                <>
                  Your plan will stay active until{" "}
                  <span className="font-semibold text-[#1A1A1A]">
                    {formatBillingDate(summary?.renewsAtIso ?? nextBillingIso)}
                  </span>
                  . You won&apos;t be charged again after that.
                </>
              )}
            </p>
            {cancelModalError ? (
              <p className="mb-4 text-sm font-medium text-red-700" role="alert">
                {cancelModalError}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={cancelBusy}
                onClick={() => setCancelOpen(false)}
                className="h-12 rounded-full border-2 border-[#E0E0E0] px-6 text-sm font-bold text-[#1A1A1A] hover:bg-[#FAFAFA] disabled:opacity-50"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Keep plan
              </button>
              <FunnelPrimaryButton
                type="button"
                disabled={cancelBusy}
                onClick={() => void handleConfirmCancel()}
                className="h-12 !bg-[#5C5C5C] hover:!bg-[#424242]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {cancelBusy ? "Working…" : "Yes, cancel"}
              </FunnelPrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
