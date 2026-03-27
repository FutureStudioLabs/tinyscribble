"use client";

import { ErrorStateIcon } from "@/components/ErrorStateIcon";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { SupportContact } from "@/components/SupportContact";
import { FunnelBottomDock } from "@/components/funnel/FunnelBottomDock";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { formatErrorForUser } from "@/lib/format-user-error";
import { uploadFormDataWithProgress } from "@/lib/upload-with-progress";
import { rememberGalleryKey } from "@/lib/pending-gallery-keys";
import { getPendingUpload, setR2Key } from "@/lib/upload-store";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const UPLOAD_MESSAGES = [
  "Preparing your upload…",
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

  /** SSR + first client paint must match; read in-memory upload only after hydration. */
  const [upload, setUpload] = useState<ReturnType<typeof getPendingUpload>>(null);
  const [uploadReady, setUploadReady] = useState(false);
  const hasUpload = uploadReady && !!upload;

  useLayoutEffect(() => {
    setUpload(getPendingUpload());
    setUploadReady(true);
  }, []);

  useEffect(() => {
    if (!uploadReady || upload) return;
    router.replace("/upload");
  }, [uploadReady, upload, router]);

  // Upload to storage (R2); progress bar completes when response arrives
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
        rememberGalleryKey(key);
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

  if (!uploadReady || !upload) {
    return (
      <div className="flex h-[100dvh] min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
        <div className="animate-pulse text-[#6B6B6B]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0] transition-opacity duration-300">
      <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
        <Logo />
        <HeaderUserAvatar />
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 flex-col px-5">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-visible">
            <div className="mx-auto my-auto flex w-full max-w-md flex-col items-center py-8 text-center">
            {uploadError ? <ErrorStateIcon className="mb-4" size={56} /> : null}

            {/* Preview only after upload succeeds — hidden while upload is in progress (3:4 matches typical drawings) */}
            {uploadComplete && !uploadError && upload?.previewUrl ? (
              <div
                className="relative mx-auto mb-6 aspect-[3/4] w-full max-w-[min(100%,calc(54dvh*3/4))] overflow-hidden rounded-2xl"
                style={{
                  animation: "scale-in 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
                  opacity: 0,
                }}
              >
                <div
                  className="absolute inset-0 rounded-2xl p-[3px]"
                  style={{
                    background: "linear-gradient(90deg, #FF7B5C, #FF9E6C, #4ECDC4, #FF9E6C, #FF7B5C)",
                    backgroundSize: "300% 100%",
                    animation: "gradient-border 3s ease infinite",
                  }}
                >
                  <div className="h-full w-full overflow-hidden rounded-[13px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={upload.previewUrl}
                      alt="Your drawing"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {uploadComplete && !uploadError ? (
              <p
                className="text-base text-[#6B6B6B]"
                style={{
                  fontFamily: "var(--font-body)",
                  lineHeight: 1.5,
                  animation: "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms forwards",
                  opacity: 0,
                }}
              >
                Your drawing is ready!
              </p>
            ) : (
              <h1
                className="mb-2 text-[32px] font-bold text-[#1A1A1A]"
                style={{
                  fontFamily: "var(--font-fredoka)",
                  lineHeight: 1.2,
                  animation: "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms forwards",
                  opacity: 0,
                }}
              >
                {uploadError ? "Couldn’t upload your drawing" : "Uploading your drawing…"}
              </h1>
            )}

            {uploadError && (
              <div className="text-center">
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

            {(uploadComplete || uploadError) && (
              <FunnelBottomDock className="w-full">
                <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                  {uploadComplete && !uploadError && (
                    <FunnelPrimaryButton
                      type="button"
                      onClick={() => router.push("/generate")}
                      className="w-full"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Bring your drawing to life ✨
                    </FunnelPrimaryButton>
                  )}
                  {uploadError && (
                    <>
                      <FunnelPrimaryButton
                        type="button"
                        onClick={handleRetryUpload}
                        className="w-full"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Try again
                      </FunnelPrimaryButton>
                      <button
                        type="button"
                        onClick={() => router.push("/upload")}
                        className="text-center text-sm text-[#6B6B6B] underline"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Choose a different file
                      </button>
                    </>
                  )}
                </div>
              </FunnelBottomDock>
            )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
