"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { ErrorStateIcon } from "@/components/ErrorStateIcon";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { SupportContact } from "@/components/SupportContact";
import {
  FunnelBottomDock,
  FunnelLegalDisclaimer,
} from "@/components/funnel/FunnelBottomDock";
import { FunnelUploadGreatExamples } from "@/components/funnel/FunnelUploadGreatExamples";
import { FunnelUploadIconBadge } from "@/components/funnel/FunnelUploadIconBadge";
import { FunnelStepIndicator } from "@/components/funnel/FunnelStepIndicator";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { setPendingUpload } from "@/lib/upload-store";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

let lastAutoOpenTime = 0;

function isMobileDevice() {
  if (typeof navigator === "undefined") return true; // SSR: skip auto-open
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMobileDevice()) return; // Mobile browsers block programmatic file input
    const now = Date.now();
    if (now - lastAutoOpenTime < 500) return; // Prevent double-open (React Strict Mode)
    lastAutoOpenTime = now;
    inputRef.current?.click();
  }, []);

  const handleClick = () => {
    setError(null);
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }
    setError(null);
    setPendingUpload(file);
    setIsUploading(true);
    router.replace("/loading");
    e.target.value = "";
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FFF8F5]">
      <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
        <Logo />
        <HeaderUserAvatar />
      </header>

      <FunnelStepIndicator step={1} className="shrink-0 px-5 pb-2" />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 flex-col px-5">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="flex flex-1 flex-col items-center justify-center py-8">
              <div className="relative mx-auto w-full max-w-md text-center">
                <FunnelUploadIconBadge className="mx-auto" />
                <h1
                  className="mb-3 text-[32px] font-bold text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
                >
                  Upload a drawing to
                  <br />
                  bring it to life
                </h1>
                <FunnelUploadGreatExamples className="mb-6" />
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/heic,image/webp"
                  className="hidden"
                  onChange={handleChange}
                />
                {error && (
                  <div className="mb-4 flex flex-col items-center space-y-3">
                    <ErrorStateIcon size={44} />
                    <p
                      className="text-center text-sm text-red-600"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {error}
                    </p>
                    <SupportContact errorSummary={error} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <FunnelBottomDock tone="cream" className="px-5">
          <div className="mx-auto flex w-full max-w-md flex-col gap-3">
            <FunnelPrimaryButton
              onClick={handleClick}
              disabled={isUploading}
              className="w-full disabled:!opacity-90"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {isUploading ? (
                <>
                  <CheckIcon size={24} weight="bold" />
                  Uploading…
                </>
              ) : (
                <>
                  Upload Your Drawing
                  <span className="text-lg">↑</span>
                </>
              )}
            </FunnelPrimaryButton>
            <FunnelLegalDisclaimer />
          </div>
        </FunnelBottomDock>
      </div>
    </div>
  );
}
