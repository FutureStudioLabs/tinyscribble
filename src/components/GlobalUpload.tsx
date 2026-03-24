"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setPendingUpload } from "@/lib/upload-store";

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
    // Use replace so we don't add an extra history entry if they are already on /upload
    router.replace("/loading");
    e.target.value = "";
  };

  return (
    <input
      type="file"
      accept="image/*"
      className="hidden"
      ref={inputRef}
      onChange={handleChange}
    />
  );
}
