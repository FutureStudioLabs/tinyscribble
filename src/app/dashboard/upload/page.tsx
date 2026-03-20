import Link from "next/link";
import { DashboardUploadClient } from "./DashboardUploadClient";

export default function DashboardUploadPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      {/* Primary: upload — same flow as /loading → generate */}
      <DashboardUploadClient />

      {/* Same width column as upload CTA: outer px-5, inner max-w-md (not max-w-md + inner pad) */}
      <div className="px-5 pb-8 pt-2">
        <div className="mx-auto w-full max-w-md">
          <div className="w-full rounded-[1.25rem] border border-[#E8E8E8] bg-white/80 p-5 shadow-sm">
            <h2
              className="mb-2 text-base font-bold text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-fredoka)" }}
            >
              Subscription &amp; billing
            </h2>
            <p
              className="mb-4 text-sm leading-relaxed text-[#6B6B6B]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Plans, trial, and Stripe Customer Portal live on a dedicated page.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center text-sm font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Open billing page →
            </Link>
          </div>

          <p
            className="mt-8 text-center text-xs leading-relaxed text-[#9B9B9B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Prefer the full-screen uploader from the homepage?{" "}
            <Link href="/upload" className="font-semibold text-[#6B6B6B] underline underline-offset-2 hover:text-[#1A1A1A]">
              Open upload page
            </Link>
            . To see the public site, sign out from the menu above.
          </p>
        </div>
      </div>
    </main>
  );
}
