import Link from "next/link";
import type { ReactNode } from "react";

const DOCK_BG = {
  /** Matches `bg-[#FFF8F5]` (e.g. /upload, dashboard). */
  cream: "bg-[#FFF8F5]",
  /** Matches bottom of funnel gradient `to-[#FFE8E0]`. */
  funnel: "bg-[#FFE8E0]",
} as const;

/**
 * CTA block after step copy — scrolls with the page (same pattern as paywall main).
 * Uses `mt-4` (16px) from preceding content; avoid large `mb-*` on the last block above.
 * Optional background when the parent surface isn’t a flat match (e.g. gradient pages).
 */
export function FunnelBottomDock({
  children,
  className = "",
  tone = "none",
}: {
  children: ReactNode;
  className?: string;
  /** `cream` / `funnel` tint if needed; `none` keeps parent background visible. */
  tone?: keyof typeof DOCK_BG | "none";
}) {
  const bg = tone === "none" ? "" : DOCK_BG[tone];
  return (
    <div
      className={`mt-4 w-full max-w-full shrink-0 self-stretch pb-mobile-browser ${bg} ${className}`}
    >
      {children}
    </div>
  );
}

export function FunnelLegalDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-center text-[12px] leading-snug text-[#9B9B9B] sm:text-[13px] ${className}`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      By continuing you agree to our{" "}
      <Link
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-[#6B6B6B]"
      >
        Terms of Use
      </Link>{" "}
      and{" "}
      <Link
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-[#6B6B6B]"
      >
        Privacy Policy
      </Link>
      . Outputs are AI-generated and may vary.
    </p>
  );
}
