"use client";

import Image from "next/image";
import Link from "next/link";

/** Intrinsic size of `public/logo_main.png` (for layout / aspect ratio). */
const LOGO_WIDTH = 1761;
const LOGO_HEIGHT = 496;

export interface LogoMarkProps {
  className?: string;
}

/**
 * Wordmark image (`/logo_main.png`) — no link.
 * Parent may wrap in `<Link>` when needed.
 */
export function LogoMark({ className = "" }: LogoMarkProps) {
  return (
    <span
      className={`inline-flex h-10 shrink-0 items-center sm:h-11 ${className}`.trim()}
    >
      <Image
        src="/logo_main.png"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className="h-full w-auto max-h-full object-contain object-left"
        sizes="(max-width: 640px) 225px, 270px"
        priority
      />
    </span>
  );
}

interface LogoProps {
  className?: string;
  /** Passed to the root link for screen readers. */
  ariaLabel?: string;
}

/** Home link + wordmark — exactly one interactive root. */
export function Logo({ className = "", ariaLabel = "Home" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <LogoMark />
    </Link>
  );
}
