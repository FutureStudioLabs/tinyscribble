"use client";

import { ErrorStateIcon } from "@/components/ErrorStateIcon";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { SketchMagicLoader } from "@/components/SketchMagicLoader";
import { SupportContact } from "@/components/SupportContact";
import { CgiVariantSlider } from "@/components/generate/CgiVariantSlider";
import { CreateVideoCta } from "@/components/generate/CreateVideoCta";
import { FunnelBottomDock } from "@/components/funnel/FunnelBottomDock";
import { SkipTrialModal } from "@/components/trial/SkipTrialModal";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { TRIAL_IMAGE_LIMIT_CODE } from "@/constants/trial";
import { BillingApiError } from "@/lib/billing-api-error";
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

function readGenerateUploadState() {
  return getPendingUpload() ?? getRestoredUploadState();
}

type GenerateUploadState = NonNullable<ReturnType<typeof readGenerateUploadState>>;

export default function GeneratePage() {
  const router = useRouter();
  /** Same pattern as /loading: never read session/memory during SSR/first paint. */
  const [upload, setUpload] = useState<GenerateUploadState | null>(null);
  const [uploadReady, setUploadReady] = useState(false);
  const [status, setStatus] = useState<Status>("generating");
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [variantKeys, setVariantKeys] = useState<string[] | null>(null);
  const [activeVariant, setActiveVariant] = useState(0);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [trialImageLimitHit, setTrialImageLimitHit] = useState(false);
  const [skipTrialOpen, setSkipTrialOpen] = useState(false);
  const startedRef = useRef(false);

  useLayoutEffect(() => {
    setUpload(readGenerateUploadState());
    setUploadReady(true);
  }, []);

  useEffect(() => {
    if (!uploadReady) return;
    if (!upload) {
      router.replace("/upload");
      return;
    }
    if (!upload.r2Key) {
      router.replace("/loading");
    }
  }, [uploadReady, upload, router]);

  const runGeneration = useCallback(async () => {
    const pending = readGenerateUploadState();
    if (!pending?.r2Key) {
      setError("No uploaded drawing found. Go back and upload again.");
      setStatus("error");
      return;
    }

    setStatus("generating");
    setError(null);
    setTrialImageLimitHit(false);
    setGenerateProgress(0);

    try {
      const keys = await streamGenerateImages(pending.r2Key, setGenerateProgress);
      setVariantKeys(keys);
      setActiveVariant(0);
      setStatus("ready");
      saveGeneratedVariantKeys(pending.r2Key, keys);
    } catch (e) {
      if (e instanceof BillingApiError && e.code === TRIAL_IMAGE_LIMIT_CODE) {
        setTrialImageLimitHit(true);
        setError(e.message);
        setStatus("error");
        return;
      }
      const raw = e instanceof Error ? e.message : "Something went wrong";
      setTrialImageLimitHit(false);
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

  if (!uploadReady || !upload) {
    return (
      <div className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
        <div className="animate-pulse text-[#6B6B6B]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
      <SkipTrialModal
        open={skipTrialOpen}
        variant="image"
        onClose={() => setSkipTrialOpen(false)}
      />
      <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
        <Logo />
        <HeaderUserAvatar />
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 flex-col px-5">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {status === "generating" && (
              <div className="flex min-h-0 flex-1 flex-col py-4">
                <div className="mx-auto flex w-full max-w-md flex-col items-center py-2 text-center">
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
                    className="mb-2 text-[32px] font-bold text-[#1A1A1A]"
                    style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
                  >
                    Bringing your drawing to life…
                  </h1>
                  <p
                    className="mb-6 min-h-[48px] text-base text-[#6B6B6B]"
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

                  <p
                    className="pb-mobile-browser text-sm text-[#9B9B9B]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Usually under 2 minutes · we&apos;re creating 3 versions in parallel
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex min-h-0 flex-1 flex-col px-1 py-6">
                <div className="mx-auto flex w-full max-w-md flex-col items-center py-2 text-center">
                  <ErrorStateIcon className="mb-4" size={64} />
                  <h1
                    className="mb-3 text-[32px] font-bold text-[#1A1A1A]"
                    style={{ fontFamily: "var(--font-fredoka)" }}
                  >
                    {trialImageLimitHit ? "Trial image limit reached" : "Couldn't finish the magic"}
                  </h1>
                  <p
                    className={`text-[#6B6B6B] ${trialImageLimitHit ? "" : "mb-4"}`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {trialImageLimitHit ? error : formatErrorForUser(error ?? "")}
                  </p>
                  {trialImageLimitHit ? null : (
                    <SupportContact className="mx-auto max-w-sm" errorSummary={error} />
                  )}

                  <FunnelBottomDock>
                    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                      {trialImageLimitHit ? (
                        <FunnelPrimaryButton
                          type="button"
                          onClick={() => setSkipTrialOpen(true)}
                          className="w-full"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          Upgrade in Billing
                        </FunnelPrimaryButton>
                      ) : (
                        <FunnelPrimaryButton
                          type="button"
                          onClick={() => {
                            startedRef.current = false;
                            void runGeneration();
                          }}
                          className="w-full"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          Try again
                        </FunnelPrimaryButton>
                      )}
                      <button
                        type="button"
                        onClick={() => router.push("/upload")}
                        className="text-center text-sm text-[#6B6B6B] underline"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Start over
                      </button>
                    </div>
                  </FunnelBottomDock>
                </div>
              </div>
            )}

            {status === "ready" && variantKeys && (
              <div className="mx-auto w-full max-w-md pt-1">
                <CgiVariantSlider
                  slides={[
                    mediaUrl(variantKeys[0]),
                    mediaUrl(variantKeys[1]),
                    mediaUrl(variantKeys[2]),
                  ]}
                  activeIndex={activeVariant}
                  onActiveIndexChange={setActiveVariant}
                />
                <FunnelBottomDock>
                  <CreateVideoCta activeVariant={activeVariant} />
                </FunnelBottomDock>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
