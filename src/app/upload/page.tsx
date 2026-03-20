"use client";

import Link from "next/link";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import { CheckIcon } from "@phosphor-icons/react";
import { ErrorStateIcon } from "@/components/ErrorStateIcon";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { SupportContact } from "@/components/SupportContact";
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
    <div className="flex h-[100vh] min-h-[100vh] flex-col bg-[#FFF8F5]">
      <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
        <Logo />
        <HeaderUserAvatar />
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-5">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex flex-1 flex-col items-center justify-center py-8">
            <div className="relative mx-auto w-full max-w-md text-center">
              <div className="group mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7B5C] to-[#FF9B7B] shadow-lg shadow-[#FF7B5C]/25 transition-all duration-300 hover:rotate-3 hover:scale-110 hover:shadow-xl hover:shadow-[#FF7B5C]/30">
                <PencilSimpleIcon
                  size={28}
                  weight="bold"
                  color="white"
                  className="transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <h1
                className="mb-6 text-[40px] font-bold text-[#1A1A1A]"
                style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
              >
                Upload a drawing to bring it to life
              </h1>
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

        <div className="mx-auto w-full max-w-md shrink-0 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
          <FunnelPrimaryButton
            onClick={handleClick}
            disabled={isUploading}
            className="disabled:!opacity-90"
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
          <p
            className="mx-auto max-w-sm text-center text-[13px] text-[#9B9B9B]"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            By uploading a drawing you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[#6B6B6B]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-[#6B6B6B]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
