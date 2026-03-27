"use client";

import { useRouter } from "next/navigation";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";

interface HomeUploadButtonProps {
  className?: string;
}

/**
 * Navigates to /upload first so iOS shows the upload step before the system picker
 * (see `?pick=1` handling on the upload page).
 */
export function HomeUploadButton({ className }: HomeUploadButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.push("/upload?pick=1");
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
