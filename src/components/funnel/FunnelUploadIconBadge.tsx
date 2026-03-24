import { UploadSimpleIcon } from "@phosphor-icons/react";

/** Simple upload icon above `/upload` headline — no background tile. */
export function FunnelUploadIconBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`mb-5 flex shrink-0 justify-center ${className}`.trim()}>
      <UploadSimpleIcon
        size={40}
        weight="regular"
        className="text-[#FF7B5C]"
        aria-hidden
      />
    </div>
  );
}
