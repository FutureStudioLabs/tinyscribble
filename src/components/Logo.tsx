"use client";

import Link from "next/link";

export interface LogoMarkProps {
  className?: string;
}

/** Wordmark only — no link. Use inside a single parent `<Link>` or `<a>` when needed. */
export function LogoMark({ className = "" }: LogoMarkProps) {
  return (
    <span
      className={`text-2xl font-bold lowercase tracking-tight inline-flex items-baseline gap-0.5 ${className}`.trim()}
      style={{ fontFamily: "var(--font-fredoka)" }}
    >
      <span
        style={{
          background: "linear-gradient(135deg, #FF7B5C 0%, #FF9E6C 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        tiny
      </span>
      <span className="rounded-lg px-1.5 py-0.5 bg-[#FF9E6C]/30">
        <span
          style={{
            background: "linear-gradient(135deg, #FF7B5C 0%, #FF9E6C 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          scribble
        </span>
      </span>
    </span>
  );
}

interface LogoProps {
  className?: string;
  /** Passed to the root link for screen readers (e.g. "Home"). */
  ariaLabel?: string;
}

/** Home link + wordmark — exactly one `<a>` in the tree. */
export function Logo({ className = "", ariaLabel }: LogoProps) {
  return (
    <Link href="/" className={className} aria-label={ariaLabel}>
      <LogoMark />
    </Link>
  );
}
