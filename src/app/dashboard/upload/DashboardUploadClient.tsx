"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { ErrorStateIcon } from "@/components/ErrorStateIcon";
import { SupportContact } from "@/components/SupportContact";
import {
  FunnelBottomDock,
  FunnelLegalDisclaimer,
} from "@/components/funnel/FunnelBottomDock";
import { FunnelUploadGreatExamples } from "@/components/funnel/FunnelUploadGreatExamples";
import { FunnelUploadIconBadge } from "@/components/funnel/FunnelUploadIconBadge";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { setPendingUpload } from "@/lib/upload-store";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function DashboardUploadClient() {
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col px-5">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-md flex-col items-center py-6 text-center sm:py-8">
            <p
              className="mb-5 text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              New creation
            </p>
            <FunnelUploadIconBadge className="mx-auto" />
            <h2
              className="mb-4 text-[32px] font-bold leading-tight text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.15 }}
            >
              Turn a drawing into magic
            </h2>
            <p
              className="mb-3 text-center text-[13px] text-[#9B9B9B]"
              style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
            >
              JPEG, PNG, HEIC, or WebP.
            </p>
            <FunnelUploadGreatExamples className="mb-0" />
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

          <FunnelBottomDock tone="cream">
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
                    Starting…
                  </>
                ) : (
                  <>
                    Choose drawing
                    <span className="text-lg">↑</span>
                  </>
                )}
              </FunnelPrimaryButton>
              <FunnelLegalDisclaimer />
            </div>
          </FunnelBottomDock>
        </div>
      </div>
    </div>
  );
}
