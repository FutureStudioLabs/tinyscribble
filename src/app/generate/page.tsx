"use client";

import { ErrorStateIcon } from "@/components/ErrorStateIcon";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { SupportContact } from "@/components/SupportContact";
import { CgiVariantSlider } from "@/components/generate/CgiVariantSlider";
import { CreateVideoCta } from "@/components/generate/CreateVideoCta";
import { FunnelBottomDock } from "@/components/funnel/FunnelBottomDock";
import { SkipTrialModal } from "@/components/trial/SkipTrialModal";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { PAID_SCENE_LIMIT_CODE } from "@/constants/plan";
import { TRIAL_IMAGE_LIMIT_CODE } from "@/constants/trial";
import { BillingApiError } from "@/lib/billing-api-error";
import { formatErrorForUser } from "@/lib/format-user-error";
import {
  getGeneratedVariantKeys,
  saveGeneratedVariantKeys,
} from "@/lib/generated-variants-cache";
import { rememberGalleryKeys } from "@/lib/pending-gallery-keys";
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
  const [sceneBatchMode, setSceneBatchMode] = useState<"single" | "triple" | null>(null);
  const [activeVariant, setActiveVariant] = useState(0);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [trialImageLimitHit, setTrialImageLimitHit] = useState(false);
  const [paidSceneLimitHit, setPaidSceneLimitHit] = useState(false);
  const [skipTrialOpen, setSkipTrialOpen] = useState(false);
  const startedRef = useRef(false);
  const variantKeysRef = useRef<string[] | null>(null);

  useEffect(() => {
    variantKeysRef.current = variantKeys;
  }, [variantKeys]);

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

  const runGeneration = useCallback(async (append?: boolean) => {
    const pending = readGenerateUploadState();
    if (!pending?.r2Key) {
      setError("No uploaded drawing found. Go back and upload again.");
      setStatus("error");
      return;
    }

    setStatus("generating");
    setError(null);
    setTrialImageLimitHit(false);
    setPaidSceneLimitHit(false);
    setGenerateProgress(0);

    try {
      const { keys: newKeys, sceneBatchMode: mode } = await streamGenerateImages(
        pending.r2Key,
        setGenerateProgress
      );
      setSceneBatchMode(mode);
      const merged = append ? [...(variantKeysRef.current ?? []), ...newKeys] : newKeys;
      setVariantKeys(merged);
      setActiveVariant(append ? merged.length - 1 : 0);
      setStatus("ready");
      saveGeneratedVariantKeys(pending.r2Key, merged, mode);
      rememberGalleryKeys([pending.r2Key, ...merged]);
    } catch (e) {
      if (e instanceof BillingApiError && e.code === TRIAL_IMAGE_LIMIT_CODE) {
        setTrialImageLimitHit(true);
        setError(e.message);
        setStatus("error");
        return;
      }
      if (e instanceof BillingApiError && e.code === PAID_SCENE_LIMIT_CODE) {
        setPaidSceneLimitHit(true);
        setError(e.message);
        setStatus("error");
        return;
      }
      const raw = e instanceof Error ? e.message : "Something went wrong";
      setTrialImageLimitHit(false);
      setPaidSceneLimitHit(false);
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
      setVariantKeys(cached.keys);
      setSceneBatchMode(cached.sceneBatchMode);
      setStatus("ready");
      rememberGalleryKeys([upload.r2Key, ...cached.keys]);
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
    if (!variantKeys?.length) return;
    setActiveVariant((i) => Math.min(i, Math.max(0, variantKeys.length - 1)));
  }, [variantKeys]);

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

  const showBillingLimit = trialImageLimitHit || paidSceneLimitHit;

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
                  <h1 className="sr-only">Bringing your drawing to life</h1>

                  {/* User upload preview — 3:4, gradient frame + pulse (matches /loading success) */}
                  <div
                    className="relative mx-auto mb-5 aspect-[3/4] w-full max-w-[min(100%,calc(54dvh*3/4))] overflow-hidden rounded-2xl"
                    style={{
                      animation: "fade-in 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
                      opacity: 0,
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl p-[3px]"
                      style={{
                        background:
                          "linear-gradient(90deg, #FF7B5C, #FF9E6C, #4ECDC4, #FF9E6C, #FF7B5C)",
                        backgroundSize: "300% 100%",
                        animation: "gradient-border 3s ease infinite",
                      }}
                    >
                      <div className="h-full w-full overflow-hidden rounded-[13px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={upload.previewUrl}
                          alt="Your drawing"
                          className="animate-drawing-preview-pulse h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  <p
                    className="mb-4 min-h-[48px] text-base text-[#6B6B6B]"
                    style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
                  >
                    {MESSAGES[messageIndex]}
                  </p>

                  <div
                    className="mb-4 h-1 w-full overflow-hidden rounded-full bg-white/60"
                    style={{
                      animation: "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms forwards",
                      opacity: 0,
                    }}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF7B5C] to-[#FF9E6C] transition-[width] duration-300 ease-out"
                      style={{ width: `${generateProgress}%` }}
                    />
                  </div>

                  <p
                    className="pb-mobile-browser text-sm text-[#9B9B9B]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Usually under 60 seconds
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
                    {trialImageLimitHit
                      ? "Trial image limit reached"
                      : paidSceneLimitHit
                        ? "No scene credits left"
                        : "Couldn't finish the magic"}
                  </h1>
                  <p
                    className={`text-[#6B6B6B] ${showBillingLimit ? "" : "mb-4"}`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {showBillingLimit ? error : formatErrorForUser(error ?? "")}
                  </p>
                  {showBillingLimit ? null : (
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
                      ) : paidSceneLimitHit ? (
                        <FunnelPrimaryButton
                          type="button"
                          onClick={() => router.push("/dashboard/billing")}
                          className="w-full"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          View billing
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

            {status === "ready" && variantKeys && variantKeys.length > 0 && (
              <div className="mx-auto w-full max-w-md pt-1">
                <CgiVariantSlider
                  slides={variantKeys.map((k) => mediaUrl(k))}
                  activeIndex={activeVariant}
                  onActiveIndexChange={setActiveVariant}
                />
                {sceneBatchMode === "single" ? (
                  <div className="mt-6 flex justify-center px-1">
                    <button
                      type="button"
                      onClick={() => void runGeneration(true)}
                      className="rounded-full border-2 border-[#FF7B5C] bg-white px-5 py-3 text-sm font-semibold text-[#FF7B5C] transition-colors hover:bg-[#FF7B5C]/5"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Generate new scene
                    </button>
                  </div>
                ) : null}
                <FunnelBottomDock>
                  <CreateVideoCta
                    activeVariant={activeVariant}
                    variantCount={variantKeys.length}
                  />
                </FunnelBottomDock>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
