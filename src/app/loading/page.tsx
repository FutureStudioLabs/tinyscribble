"use client";

import { Logo } from "@/components/Logo";
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
    const file = pending.file;
    const formData = new FormData();
    formData.append("file", file);
    const start = Date.now();
    const maxDuration = 5000;

    const rafTick = () => {
      if (uploadCompleteRef.current) return;
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / maxDuration) * 100);
      setProgress((prev) => (prev >= 100 ? 100 : Math.max(prev, p)));
      if (p < 100) requestAnimationFrame(rafTick);
    };
    requestAnimationFrame(rafTick);

    fetch("/api/upload", { method: "POST", body: formData })
      .then((res) => res.json())
      .then((data) => {
        if (data?.key) setR2Key(data.key);
        uploadCompleteRef.current = true;
        setProgress(100);
        setUploadComplete(true);
      })
      .catch(() => {
        uploadCompleteRef.current = true;
        setProgress(100);
        setUploadComplete(true);
      });
  }, [hasUpload]);

  // Rotate upload messages
  useEffect(() => {
    if (!hasUpload || uploadComplete) return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % UPLOAD_MESSAGES.length);
    }, 3000);
    return () => clearInterval(id);
  }, [hasUpload, uploadComplete]);

  if (!upload) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
        <div className="animate-pulse text-[#6B6B6B]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0] transition-opacity duration-300 overflow-visible">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <Logo />
      </header>

      <main className="flex-1 flex flex-col px-5 overflow-visible">
        <div className="flex-1 flex flex-col items-center justify-center overflow-visible">
          <div className="w-full max-w-md mx-auto text-center overflow-visible">
            {/* Sparkle icon */}
            <div
              className="mb-4 animate-pulse"
              style={{
                animation: "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) 400ms forwards",
                opacity: 0,
              }}
            >
              <span className="text-4xl">✨</span>
            </div>

            {/* Drawing preview card with thin animated gradient border */}
            <div
              className="relative mx-auto mb-6 w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] rounded-[24px] overflow-hidden"
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
                      className="w-full h-full object-cover"
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
              {uploadComplete ? "Your drawing is ready!" : "Uploading to Cloudflare…"}
            </h1>

            {/* Subtext when complete */}
            {uploadComplete && (
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

            {/* Rotating message (during upload) or nothing (when complete - button goes below) */}
            {!uploadComplete && (
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

                {/* Progress bar - upload to Cloudflare */}
                <div
                  className="w-full h-1 bg-white/60 rounded-full overflow-hidden"
                  style={{
                    animation: "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) 500ms forwards",
                    opacity: 0,
                  }}
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#FF7B5C] to-[#FF9E6C] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Primary CTA at bottom - thumb-friendly, natural flow */}
        {uploadComplete && (
          <div className="pb-8 pt-4">
            <button
              type="button"
              onClick={() => router.push("/generate")}
              className="flex h-14 w-full max-w-md mx-auto items-center justify-center rounded-full bg-[#FF7B5C] text-white font-bold text-base transition-all duration-200 hover:bg-[#FF6B4A] active:scale-[0.98]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Bring your image to life
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
