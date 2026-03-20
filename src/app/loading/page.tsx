"use client";

import { ErrorStateIcon } from "@/components/ErrorStateIcon";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { SupportContact } from "@/components/SupportContact";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { formatErrorForUser } from "@/lib/format-user-error";
import { uploadFormDataWithProgress } from "@/lib/upload-with-progress";
import { getPendingUpload, setR2Key } from "@/lib/upload-store";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const UPLOAD_MESSAGES = [
  "Uploading to Cloudflare…",
  "Saving your drawing…",
  "Almost there…",
  "Securing your file…",
];

export default function LoadingPage() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const uploadStartedRef = useRef(false);

  // Derive during render; redirect in effect when missing
  const upload = typeof window !== "undefined" ? getPendingUpload() : null;
  const hasUpload = !!upload;

  useEffect(() => {
    if (!upload) {
      router.replace("/upload");
    }
  }, [upload, router]);

  // Upload to Cloudflare R2; progress bar completes when response arrives
  const uploadCompleteRef = useRef(false);
  useEffect(() => {
    if (!hasUpload || uploadStartedRef.current) return;
    const pending = getPendingUpload();
    if (!pending) return;
    uploadStartedRef.current = true;
    setUploadError(null);
    const file = pending.file;
    const formData = new FormData();
    formData.append("file", file);

    void uploadFormDataWithProgress("/api/upload", formData, setProgress)
      .then(({ key }) => {
        setR2Key(key);
        uploadCompleteRef.current = true;
        setUploadComplete(true);
      })
      .catch((e: unknown) => {
        uploadCompleteRef.current = true;
        setProgress(0);
        const msg = e instanceof Error ? e.message : "Something went wrong";
        setUploadError(msg);
        setUploadComplete(false);
      });
  }, [hasUpload, retryToken]);

  // Rotate upload messages
  useEffect(() => {
    if (!hasUpload || uploadComplete || uploadError) return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % UPLOAD_MESSAGES.length);
    }, 3000);
    return () => clearInterval(id);
  }, [hasUpload, uploadComplete, uploadError]);

  function handleRetryUpload() {
    uploadCompleteRef.current = false;
    uploadStartedRef.current = false;
    setProgress(0);
    setUploadError(null);
    setUploadComplete(false);
    setRetryToken((t) => t + 1);
  }

  if (!upload) {
    return (
      <div className="flex h-[100vh] min-h-[100vh] flex-col items-center justify-center bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
        <div className="animate-pulse text-[#6B6B6B]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-[100vh] min-h-[100vh] flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0] transition-opacity duration-300">
      <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
        <Logo />
        <HeaderUserAvatar />
      </header>

      <main className="flex flex-1 min-h-0 flex-col px-5">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-visible">
          <div className="flex flex-1 flex-col items-center justify-center py-6">
            <div className="w-full max-w-md mx-auto text-center overflow-visible">
            {/* Sparkle (happy path) or error icon */}
            {uploadError ? (
              <ErrorStateIcon className="mb-4" size={56} />
            ) : (
              <div
                className="mb-4 animate-pulse"
                style={{
                  animation: "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) 400ms forwards",
                  opacity: 0,
                }}
              >
                <span className="text-4xl">✨</span>
              </div>
            )}

            {/* Drawing preview card with thin animated gradient border */}
            <div
              className="relative mx-auto mb-6 w-full max-w-[min(100%,calc(85dvh*9/16))] aspect-[9/16] rounded-[24px] overflow-hidden"
              style={{
                animation: "scale-in 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards, ai-glow 2.5s ease-in-out infinite",
                opacity: 0,
              }}
            >
              {/* Thin gradient border - animates via background-position, stays within bounds */}
              <div
                className="absolute inset-0 rounded-[24px] p-[3px]"
                style={{
                  background: "linear-gradient(90deg, #FF7B5C, #FF9E6C, #4ECDC4, #FF9E6C, #FF7B5C)",
                  backgroundSize: "300% 100%",
                  animation: "gradient-border 3s ease infinite",
                }}
              >
                <div className="w-full h-full rounded-[21px] overflow-hidden bg-[#FFF8F5]">
                  {upload?.previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={upload.previewUrl}
                      alt="Your drawing"
                      className="h-full w-full object-contain bg-[#FFF8F5]"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Headline */}
            <h1
              className="text-[24px] sm:text-[28px] font-bold text-[#1A1A1A] mb-2"
              style={{
                fontFamily: "var(--font-fredoka)",
                lineHeight: 1.2,
                animation: "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms forwards",
                opacity: 0,
              }}
            >
              {uploadError
                ? "Couldn’t upload your drawing"
                : uploadComplete
                  ? "Your drawing is ready!"
                  : "Uploading to Cloudflare…"}
            </h1>

            {/* Subtext when complete */}
            {uploadComplete && !uploadError && (
              <p
                className="text-[#6B6B6B] text-base mb-6"
                style={{
                  fontFamily: "var(--font-body)",
                  lineHeight: 1.5,
                }}
              >
                Ready to bring it to life?
              </p>
            )}

            {uploadError && (
              <div className="mb-6 text-center">
                <p
                  className="text-[#6B6B6B] text-base mb-4"
                  style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
                >
                  {formatErrorForUser(uploadError)}
                </p>
                <SupportContact className="max-w-sm mx-auto" errorSummary={uploadError} />
              </div>
            )}

            {/* Rotating message (during upload) or nothing (when complete - button goes below) */}
            {!uploadComplete && !uploadError && (
              <>
                <p
                  className="text-[#6B6B6B] text-base mb-6 min-h-[24px] transition-opacity duration-500"
                  style={{
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.5,
                    animation: "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) 600ms forwards",
                    opacity: 0,
                  }}
                >
                  {UPLOAD_MESSAGES[messageIndex]}
                </p>

                {/* Progress bar — real bytes sent (XHR upload events) */}
                <div
                  className="mb-1 flex w-full items-center justify-between gap-3 text-xs text-[#9B9B9B]"
                  style={{
                    animation: "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) 500ms forwards",
                    opacity: 0,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-body)" }}>Upload</span>
                  <span style={{ fontFamily: "var(--font-body)" }}>{progress}%</span>
                </div>
                <div
                  className="h-1 w-full overflow-hidden rounded-full bg-white/60"
                  style={{
                    animation: "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) 500ms forwards",
                    opacity: 0,
                  }}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF7B5C] to-[#FF9E6C] transition-[width] duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            )}
            </div>
          </div>
        </div>

        {/* Primary actions pinned to bottom of viewport */}
        {uploadComplete && !uploadError && (
          <div className="shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <FunnelPrimaryButton
              onClick={() => router.push("/generate")}
              className="mx-auto max-w-md"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Bring your image to life
            </FunnelPrimaryButton>
          </div>
        )}

        {uploadError && (
          <div className="shrink-0 flex w-full max-w-md mx-auto flex-col gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <FunnelPrimaryButton
              onClick={handleRetryUpload}
              style={{ fontFamily: "var(--font-body)" }}
            >
              Try again
            </FunnelPrimaryButton>
            <button
              type="button"
              onClick={() => router.push("/upload")}
              className="text-sm text-[#6B6B6B] underline"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Choose a different file
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
