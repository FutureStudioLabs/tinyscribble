import Link from "next/link";

/** Matches dashboard mock: “By uploading…” (not funnel “By continuing…”). */
export function DashboardUploadLegal({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-center text-[12px] leading-snug text-[#9B9B9B] sm:text-[13px] ${className}`.trim()}
      style={{ fontFamily: "var(--font-body)" }}
    >
      By uploading you agree to our{" "}
      <Link
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-[#6B6B6B]"
      >
        Terms
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
      .
    </p>
  );
}
