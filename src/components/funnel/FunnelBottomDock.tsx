import Link from "next/link";
import type { ReactNode } from "react";

const DOCK_BG = {
  /** Matches `bg-[#FFF8F5]` (e.g. /upload, dashboard). */
  cream: "bg-[#FFF8F5]",
  /** Matches bottom of funnel gradient `to-[#FFE8E0]`. */
  funnel: "bg-[#FFE8E0]",
} as const;

/**
 * Bottom region for funnel steps: stays visible while the area above scrolls.
 * Background matches the page surface (no frosted overlay).
 */
export function FunnelBottomDock({
  children,
  className = "",
  tone = "funnel",
}: {
  children: ReactNode;
  className?: string;
  /** Align with parent: flat cream vs gradient funnel end. */
  tone?: keyof typeof DOCK_BG;
}) {
  return (
    <div
      className={`sticky bottom-0 z-30 shrink-0 border-t border-[#F0F0F0] ${DOCK_BG[tone]} ${className}`}
      style={{
        paddingTop: "0.75rem",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
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
      <Link href="/terms" className="underline underline-offset-2 hover:text-[#6B6B6B]">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="underline underline-offset-2 hover:text-[#6B6B6B]">
        Privacy Policy
      </Link>
      . Outputs are AI-generated and may vary.
    </p>
  );
}
