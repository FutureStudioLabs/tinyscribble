"use client";

import { useRouter } from "next/navigation";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";

interface HomeUploadButtonProps {
  className?: string;
}

export function HomeUploadButton({ className }: HomeUploadButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Trigger the global file input synchronously (works on iOS Safari)
    window.dispatchEvent(new CustomEvent("trigger-global-upload"));
    // Navigate to /upload in the background so the user sees it if they cancel the picker
    router.push("/upload");
  };

  return (
    <button
      onClick={handleClick}
      className={className || funnelPrimaryButtonClassName}
      style={{ fontFamily: "var(--font-body)" }}
    >
      Upload Your Drawing
      <span className="text-lg">↑</span>
    </button>
  );
}
