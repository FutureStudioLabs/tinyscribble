"use client";

import { UPGRADE_PLANS_DISPLAY, type PaidUpgradeTierId } from "@/constants/upgrade-plans-display";
import { TRIAL_VIDEO_QUOTA_CHANGED_EVENT } from "@/constants/trial";
import { formatErrorForUser } from "@/lib/format-user-error";
import type { UpgradeTierPriceDisplay } from "@/lib/stripe-upgrade-price-display";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Dashboard preview toolbar — no API / no Stripe. */
  staticPreview?: boolean;
};

export function PaidUpgradeModal({
  open,
  onClose,
  staticPreview = false,
}: Props) {
  const router = useRouter();
  const titleId = useId();
  const [tier, setTier] = useState<PaidUpgradeTierId>("family");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripePrices, setStripePrices] = useState<{
    family: UpgradeTierPriceDisplay | null;
    power: UpgradeTierPriceDisplay | null;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
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

  useEffect(() => {
    if (!open || staticPreview) return;
    let cancelled = false;
    void fetch("/api/stripe/upgrade-plan-prices", { credentials: "include" })
      .then((r) => r.json() as Promise<{ family?: unknown; power?: unknown }>)
      .then((data) => {
        if (cancelled) return;
        const isTier = (v: unknown): v is UpgradeTierPriceDisplay =>
          typeof v === "object" &&
          v !== null &&
          typeof (v as UpgradeTierPriceDisplay).monthlyEquivalent === "string" &&
          typeof (v as UpgradeTierPriceDisplay).billedYearly === "string";
        setStripePrices({
          family: isTier(data.family) ? data.family : null,
          power: isTier(data.power) ? data.power : null,
        });
      })
      .catch(() => {
        if (!cancelled) setStripePrices({ family: null, power: null });
      });
    return () => {
      cancelled = true;
    };
  }, [open, staticPreview]);

  const familyBase = UPGRADE_PLANS_DISPLAY.family;
  const powerBase = UPGRADE_PLANS_DISPLAY.power;
  const family = {
    ...familyBase,
    monthlyEquivalent:
      stripePrices?.family?.monthlyEquivalent ?? familyBase.monthlyEquivalent,
    billedYearly: stripePrices?.family?.billedYearly ?? familyBase.billedYearly,
  };
  const power = {
    ...powerBase,
    monthlyEquivalent:
      stripePrices?.power?.monthlyEquivalent ?? powerBase.monthlyEquivalent,
    billedYearly: stripePrices?.power?.billedYearly ?? powerBase.billedYearly,
  };
  const selected = tier === "family" ? family : power;

  const handleUpgrade = useCallback(async () => {
    if (staticPreview) {
      onClose();
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/upgrade-subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      let data: { ok?: boolean; error?: string };
      try {
        data = (await res.json()) as { ok?: boolean; error?: string };
      } catch {
        setError(
          formatErrorForUser(
            res.ok ? "Invalid response from server." : `HTTP ${res.status}`
          )
        );
        return;
      }
      if (!res.ok) {
        setError(formatErrorForUser(data.error || "Could not upgrade."));
        return;
      }
      if (data.ok) {
        window.dispatchEvent(new CustomEvent(TRIAL_VIDEO_QUOTA_CHANGED_EVENT));
        onClose();
        router.refresh();
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Something went wrong.";
      setError(formatErrorForUser(raw));
    } finally {
      setBusy(false);
    }
  }, [tier, onClose, router, staticPreview]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 animate-fade-in bg-[#1A0F0C]/55 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        className="animate-scale-in relative flex max-h-[min(92dvh,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] shadow-[0_0_0_1px_rgba(26,26,26,0.04),0_32px_64px_-12px_rgba(26,15,12,0.45),0_12px_24px_-8px_rgba(255,123,92,0.12)]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FFFAF7] via-white to-[#FFF5F0]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF7B5C]/35 to-transparent"
          aria-hidden
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-mobile-browser pt-7 sm:px-8 sm:pb-9 sm:pt-8"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="mb-5 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-[#E0E0E0]" aria-hidden />
            </div>

            {staticPreview ? (
              <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-[12px] font-semibold text-amber-900/90">
                Static UI preview — no upgrade request
              </p>
            ) : null}

            <h2
              id={titleId}
              className="mb-2 text-center text-[1.5rem] font-bold leading-[1.2] tracking-tight text-[#1A1A1A] sm:text-[1.75rem]"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
            >
              Want more magic this month?
            </h2>
            <p className="mb-6 text-center text-[15px] leading-snug text-[#6B6B6B]">
              Videos unlock immediately.
            </p>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTier("family")}
                className={`relative rounded-2xl border-2 p-3 text-left transition-all sm:p-4 ${
                  tier === "family"
                    ? "border-[#FF7B5C] bg-[#FFF8F5] shadow-sm"
                    : "border-[#E5E5E5] bg-white hover:border-[#D4D4D4]"
                }`}
              >
                <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1A1A1A] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  Most Popular
                </span>
                <p className="text-xs font-medium text-[#737373]">{family.name}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-[#1A1A1A]">
                  {family.monthlyEquivalent}
                </p>
                <p className="mt-2 text-[11px] leading-snug text-[#555555]">
                  <span aria-hidden>🎬</span> {family.videosPerMonth} videos/month
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#555555]">
                  <span aria-hidden>✨</span> {family.scenesPerMonth} scenes/month
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTier("power")}
                className={`rounded-2xl border-2 p-3 text-left transition-all sm:p-4 ${
                  tier === "power"
                    ? "border-[#FF7B5C] bg-[#FFF8F5] shadow-sm"
                    : "border-[#E5E5E5] bg-white hover:border-[#D4D4D4]"
                }`}
              >
                <p className="text-xs font-medium text-[#737373]">{power.name}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-[#1A1A1A]">
                  {power.monthlyEquivalent}
                </p>
                <p className="mt-2 text-[11px] leading-snug text-[#555555]">
                  <span aria-hidden>🎬</span> {power.videosPerMonth} videos/month
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#555555]">
                  <span aria-hidden>✨</span> {power.scenesPerMonth} scenes/month
                </p>
              </button>
            </div>

            <p className="mb-4 text-center text-[11px] leading-relaxed text-[#9B9B9B]">
              Upgrades immediately · Renewal date stays the same · Cancel anytime
            </p>

            {error ? (
              <p
                className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-800"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={busy && !staticPreview}
              onClick={() => void handleUpgrade()}
              className="flex h-14 w-full items-center justify-center rounded-full bg-[#FF7B5C] px-3 text-center text-base font-bold leading-tight text-white shadow-[0_4px_14px_-4px_rgba(255,123,92,0.5)] transition active:scale-[0.98] disabled:opacity-60 sm:text-[15px]"
              aria-label={staticPreview ? "Close preview (no charge)" : undefined}
            >
              {busy && !staticPreview ? "Processing…" : "Upgrade my plan"}
            </button>

            <p className="mt-2 text-center text-[11px] text-[#A3A3A3]">
              Billed as {selected.billedYearly}
            </p>

            <button
              type="button"
              disabled={busy && !staticPreview}
              onClick={onClose}
              className="mt-4 w-full py-2 text-center text-sm font-medium text-[#A3A3A3] transition hover:text-[#737373] disabled:opacity-50"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
