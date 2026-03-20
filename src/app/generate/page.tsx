"use client";

import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { ErrorStateIcon } from "@/components/ErrorStateIcon";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { SketchMagicLoader } from "@/components/SketchMagicLoader";
import { SupportContact } from "@/components/SupportContact";
import { CreateVideoCta } from "@/components/generate/CreateVideoCta";
import {
  FunnelPrimaryButton,
  funnelPrimaryButtonClassName,
} from "@/components/ui/FunnelPrimaryButton";
import { formatErrorForUser } from "@/lib/format-user-error";
import {
  getGeneratedVariantKeys,
  saveGeneratedVariantKeys,
} from "@/lib/generated-variants-cache";
import { streamGenerateImages } from "@/lib/stream-generate-images";
import { getPendingUpload, getRestoredUploadState } from "@/lib/upload-store";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Status = "generating" | "ready" | "error";

const MESSAGES = [
  "Our AI is studying your drawing…",
  "Adding cinematic light and depth…",
  "Almost there — this is the good part…",
  "Polishing your Pixar-style frame…",
];

function mediaUrl(key: string) {
  return `/api/media?key=${encodeURIComponent(key)}`;
}

export default function GeneratePage() {
  const router = useRouter();
  const upload =
    typeof window !== "undefined"
      ? getPendingUpload() ?? getRestoredUploadState()
      : null;
  const [status, setStatus] = useState<Status>("generating");
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [variantKeys, setVariantKeys] = useState<string[] | null>(null);
  const [activeVariant, setActiveVariant] = useState(0);
  const [generateProgress, setGenerateProgress] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!upload) {
      router.replace("/upload");
      return;
    }
    if (!upload.r2Key) {
      router.replace("/loading");
    }
  }, [upload, router]);

  const runGeneration = useCallback(async () => {
    const pending = getPendingUpload() ?? getRestoredUploadState();
    if (!pending?.r2Key) {
      setError("No uploaded drawing found. Go back and upload again.");
      setStatus("error");
      return;
    }

    setStatus("generating");
    setError(null);
    setGenerateProgress(0);

    try {
      const keys = await streamGenerateImages(pending.r2Key, setGenerateProgress);
      setVariantKeys(keys);
      setActiveVariant(0);
      setStatus("ready");
      saveGeneratedVariantKeys(pending.r2Key, keys);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Something went wrong";
      setError(raw);
      setStatus("error");
    }
  }, []);

  /** Restore ready state from session before paint — avoids flash + re-fetch when returning from paywall */
  useLayoutEffect(() => {
    if (!upload?.r2Key || startedRef.current) return;
    const cached = getGeneratedVariantKeys(upload.r2Key);
    if (cached) {
      startedRef.current = true;
      setVariantKeys(cached);
      setStatus("ready");
    }
  }, [upload?.r2Key]);

  useEffect(() => {
    if (!upload?.r2Key) return;
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus("generating");
    void runGeneration();
  }, [upload?.r2Key, runGeneration]);

  useEffect(() => {
    if (status !== "generating") return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 8000);
    return () => clearInterval(id);
  }, [status]);

  if (!upload) {
    return (
      <div className="flex h-[100vh] min-h-[100vh] items-center justify-center bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
        <div className="animate-pulse text-[#6B6B6B]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-[100vh] min-h-[100vh] flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
      <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
        <Logo />
        <HeaderUserAvatar />
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-5">
        {status === "generating" && (
          <div className="flex min-h-0 flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-1 flex-col items-center justify-center max-w-md mx-auto w-full text-center">
            <div
              className="mb-4"
              style={{
                animation: "fade-in 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
                opacity: 0,
              }}
            >
              <SketchMagicLoader />
            </div>
            <h1
              className="text-[24px] sm:text-[28px] font-bold text-[#1A1A1A] mb-2"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
            >
              Bringing your drawing to life…
            </h1>
            <p
              className="text-[#6B6B6B] text-base mb-6 min-h-[48px]"
              style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
            >
              {MESSAGES[messageIndex]}
            </p>

            <div className="mb-1 flex w-full items-center justify-between gap-3 text-xs text-[#9B9B9B]">
              <span style={{ fontFamily: "var(--font-body)" }}>Progress</span>
              <span style={{ fontFamily: "var(--font-body)" }}>{generateProgress}%</span>
            </div>
            <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-white/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF7B5C] to-[#FF9E6C] transition-[width] duration-300 ease-out"
                style={{ width: `${generateProgress}%` }}
              />
            </div>

            <p className="text-sm text-[#9B9B9B]" style={{ fontFamily: "var(--font-body)" }}>
              Usually under 2 minutes · we&apos;re creating 3 versions in parallel
            </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="flex flex-1 flex-col items-center justify-center max-w-md mx-auto w-full text-center px-1 py-6">
                <ErrorStateIcon className="mb-4" size={64} />
                <h1
                  className="text-[22px] font-bold text-[#1A1A1A] mb-3"
                  style={{ fontFamily: "var(--font-fredoka)" }}
                >
                  Couldn&apos;t finish the magic
                </h1>
                <p className="text-[#6B6B6B] mb-4" style={{ fontFamily: "var(--font-body)" }}>
                  {formatErrorForUser(error ?? "")}
                </p>
                <SupportContact className="max-w-sm mx-auto" errorSummary={error} />
              </div>
            </div>
            <div className="flex w-full max-w-md mx-auto shrink-0 flex-col gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
              <FunnelPrimaryButton
                onClick={() => {
                  startedRef.current = false;
                  void runGeneration();
                }}
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
                Start over
              </button>
            </div>
          </>
        )}

        {status === "ready" && variantKeys && (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="w-full max-w-md mx-auto pb-4 pt-1">
                <h1
                  className="text-center text-[24px] sm:text-[28px] font-bold text-[#1A1A1A] mb-2"
                  style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
                >
                  Your CGI masterpiece
                </h1>
                <p
                  className="text-center text-[#6B6B6B] text-sm mb-4"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Pick a version · drag the slider to compare
                </p>

                <div className="mb-6 flex w-full flex-wrap justify-center gap-2">
                  {([0, 1, 2] as const).map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveVariant(i)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                        activeVariant === i
                          ? "bg-[#FF7B5C] text-white"
                          : "bg-white/80 text-[#6B6B6B] border border-[#FF7B5C]/20"
                      }`}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Version {i + 1}
                    </button>
                  ))}
                </div>

                <BeforeAfterSlider
                  beforeSrc={upload.previewUrl}
                  afterSrc={mediaUrl(variantKeys[activeVariant])}
                  beforeAlt="Original drawing"
                  afterAlt="AI-generated CGI"
                  unoptimized
                />
              </div>
            </div>
            <div className="mx-auto w-full max-w-md shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
              <CreateVideoCta activeVariant={activeVariant} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
