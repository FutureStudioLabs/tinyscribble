import { WarningCircleIcon } from "@phosphor-icons/react";

type ErrorStateIconProps = {
  /** Default 56; use ~40 for compact inline errors */
  size?: number;
  className?: string;
};

/**
 * Shared “something went wrong” mark for error screens (matches TinyScribble coral palette).
 */
export function ErrorStateIcon({ size = 56, className = "" }: ErrorStateIconProps) {
  return (
    <div
      className={`flex justify-center ${className}`.trim()}
      role="img"
      aria-label="Error"
    >
      <WarningCircleIcon
        size={size}
        weight="duotone"
        className="text-[#E85D4C]"
        aria-hidden
      />
    </div>
  );
}
