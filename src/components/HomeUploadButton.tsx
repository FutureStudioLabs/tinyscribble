"use client";

import { useRouter } from "next/navigation";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";
import { setPendingUpload } from "@/lib/upload-store";

const ACCEPT = "image/jpeg,image/png,image/heic,image/webp";

interface HomeUploadButtonProps {
  className?: string;
}

/**
 * File input is overlaid on the visible button so the system file sheet / dialog
 * anchors to the same rect as the CTA (not a hidden input at 0,0).
 */
export function HomeUploadButton({ className }: HomeUploadButtonProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }
    setPendingUpload(file);
    router.replace("/loading");
    e.target.value = "";
  };

  return (
    <label
      className={[className || funnelPrimaryButtonClassName, "relative"]
        .filter(Boolean)
        .join(" ")}
      style={{ fontFamily: "var(--font-body)" }}
      onClick={() => router.push("/upload")}
    >
      <input
        type="file"
        accept={ACCEPT}
        className="absolute inset-0 z-10 h-full min-h-[56px] w-full cursor-pointer opacity-0"
        onChange={handleChange}
      />
      <span className="pointer-events-none flex w-full items-center justify-center gap-2">
        Upload Your Drawing
        <span className="text-lg">↑</span>
      </span>
    </label>
  );
}
