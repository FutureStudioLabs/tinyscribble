"use client";

import { VideoCameraIcon } from "@phosphor-icons/react";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";
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
        });
      } catch {
        if (!cancelled) {
          setGate({
            phase: "ready",
            authenticated: false,
            entitled: false,
            subscriptionStatus: null,
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
    return (
      <button
        type="button"
        onClick={() => router.push(videoPath)}
        className={funnelPrimaryButtonClassName}
        style={{ fontFamily: "var(--font-body)" }}
        aria-label={`Create video from version ${v + 1}`}
      >
        <VideoCameraIcon size={22} weight="bold" aria-hidden />
        Create video
      </button>
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
