"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setPendingUpload } from "@/lib/upload-store";

const ACCEPT = "image/jpeg,image/png,image/heic,image/webp";

/**
 * Root-level file input so it survives `router.push` from the home CTA while the
 * system picker is open. If the input lived only in HomeUploadButton, navigation
 * would unmount it and the first file selection would never fire onChange.
 */
export function GlobalUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleTrigger = () => {
      inputRef.current?.click();
    };
    window.addEventListener("trigger-global-upload", handleTrigger);
    return () => window.removeEventListener("trigger-global-upload", handleTrigger);
  }, []);

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
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT}
      className="hidden"
      aria-hidden
      tabIndex={-1}
      onChange={handleChange}
    />
  );
}
