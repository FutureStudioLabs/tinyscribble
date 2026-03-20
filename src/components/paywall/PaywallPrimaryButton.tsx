import type { ButtonHTMLAttributes } from "react";

/** Cal-style full-width black CTA — same specs on trial, exit, and restore modal. */
export const paywallPrimaryButtonClassName =
  "flex h-14 min-h-[56px] w-full items-center justify-center rounded-full bg-[#1A1A1A] text-base font-bold text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export function PaywallPrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={[paywallPrimaryButtonClassName, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
