import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginIntroHero } from "@/components/auth/LoginIntroHero";
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
  description: "Sign in with a 6-digit code — no password.",
};

type Search = {
  next?: string;
  switch_account?: string;
};

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
            className="text-sm font-semibold text-[#5C6670] transition-colors hover:text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Back
          </Link>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-5 pb-8 pt-6">
        <div className="mx-auto w-full max-w-md shrink-0 text-center">
          <Suspense
            fallback={
              <div
                className="mb-6 min-h-[7.5rem]"
                aria-hidden
              />
            }
          >
            <LoginIntroHero isSwitchAccountFlow={isSwitchAccountFlow} />
          </Suspense>
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
