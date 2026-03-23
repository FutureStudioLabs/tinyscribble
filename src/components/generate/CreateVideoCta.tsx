"use client";

import { SkipTrialModal } from "@/components/trial/SkipTrialModal";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { VideoCameraIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  activeVariant: number;
};

type Gate =
  | { phase: "loading" }
  | { phase: "ready" } & BillingEntitlementPayload;

/**
 * - Entitled → video step (APIYI)
 * - Not signed in → paywall (sign up + subscribe)
 * - Signed in, not subscribed → paywall
 */
export function CreateVideoCta({ activeVariant }: Props) {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>({ phase: "loading" });
  const [skipTrialOpen, setSkipTrialOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/billing/entitlement", { credentials: "include" });
        const data = (await res.json()) as Partial<BillingEntitlementPayload>;
        if (cancelled) return;
        setGate({
          phase: "ready",
          authenticated: !!data.authenticated,
          entitled: !!data.entitled,
          subscriptionStatus: data.subscriptionStatus ?? null,
          trialVideoQuota: data.trialVideoQuota ?? null,
          trialImageQuota: data.trialImageQuota ?? null,
          trialEndsAt: data.trialEndsAt ?? null,
          billingPeriodEndsAt: data.billingPeriodEndsAt ?? null,
          paidVideoQuota: data.paidVideoQuota ?? null,
          paidImageQuota: data.paidImageQuota ?? null,
          planInterval: data.planInterval ?? null,
        });
      } catch {
        if (!cancelled) {
          setGate({
            phase: "ready",
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
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const v = Math.min(2, Math.max(0, activeVariant));
  const videoPath = `/generate/video?v=${v}`;
  const paywallHref = `/paywall?next=${encodeURIComponent(videoPath)}`;

  if (gate.phase === "loading") {
    return (
      <button
        type="button"
        disabled
        className={`${funnelPrimaryButtonClassName} cursor-wait opacity-80`}
        style={{ fontFamily: "var(--font-body)" }}
      >
        <VideoCameraIcon size={22} weight="bold" aria-hidden />
        Checking your plan…
      </button>
    );
  }

  if (gate.entitled) {
    const trialVideoSpent =
      gate.trialVideoQuota != null && gate.trialVideoQuota.remaining === 0;

    return (
      <>
        <SkipTrialModal open={skipTrialOpen} onClose={() => setSkipTrialOpen(false)} />
        <button
          type="button"
          onClick={() => {
            if (trialVideoSpent) {
              setSkipTrialOpen(true);
              return;
            }
            router.push(videoPath);
          }}
          className={funnelPrimaryButtonClassName}
          style={{ fontFamily: "var(--font-body)" }}
          aria-label={`Create video from version ${v + 1}`}
        >
          <VideoCameraIcon size={22} weight="bold" aria-hidden />
          Create video
        </button>
      </>
    );
  }

  return (
    <Link
      href={paywallHref}
      className={funnelPrimaryButtonClassName}
      style={{ fontFamily: "var(--font-body)" }}
      aria-label={`Create video from version ${v + 1} — subscribe to continue`}
    >
      <VideoCameraIcon size={22} weight="bold" aria-hidden />
      Create video
    </Link>
  );
}
