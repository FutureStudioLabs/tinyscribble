"use client";

import Link from "next/link";
import { CheckIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { ErrorStateIcon } from "@/components/ErrorStateIcon";
import { SupportContact } from "@/components/SupportContact";
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
    <div className="flex min-h-0 flex-1 flex-col px-5">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col items-center py-6 sm:py-8">
          <div className="relative w-full max-w-md text-center">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              New creation
            </p>
            <div className="group mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7B5C] to-[#FF9B7B] shadow-lg shadow-[#FF7B5C]/25 transition-all duration-300 hover:rotate-3 hover:scale-110 hover:shadow-xl hover:shadow-[#FF7B5C]/30">
              <PencilSimpleIcon
                size={28}
                weight="bold"
                color="white"
                className="transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <h2
              className="mb-2 text-[28px] font-bold leading-tight text-[#1A1A1A] sm:text-[34px]"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.15 }}
            >
              Turn a drawing into magic
            </h2>
            <p
              className="mb-4 text-sm leading-relaxed text-[#6B6B6B]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Choose a photo of your child&apos;s art. We&apos;ll take it from there — same steps as
              the main site, right from your dashboard.
            </p>
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
            <FunnelPrimaryButton
              onClick={handleClick}
              disabled={isUploading}
              className="mb-3 w-full disabled:!opacity-90"
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
            <p
              className="mx-auto max-w-sm text-center text-[13px] text-[#9B9B9B]"
              style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
            >
              JPEG, PNG, HEIC, or WebP. By uploading you agree to our{" "}
              <Link href="/terms" className="underline hover:text-[#6B6B6B]">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-[#6B6B6B]">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
