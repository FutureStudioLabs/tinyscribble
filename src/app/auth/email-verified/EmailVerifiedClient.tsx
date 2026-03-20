"use client";

import { AUTH_BROADCAST_CHANNEL } from "@/components/auth/AuthBroadcastListener";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { LogoMark } from "@/components/Logo";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";
import { resolvePostLoginDestination } from "@/lib/safe-next-path";
import { CheckCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export function EmailVerifiedClient() {
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => resolvePostLoginDestination(searchParams.get("next")),
    [searchParams]
  );

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    try {
      const ch = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
      ch.postMessage({ type: "session-ready" });
      ch.close();
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FFF8F5]">
      <header className="flex shrink-0 items-center justify-between px-5 py-4">
        <Link href="/" className="inline-flex" aria-label="Home">
          <LogoMark />
        </Link>
        <HeaderUserAvatar />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-4">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mb-6 flex justify-center" aria-hidden>
            <CheckCircleIcon
              className="text-[#2A9D8F]"
              weight="fill"
              size={64}
            />
          </div>
          <h1
            className="mb-3 text-[26px] font-bold text-[#1A1A1A] sm:text-[30px]"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            You&apos;re signed in
          </h1>
          <p
            className="mb-2 text-base leading-relaxed text-[#6B6B6B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            You opened this link in a <strong className="text-[#1A1A1A]">new tab</strong> or
            window. Your account is verified here.
          </p>
          <p
            className="mb-8 text-base leading-relaxed text-[#6B6B6B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <strong className="text-[#1A1A1A]">Close this tab</strong> and go back to the TinyScribble
            tab where you were working — it should refresh and pick up your login automatically. If
            not, refresh that page once.
          </p>

          <Link
            href={nextPath}
            className={`${funnelPrimaryButtonClassName} mb-4 inline-flex w-full max-w-md items-center justify-center no-underline`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            Continue in this tab instead
          </Link>
          <p className="text-xs text-[#9B9B9B]" style={{ fontFamily: "var(--font-body)" }}>
            Use this if you don&apos;t have another TinyScribble tab open.
          </p>
        </div>
      </main>
    </div>
  );
}
