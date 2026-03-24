"use client";

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
  /** Dashboard-style coral circle with hamburger (menu content unchanged). */
  trigger?: "initials" | "hamburger";
};

export function HeaderUserAvatar({
  showLoginWhenAnonymous = false,
  className = "",
  trigger = "initials",
}: HeaderUserAvatarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  const isHamburger = trigger === "hamburger";

  return (
    <div className={`relative flex items-center gap-2 ${className}`} ref={wrapRef}>
      <button
        type="button"
        onClick={() => {
          setMenuOpen((o) => !o);
        }}
        className={`flex shrink-0 items-center justify-center rounded-full bg-[#F28B66] text-white shadow-md shadow-[#F28B66]/35 transition hover:bg-[#E87A5A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7B5C] focus-visible:ring-offset-2 ${
          isHamburger ? "h-11 w-11 flex-col gap-[5px] p-0" : "h-10 w-10 bg-gradient-to-br from-[#FF7B5C] to-[#FF9E6C] text-sm font-bold ring-2 ring-white/90 hover:opacity-95"
        }`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {isHamburger ? (
          <>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block h-0.5 w-[15px] rounded-sm bg-white"
                aria-hidden
              />
            ))}
          </>
        ) : (
          <span aria-hidden>{label.slice(0, 2)}</span>
        )}
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
