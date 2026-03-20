import { CheckoutSuccessClient } from "@/app/checkout/success/CheckoutSuccessClient";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { LogoMark } from "@/components/Logo";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Welcome — TinyScribble",
  description: "Finish signing in after checkout.",
};

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FFF8F5]">
      <header className="flex shrink-0 items-center justify-between px-5 py-4">
        <Link href="/" className="inline-flex" aria-label="Home">
          <LogoMark />
        </Link>
        <HeaderUserAvatar />
      </header>
      <main className="flex min-h-0 flex-1 flex-col px-5 pb-8 pt-4">
        <h1
          className="mx-auto mb-6 max-w-md shrink-0 text-center text-[26px] font-bold text-[#1A1A1A] sm:mb-8 sm:text-[30px]"
          style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
        >
          One more step
        </h1>
        <div className="flex min-h-0 flex-1 flex-col">
          <Suspense
            fallback={
              <div className="mx-auto flex min-h-[40vh] w-full max-w-md flex-1 items-center justify-center">
                <div className="h-40 w-full animate-pulse rounded-2xl bg-[#FF7B5C]/10" />
              </div>
            }
          >
            <CheckoutSuccessClient />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
