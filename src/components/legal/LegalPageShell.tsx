import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { LogoMark } from "@/components/Logo";
import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPageShell({
  title,
  updated,
  updatedLabel = "Last updated",
  children,
}: {
  title: string;
  updated: string;
  /** e.g. "Effective date" for Terms; defaults to "Last updated". */
  updatedLabel?: string;
  children: ReactNode;
}) {
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
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-2">
        <h1
          className="mb-2 text-3xl font-bold text-[#1A1A1A] sm:text-[2.25rem]"
          style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
        >
          {title}
        </h1>
        <p
          className="mb-10 text-sm text-[#9B9B9B]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {updatedLabel}: {updated}
        </p>
        <article
          className="space-y-8 text-[15px] leading-relaxed text-[#1A1A1A]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {children}
        </article>
      </main>
    </div>
  );
}
