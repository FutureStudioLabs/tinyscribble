"use client";

import { LockIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ErrorStateIcon } from "@/components/ErrorStateIcon";
import { SupportContact } from "@/components/SupportContact";
import { DashboardUploadLegal } from "@/components/dashboard/DashboardUploadLegal";
import { FunnelBottomDock } from "@/components/funnel/FunnelBottomDock";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";
import {
  DASHBOARD_COPY,
  DASHBOARD_PAYWALL_UPLOAD_HREF,
  uploadVideoPausedSubline,
} from "@/constants/dashboard-client-copy";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import {
  getCreditsResetAt,
  getImageQuota,
  getVideoQuota,
  isPaidSubscriptionStatus,
  isTrialingStatus,
} from "@/lib/billing-entitlement-client";
import { useDashboardShellModalsOptional } from "@/components/dashboard/dashboard-shell-modals-context";
import { setPendingUpload } from "@/lib/upload-store";
import { useRouter, useSearchParams } from "next/navigation";

function formatPlanStartDate(iso: string | null): string {
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

function isFullyExhausted(ent: BillingEntitlementPayload | null): boolean {
  if (!ent?.entitled) return false;
  if (!isTrialingStatus(ent.subscriptionStatus) && !isPaidSubscriptionStatus(ent.subscriptionStatus)) {
    return false;
  }
  const v = getVideoQuota(ent);
  const i = getImageQuota(ent);
  if (!v || !i) return false;
  return v.remaining === 0 && i.remaining === 0;
}

/** Option 5: video quota exhausted, scene uploads still allowed. */
function isVideoExhaustedScenesRemaining(ent: BillingEntitlementPayload | null): boolean {
  if (!ent?.entitled) return false;
  if (!isTrialingStatus(ent.subscriptionStatus) && !isPaidSubscriptionStatus(ent.subscriptionStatus)) {
    return false;
  }
  const v = getVideoQuota(ent);
  const i = getImageQuota(ent);
  if (!v || !i) return false;
  return v.remaining === 0 && i.remaining > 0;
}

/** Option 6: scenes exhausted, video credits left — gallery path. */
function isScenesExhaustedVideoRemaining(ent: BillingEntitlementPayload | null): boolean {
  if (!ent?.entitled) return false;
  if (!isTrialingStatus(ent.subscriptionStatus) && !isPaidSubscriptionStatus(ent.subscriptionStatus)) {
    return false;
  }
  const v = getVideoQuota(ent);
  const i = getImageQuota(ent);
  if (!v || !i) return false;
  return v.remaining > 0 && i.remaining === 0;
}

export function DashboardUploadClient() {
  const shellModals = useDashboardShellModalsOptional();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<BillingEntitlementPayload | null>(null);
  const [entitlementLoading, setEntitlementLoading] = useState(true);

  /** Gallery “New scene” / deep link: land on upload first, then open system picker (iOS-friendly). */
  useEffect(() => {
    if (searchParams.get("pick") !== "1") return;
    if (entitlementLoading) return;

    let cancelled = false;
    const stripPickParam = () => {
      router.replace("/dashboard/upload", { scroll: false });
    };

    const tryOpen = () => {
      if (cancelled) return;
      const el = inputRef.current;
      if (el) {
        el.click();
        stripPickParam();
        return;
      }
      window.setTimeout(() => {
        if (cancelled) return;
        if (inputRef.current) {
          inputRef.current.click();
        }
        stripPickParam();
      }, 120);
    };

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(tryOpen);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [searchParams, router, entitlementLoading]);

  useEffect(() => {
    void fetch("/api/billing/entitlement", { credentials: "include" })
      .then((r) => r.json())
      .then((d: BillingEntitlementPayload) => setEntitlement(d))
      .catch(() =>
        setEntitlement({
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
      .finally(() => setEntitlementLoading(false));
  }, []);

  const handleClick = () => {
    setError(null);
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }
    setError(null);
    setPendingUpload(file);
    setIsUploading(true);
    router.replace("/loading");
    e.target.value = "";
  };

  const planDateLabel = formatPlanStartDate(getCreditsResetAt(entitlement) ?? null);
  const showTrialExhausted =
    !entitlementLoading &&
    isFullyExhausted(entitlement) &&
    isTrialingStatus(entitlement?.subscriptionStatus);
  const showPaidExhausted =
    !entitlementLoading &&
    isFullyExhausted(entitlement) &&
    isPaidSubscriptionStatus(entitlement?.subscriptionStatus);
  const showNoScenesVideoLeft =
    !entitlementLoading && isScenesExhaustedVideoRemaining(entitlement);
  const showVideoPausedScenes =
    !entitlementLoading && isVideoExhaustedScenesRemaining(entitlement);
  const scenesRemaining = getImageQuota(entitlement)?.remaining ?? 0;

  if (entitlementLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-md flex-1 animate-pulse rounded-2xl bg-[#F5F0EC]/90 py-24" />
      </div>
    );
  }

  const showNoPlan =
    entitlement?.authenticated === true && entitlement.entitled === false;

  if (showNoPlan) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex w-full min-w-0 max-w-none flex-col gap-4 py-2">
            <h2
              className="text-left text-xl font-bold text-[#1A1A1A] sm:text-2xl"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
            >
              {DASHBOARD_COPY.upload.headline}
            </h2>

            <div className="rounded-2xl border border-[#FFD4C4] bg-[#FFF5F0] px-5 py-10 text-center">
              <LockIcon
                size={56}
                weight="duotone"
                className="mx-auto mb-5 text-[#E85A3C]/90"
                aria-hidden
              />
              <h3
                className="mb-2 text-lg font-bold text-[#1A1A1A]"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                {DASHBOARD_COPY.upload.noPlan.headline}
              </h3>
              <p
                className="text-sm leading-relaxed text-[#6B6B6B]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {DASHBOARD_COPY.upload.noPlan.body}
              </p>
            </div>
          </div>

          <FunnelBottomDock tone="none">
            <Link
              href={DASHBOARD_PAYWALL_UPLOAD_HREF}
              className={`${funnelPrimaryButtonClassName} block w-full text-center no-underline`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              {DASHBOARD_COPY.upload.noPlan.cta}
            </Link>
          </FunnelBottomDock>
        </div>
      </div>
    );
  }

  if (showTrialExhausted) {
    const trialResetLabel = formatPlanStartDate(entitlement?.trialEndsAt ?? null);
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex w-full min-w-0 max-w-none flex-col gap-4 py-2">
            {trialResetLabel ? (
              <div className="rounded-2xl border border-[#FFD4C4] bg-[#FFF5F0] px-4 py-3.5">
                <p
                  className="text-center text-[15px] font-bold leading-snug text-[#E85A3C] sm:text-left"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {DASHBOARD_COPY.upload.trialExhausted.planStartsTitle(trialResetLabel)}
                </p>
                <p
                  className="mt-2 text-center text-xs leading-relaxed text-[#B8735C] sm:text-left"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {DASHBOARD_COPY.upload.trialExhausted.planStartsSub}
                </p>
              </div>
            ) : null}

            <div className="rounded-2xl border-2 border-dashed border-[#C8C8C8] bg-[#F7F7F7] px-5 py-12 text-center">
              <LockIcon
                size={56}
                weight="duotone"
                className="mx-auto mb-5 text-[#D4A574]"
                aria-hidden
              />
              <h3
                className="mb-2 text-lg font-bold text-[#1A1A1A]"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                {DASHBOARD_COPY.upload.trialExhausted.cardTitle}
              </h3>
              <p
                className="text-sm leading-relaxed text-[#6B6B6B]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {DASHBOARD_COPY.upload.trialExhausted.cardBody}
              </p>
            </div>
          </div>

          <FunnelBottomDock tone="none">
            <div className="flex w-full min-w-0 max-w-none flex-col gap-3">
              {shellModals ? (
                <button
                  type="button"
                  onClick={shellModals.openStartEarly}
                  className={`${funnelPrimaryButtonClassName} w-full`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {DASHBOARD_COPY.upload.trialExhausted.ctaPrimary}
                </button>
              ) : (
                <Link
                  href={DASHBOARD_PAYWALL_UPLOAD_HREF}
                  className={`${funnelPrimaryButtonClassName} no-underline`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {DASHBOARD_COPY.upload.trialExhausted.ctaPrimary}
                </Link>
              )}
              <p
                className="text-center text-xs leading-relaxed text-[#9B9B9B]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {trialResetLabel ? (
                  <>{DASHBOARD_COPY.upload.trialExhausted.waitLineWithDate(trialResetLabel)}</>
                ) : (
                  <>{DASHBOARD_COPY.upload.trialExhausted.waitLineTrialEnds}</>
                )}
              </p>
            </div>
          </FunnelBottomDock>
        </div>
      </div>
    );
  }

  if (showPaidExhausted) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex w-full min-w-0 max-w-none flex-col gap-4 py-2">
            <div className="rounded-2xl border-2 border-dashed border-[#C8C8C8] bg-white px-5 py-12 text-center shadow-sm">
              <LockIcon
                size={56}
                weight="duotone"
                className="mx-auto mb-5 text-[#D4A574]"
                aria-hidden
              />
              <h3
                className="mb-2 text-lg font-bold text-[#1A1A1A]"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                {DASHBOARD_COPY.upload.paidExhausted.cardTitle}
              </h3>
              <p
                className="text-sm leading-relaxed text-[#6B6B6B]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {planDateLabel ? (
                  <>{DASHBOARD_COPY.upload.paidExhausted.cardBodyWithDate(planDateLabel)}</>
                ) : (
                  <>{DASHBOARD_COPY.upload.paidExhausted.cardBodyNextBilling}</>
                )}
              </p>
            </div>
          </div>

          <FunnelBottomDock tone="none">
            <div className="flex w-full min-w-0 max-w-none flex-col gap-3">
              <button
                type="button"
                disabled
                className="flex h-14 min-h-[56px] w-full cursor-default items-center justify-center rounded-full bg-[#EAEAEA] px-5 text-base font-bold text-[#555555] sm:px-6"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {planDateLabel ? (
                  <>{DASHBOARD_COPY.upload.paidExhausted.ctaDisabledWithDate(planDateLabel)}</>
                ) : (
                  <>{DASHBOARD_COPY.upload.paidExhausted.ctaDisabledFallback}</>
                )}
              </button>
            </div>
          </FunnelBottomDock>
        </div>
      </div>
    );
  }

  if (showNoScenesVideoLeft) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex w-full min-w-0 max-w-none flex-col gap-4 py-2">
            <h2
              className="text-left text-xl font-bold text-[#1A1A1A] sm:text-2xl"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
            >
              {DASHBOARD_COPY.upload.headline}
            </h2>

            <div className="rounded-2xl border-2 border-dashed border-[#C8C8C8] bg-[#F7F7F7] px-5 py-12 text-center">
              <span
                className="mb-5 block text-[4.5rem] leading-none"
                aria-hidden
              >
                ✨
              </span>
              <h3
                className="mb-2 text-lg font-bold text-[#1A1A1A]"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                {DASHBOARD_COPY.upload.noScenes.cardTitle}
              </h3>
              <p
                className="text-sm leading-relaxed text-[#6B6B6B]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {DASHBOARD_COPY.upload.noScenes.cardBody}
              </p>
            </div>
          </div>

          <FunnelBottomDock tone="none">
            <div className="flex w-full min-w-0 max-w-none flex-col gap-3">
              <Link
                href="/dashboard/gallery"
                className="flex h-14 min-h-[56px] w-full items-center justify-center gap-2 rounded-full border-[3px] border-[#FF7B5C] bg-white px-5 text-base font-bold text-[#FF7B5C] no-underline transition-colors hover:bg-[#FFF8F6] active:scale-[0.98] sm:px-6"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {DASHBOARD_COPY.upload.noScenes.galleryCta}
              </Link>
              <p
                className="text-center text-xs leading-relaxed text-[#9B9B9B]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {planDateLabel ? (
                  <>{DASHBOARD_COPY.upload.noScenes.sceneResetLineWithDate(planDateLabel)}</>
                ) : isTrialingStatus(entitlement?.subscriptionStatus) ? (
                  <>{DASHBOARD_COPY.upload.noScenes.sceneResetTrialing}</>
                ) : (
                  <>{DASHBOARD_COPY.upload.noScenes.sceneResetBilling}</>
                )}
              </p>
            </div>
          </FunnelBottomDock>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex w-full min-w-0 max-w-none flex-col py-2">
            <h2
              className="mb-4 text-left text-xl font-bold text-[#1A1A1A] sm:text-2xl"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
            >
              {DASHBOARD_COPY.upload.headline}
            </h2>

            <button
              type="button"
              onClick={handleClick}
              disabled={isUploading}
              className="group w-full rounded-[26px] border border-[#F0EBE6] bg-[#FDF8F5] px-6 py-10 text-center shadow-sm transition hover:border-[#E8E0DA] hover:bg-[#FAF4EF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7B5C] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70"
            >
              <span
                className="mb-4 block text-[4.5rem] leading-none transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-[0.98]"
                aria-hidden
              >
                🎨
              </span>
              <span
                className="mb-2 block text-lg font-bold text-[#1A1A1A] sm:text-xl"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {showVideoPausedScenes
                  ? DASHBOARD_COPY.upload.uploadForScenes
                  : DASHBOARD_COPY.upload.chooseDrawing}
              </span>
              <span
                className="block text-sm text-[#9B9B9B]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {showVideoPausedScenes ? (
                  <>
                    {uploadVideoPausedSubline({
                      scenesRemaining,
                      planDateLabel,
                      isTrialing: isTrialingStatus(entitlement?.subscriptionStatus),
                    })}
                  </>
                ) : (
                  <>{DASHBOARD_COPY.upload.formatsLine}</>
                )}
              </span>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/webp"
              className="hidden"
              onChange={handleChange}
            />
            {error ? (
              <div className="mt-4 flex flex-col items-center space-y-3">
                <ErrorStateIcon size={44} />
                <p
                  className="text-center text-sm text-red-600"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {error}
                </p>
                <SupportContact errorSummary={error} />
              </div>
            ) : null}
          </div>

          <FunnelBottomDock tone="none">
            <div className="flex w-full min-w-0 max-w-none flex-col gap-3">
              <FunnelPrimaryButton
                onClick={handleClick}
                disabled={isUploading}
                className="w-full shadow-[0_4px_14px_-4px_rgba(255,123,92,0.45)] disabled:!opacity-90"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {isUploading ? DASHBOARD_COPY.upload.starting : DASHBOARD_COPY.upload.uploadCta}
              </FunnelPrimaryButton>
              <DashboardUploadLegal />
            </div>
          </FunnelBottomDock>
        </div>
      </div>
    </div>
  );
}
