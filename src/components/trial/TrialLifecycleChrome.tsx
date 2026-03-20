"use client";

import { SKIP_TRIAL_DISMISSED_EVENT, SKIP_TRIAL_MODAL_DISMISSED_KEY } from "@/constants/trial";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { createClient } from "@/lib/supabase/client";
import { openStripeBillingPortal } from "@/lib/open-stripe-billing-portal-client";
import { useCallback, useEffect, useState } from "react";

/**
 * After the user dismisses Skip Trial once, show a slim upgrade strip while still `trialing`.
 */
export function TrialLifecycleChrome() {
  const [visible, setVisible] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);

  const sync = useCallback(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SKIP_TRIAL_MODAL_DISMISSED_KEY) !== "1") {
      setVisible(false);
      return;
    }
    void fetch("/api/billing/entitlement", { credentials: "include" })
      .then((r) => r.json())
      .then((d: BillingEntitlementPayload) => {
        const trialing = d.subscriptionStatus?.trim().toLowerCase() === "trialing";
        setVisible(Boolean(trialing && d.entitled));
      })
      .catch(() => setVisible(false));
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(SKIP_TRIAL_DISMISSED_EVENT, sync);
    return () => window.removeEventListener(SKIP_TRIAL_DISMISSED_EVENT, sync);
  }, [sync]);

  const openBilling = useCallback(async () => {
    setBillingBusy(true);
    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      const email = user?.email?.trim();
      if (!email) return;
      await openStripeBillingPortal(email, { returnPath: "/dashboard/billing" });
    } catch {
      /* user can use /dashboard/billing */
    } finally {
      setBillingBusy(false);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[90] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className="pointer-events-auto flex w-full max-w-lg items-center justify-between gap-3 rounded-2xl border border-[#FF7B5C]/25 bg-[#FFF8F5]/95 px-4 py-3 shadow-lg shadow-[#FF7B5C]/10 backdrop-blur-md">
        <p className="min-w-0 flex-1 text-xs font-medium leading-snug text-[#1A1A1A] sm:text-sm">
          You&apos;re on a <span className="text-[#FF7B5C]">free trial</span>. Upgrade anytime for
          unlimited videos &amp; images.
        </p>
        <button
          type="button"
          disabled={billingBusy}
          onClick={() => void openBilling()}
          className="shrink-0 rounded-full bg-[#FF7B5C] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[#FF7B5C]/30 transition hover:bg-[#FF6B4A] disabled:opacity-60 sm:text-sm"
        >
          {billingBusy ? "…" : "Upgrade"}
        </button>
      </div>
    </div>
  );
}
