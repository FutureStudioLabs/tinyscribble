import { UploadSimpleIcon } from "@phosphor-icons/react";

/** Upload arrow in gradient tile — `/upload` and dashboard upload (step 1). Box is 64×64px (`h-16 w-16`). */
export function FunnelUploadIconBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`group mb-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7B5C] to-[#FF9B7B] shadow-lg shadow-[#FF7B5C]/25 transition-all duration-300 hover:rotate-3 hover:scale-110 hover:shadow-xl hover:shadow-[#FF7B5C]/30 ${className}`.trim()}
    >
      <UploadSimpleIcon
        size={28}
        weight="bold"
        color="white"
        className="transition-transform duration-300 group-hover:scale-110"
      />
    </div>
  );
}
