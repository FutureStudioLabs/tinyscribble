"use client";

import Link from "next/link";
import { ImagesIcon } from "@phosphor-icons/react";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";

export default function DashboardGalleryPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 py-8">
        <div className="mx-auto w-full max-w-md text-center">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Your library
          </p>
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] shadow-lg shadow-[#8B5CF6]/20">
            <ImagesIcon size={30} weight="bold" color="white" />
          </div>
          <h2
            className="mb-2 text-[28px] font-bold text-[#1A1A1A] sm:text-[32px]"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            Gallery
          </h2>
          <p
            className="mb-8 text-sm leading-relaxed text-[#6B6B6B] sm:text-[15px]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Finished animations and saved work will appear here. Upload a drawing on the{" "}
            <strong className="font-semibold text-[#1A1A1A]">Upload</strong> tab to get started.
          </p>
          <Link
            href="/dashboard/upload"
            className={funnelPrimaryButtonClassName + " mb-6 w-full no-underline"}
            style={{ fontFamily: "var(--font-body)" }}
          >
            Upload a drawing
          </Link>
          <p className="text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
            <Link
              href="/dashboard/billing"
              className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
            >
              Billing &amp; plans
            </Link>
            {" · "}
            <Link
              href="/upload"
              className="font-semibold text-[#6B6B6B] underline underline-offset-2 hover:text-[#1A1A1A]"
            >
              Standalone uploader
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
