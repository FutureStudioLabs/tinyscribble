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
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import type { ExamplePickInfo } from "@/components/funnel/FunnelUploadGreatExamples";
import { setPendingUpload } from "@/lib/upload-store";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleExamplePick = useCallback(
    async ({ src, filename }: ExamplePickInfo) => {
      setError(null);
      setIsUploading(true);
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        const mime =
          blob.type ||
          (filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
        const file = new File([blob], filename, { type: mime });
        setPendingUpload(file);
        router.replace("/loading");
      } catch {
        setError("Could not load that example. Try another or upload your own.");
        setIsUploading(false);
      }
    },
    [router]
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FFF8F5]">
      <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
        <Logo />
        <HeaderUserAvatar />
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 flex-col px-5">
          {/* Block flow only — avoids flex distributing extra height between copy and CTA */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-md grow-0 flex-col items-center pt-8 text-center">
              <FunnelUploadIconBadge className="mx-auto" />
              <h1
                className="mb-5 text-[32px] font-bold text-[#1A1A1A]"
                style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
              >
                Upload a drawing to
                <br />
                bring it to life
              </h1>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic,image/webp"
                className="hidden"
                onChange={handleChange}
              />
              <FunnelPrimaryButton
                onClick={handleClick}
                disabled={isUploading}
                className="mb-6 w-full max-w-md disabled:!opacity-90"
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
              <FunnelUploadGreatExamples
                className="mb-0"
                onExamplePick={handleExamplePick}
                examplesDisabled={isUploading}
              />
              {error && (
                <div className="mb-4 mt-4 flex flex-col items-center space-y-3">
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

              <FunnelBottomDock tone="cream" className="w-full">
                <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                  <FunnelLegalDisclaimer />
                </div>
              </FunnelBottomDock>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
