import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginStatus } from "@/components/auth/LoginStatus";
import { LogoMark } from "@/components/Logo";
import {
  resolvePostLoginDestination,
  switchAccountRequested,
} from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = {
  title: "Log in — TinyScribble",
  description: "Sign in with a magic link — no password.",
};

type Search = { next?: string; switch_account?: string };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Search> | Search;
}) {
  const sp = await Promise.resolve(searchParams);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allowSwitchAccount = switchAccountRequested(sp.switch_account);

  if (user?.email && !allowSwitchAccount) {
    redirect(resolvePostLoginDestination(sp.next));
  }

  const isSwitchAccountFlow = Boolean(user?.email && allowSwitchAccount);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FFF8F5]">
      <header className="flex shrink-0 items-center justify-between px-5 py-4">
        <Link href="/" className="inline-flex" aria-label="Home">
          <LogoMark />
        </Link>
        <div className="flex items-center gap-3">
          <HeaderUserAvatar />
          <Link
            href="/"
            className="text-sm font-semibold text-[#FF7B5C] hover:text-[#FF6B4A]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Back
          </Link>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-5 pb-8 pt-6">
        <div className="mx-auto w-full max-w-md shrink-0 text-center">
          <h1
            className="mb-2 text-[28px] font-bold text-[#1A1A1A] sm:text-[32px]"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            {isSwitchAccountFlow ? "Switch account" : "Log in"}
          </h1>
          <p
            className="mb-6 text-base text-[#6B6B6B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {isSwitchAccountFlow ? (
              <>
                You&apos;re already signed in.{" "}
                <strong className="text-[#1A1A1A]">Sign out</strong> below to use a different email,
                or continue to your dashboard.
              </>
            ) : (
              <>Enter your email and we&apos;ll send you a magic link. No password.</>
            )}
          </p>
          {isSwitchAccountFlow ? (
            <Link
              href="/dashboard"
              className="mb-6 inline-flex text-sm font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Go to dashboard →
            </Link>
          ) : null}
        </div>

        <LoginStatus />

        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] flex-1 items-center justify-center">
                <div className="h-40 w-full animate-pulse rounded-2xl bg-[#FF7B5C]/10" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
