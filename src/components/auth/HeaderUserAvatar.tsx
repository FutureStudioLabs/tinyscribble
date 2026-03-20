"use client";

import { TRIAL_VIDEO_QUOTA_CHANGED_EVENT } from "@/constants/trial";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function initialsFromEmail(email: string | undefined): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? email;
  const parts = local
    .replace(/[^a-zA-Z0-9]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

type HeaderUserAvatarProps = {
  /** When true and user is not signed in, show the same Log in control as the marketing header. */
  showLoginWhenAnonymous?: boolean;
  className?: string;
};

export function HeaderUserAvatar({
  showLoginWhenAnonymous = false,
  className = "",
}: HeaderUserAvatarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [trialQuota, setTrialQuota] = useState<
    NonNullable<BillingEntitlementPayload["trialVideoQuota"]> | null | undefined
  >(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const loadTrialQuota = useCallback(() => {
    void fetch("/api/billing/entitlement", { credentials: "include" })
      .then((r) => r.json())
      .then((data: BillingEntitlementPayload) => {
        setTrialQuota(data.trialVideoQuota ?? null);
      })
      .catch(() => setTrialQuota(null));
  }, []);

  useEffect(() => {
    const sb = createClient();
    void sb.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      setTrialQuota(undefined);
      return;
    }
    loadTrialQuota();
  }, [user, loadTrialQuota]);

  useEffect(() => {
    if (!user?.id) return;
    const onVis = () => {
      if (document.visibilityState === "visible") loadTrialQuota();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener(TRIAL_VIDEO_QUOTA_CHANGED_EVENT, loadTrialQuota);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(TRIAL_VIDEO_QUOTA_CHANGED_EVENT, loadTrialQuota);
    };
  }, [user?.id, loadTrialQuota]);

  useEffect(() => {
    if (!menuOpen) return;
    function close(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    await createClient().auth.signOut();
    setMenuOpen(false);
    router.refresh();
    setSigningOut(false);
  }, [router]);

  if (user === undefined) {
    return (
      <div
        className={`h-10 w-10 shrink-0 rounded-full bg-[#E8E8E8]/50 animate-pulse ${className}`}
        aria-hidden
      />
    );
  }

  if (!user) {
    if (!showLoginWhenAnonymous) return null;
    return (
      <Link
        href="/login"
        className={`flex h-12 min-h-[48px] shrink-0 items-center justify-center rounded-full border-2 border-[#FF7B5C] px-5 text-sm font-semibold text-[#FF7B5C] transition-colors hover:bg-[#FF7B5C]/5 ${className}`}
        style={{ fontFamily: "var(--font-body)" }}
      >
        Log in
      </Link>
    );
  }

  const email = user.email ?? "";
  const label = initialsFromEmail(email);

  return (
    <div className={`relative flex items-center gap-2 ${className}`} ref={wrapRef}>
      {trialQuota != null ? (
        <span
          className="max-w-[min(100vw-8rem,10rem)] shrink truncate rounded-full border border-[#E8E8E8] bg-white/95 px-2 py-1 text-center text-[10px] font-semibold leading-tight text-[#4A4A4A] shadow-sm sm:max-w-none sm:px-3 sm:py-1.5 sm:text-xs"
          style={{ fontFamily: "var(--font-body)" }}
          title="Trial videos remaining"
        >
          {trialQuota.remaining} / {trialQuota.limit} Remains
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setMenuOpen((o) => !o);
          if (user?.id) loadTrialQuota();
        }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF7B5C] to-[#FF9E6C] text-sm font-bold text-white shadow-md ring-2 ring-white/90 transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7B5C] focus-visible:ring-offset-2"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <span aria-hidden>{label.slice(0, 2)}</span>
      </button>

      {menuOpen ? (
        <div
          className="absolute right-0 top-full z-[200] mt-2 w-[min(100vw-2.5rem,14rem)] rounded-2xl border border-[#E8E8E8] bg-white py-2 shadow-lg"
          role="menu"
        >
          <p
            className="truncate border-b border-[#F0F0F0] px-3 pb-2 text-xs text-[#6B6B6B]"
            title={email}
            style={{ fontFamily: "var(--font-body)" }}
          >
            {email || "Signed in"}
          </p>
          <Link
            href="/dashboard"
            role="menuitem"
            className="block px-3 py-2.5 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#FFF8F5]"
            style={{ fontFamily: "var(--font-body)" }}
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/billing"
            role="menuitem"
            className="block px-3 py-2.5 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#FFF8F5]"
            style={{ fontFamily: "var(--font-body)" }}
            onClick={() => setMenuOpen(false)}
          >
            Billing
          </Link>
          <Link
            href="/login?switch_account=1"
            role="menuitem"
            className="block px-3 py-2.5 text-sm font-semibold text-[#6B6B6B] transition-colors hover:bg-[#FFF8F5]"
            style={{ fontFamily: "var(--font-body)" }}
            onClick={() => setMenuOpen(false)}
          >
            Use another account
          </Link>
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2.5 text-left text-sm font-semibold text-[#FF7B5C] transition-colors hover:bg-[#FFF8F5] disabled:opacity-60"
            style={{ fontFamily: "var(--font-body)" }}
            onClick={() => void signOut()}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
