import type { ButtonHTMLAttributes } from "react";

/**
 * Primary CTA for the pre-paywall funnel (upload → loading → generate → …).
 * Matches design tokens: `--color-primary` #FF7B5C, hover #FF6B4A.
 * Paywall uses black `PaywallPrimaryButton` instead.
 */
export const funnelPrimaryButtonClassName =
  "flex h-14 min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#FF7B5C] text-base font-bold text-white transition-colors duration-200 hover:bg-[#FF6B4A] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export function FunnelPrimaryButton({
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={[funnelPrimaryButtonClassName, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
