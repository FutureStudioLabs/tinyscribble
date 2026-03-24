"use client";

import { useRouter } from "next/navigation";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";

interface HomeUploadButtonProps {
  className?: string;
}

/**
 * Opens the global file input (see GlobalUpload in layout) so the input survives
 * navigation to /upload; then navigates so cancel lands on the upload step.
 */
export function HomeUploadButton({ className }: HomeUploadButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("trigger-global-upload"));
    router.push("/upload");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className || funnelPrimaryButtonClassName}
      style={{ fontFamily: "var(--font-body)" }}
    >
      Upload Your Drawing
    </button>
  );
}
