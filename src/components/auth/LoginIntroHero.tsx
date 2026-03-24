"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * Client-only hero so copy matches the URL after client navigations (e.g. `router.replace`
 * from Stripe verify). Server-rendered `searchParams` alone can stay stale on the same route.
 */
export function LoginIntroHero({
  isSwitchAccountFlow,
}: {
  isSwitchAccountFlow: boolean;
}) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const checkout = searchParams.get("checkout");
  const hint = searchParams.get("hint");

  const isCheckoutOrPostPurchaseFlow =
    sessionId?.startsWith("cs_") === true ||
    checkout === "1" ||
    hint === "sign_in";

  const showStandardLoginIntro =
    !isSwitchAccountFlow && !isCheckoutOrPostPurchaseFlow;

  return (
    <>
      {showStandardLoginIntro ? (
        <>
          <h1
            className="mb-2 text-[28px] font-bold text-[#1A1A1A] sm:text-[32px]"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            Log in
          </h1>
          <p
            className="mb-6 text-base text-[#6B6B6B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Enter your email and we&apos;ll send you a 6-digit code. No password.
          </p>
        </>
      ) : null}
      {isSwitchAccountFlow ? (
        <>
          <h1
            className="mb-2 text-[28px] font-bold text-[#1A1A1A] sm:text-[32px]"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            Switch account
          </h1>
          <p
            className="mb-6 text-base text-[#6B6B6B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            You&apos;re already signed in.{" "}
            <strong className="text-[#1A1A1A]">Sign out</strong> below to use a different email, or
            continue to your dashboard.
          </p>
        </>
      ) : null}
      {isSwitchAccountFlow ? (
        <Link
          href="/dashboard"
          className="mb-6 inline-flex text-sm font-semibold text-[#1A1A1A] underline decoration-[#C8C8C8] underline-offset-2 transition-colors hover:decoration-[#1A1A1A]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Go to dashboard →
        </Link>
      ) : null}
    </>
  );
}
