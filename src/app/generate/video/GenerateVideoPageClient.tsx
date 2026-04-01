"use client";

import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { SketchMagicLoader } from "@/components/SketchMagicLoader";
import { SkipTrialModal } from "@/components/trial/SkipTrialModal";
import { FunnelBottomDock } from "@/components/funnel/FunnelBottomDock";
import {
  FunnelPrimaryButton,
  funnelPrimaryButtonClassName,
} from "@/components/ui/FunnelPrimaryButton";
import { PAID_VIDEO_LIMIT_CODE } from "@/constants/plan";
import { TRIAL_VIDEO_EXHAUSTED_CODE, TRIAL_VIDEO_QUOTA_CHANGED_EVENT } from "@/constants/trial";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { getGeneratedVariantKeys } from "@/lib/generated-variants-cache";
import { rememberGalleryKey } from "@/lib/pending-gallery-keys";
import { getPendingUpload, getRestoredUploadState } from "@/lib/upload-store";
import { ArrowUpRight, DownloadSimple } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const VIDEO_MESSAGES = [
  "Sending your picture to the animator…",
  "Your CGI frame is in the queue…",
  "Rendering movement and light…",
  "Almost there — polishing each second…",
];

function videoCacheKey(cgiKey: string) {
  return `tinyscribble:video-for:${cgiKey.replace(/\//g, "_")}`;
}

function cgiMediaUrl(key: string) {
  return `/api/media?key=${encodeURIComponent(key)}`;
}

type VideoPhase = "idle" | "starting" | "polling" | "complete" | "error";

type BootstrapStep = "entitlement" | "funnel";

export function GenerateVideoPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlVariantRaw = Math.max(0, parseInt(searchParams.get("v") || "0", 10) || 0);

  const [baseReady, setBaseReady] = useState(false);
  const [resolvedVariantIndex, setResolvedVariantIndex] = useState(0);
  const [cgiKey, setCgiKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bootstrapStep, setBootstrapStep] = useState<BootstrapStep | null>("entitlement");
  const [bootStalled, setBootStalled] = useState(false);

  const [videoPhase, setVideoPhase] = useState<VideoPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [videoMediaUrl, setVideoMediaUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [skipTrialOpen, setSkipTrialOpen] = useState(false);
  const jobIdRef = useRef<string | null>(null);
  /** Same host that created the job (primary vs VIP APIYI gateway). */
  const apiyiBaseRef = useRef<string | null>(null);
  const pollAbortRef = useRef(false);
  const postInFlightRef = useRef(false);

  /** If bootstrap takes too long, offer escape hatch (blocked fetch, lost sessionStorage, etc.) */
  useEffect(() => {
    if (baseReady) return;
    const t = window.setTimeout(() => setBootStalled(true), 42_000);
    return () => window.clearTimeout(t);
  }, [baseReady]);

  /** Entitlement + funnel state */
  useEffect(() => {
    let cancelled = false;

    async function fetchEntitlement(): Promise<BillingEntitlementPayload> {
      const entRes = await fetch("/api/billing/entitlement", { credentials: "include" });
      return (await entRes.json()) as BillingEntitlementPayload;
    }

    function goPaywall() {
      const next = `/generate/video?v=${urlVariantRaw}`;
      window.location.assign(`/paywall?next=${encodeURIComponent(next)}`);
    }

    function goUpload() {
      window.location.assign("/upload");
    }

    function goGenerate() {
      window.location.assign("/generate");
    }

    void (async () => {
      setBootstrapStep("entitlement");
      let ent = await fetchEntitlement();
      if (cancelled) return;

      // After checkout + OTP, `billing_customers` may lag Stripe/webhooks briefly — don't
      // bounce paying users back to /paywall on the first false negative.
      if (!ent.entitled && ent.authenticated) {
        const maxAttempts = 24;
        const delayMs = 1500;
        for (let i = 0; i < maxAttempts && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, delayMs));
          ent = await fetchEntitlement();
          if (cancelled) return;
          if (ent.entitled) break;
        }
      }

      if (cancelled) return;
      if (!ent.entitled) {
        goPaywall();
        return;
      }

      setBootstrapStep("funnel");

      const pending = getPendingUpload() ?? getRestoredUploadState();
      if (!pending?.r2Key || !pending.previewUrl) {
        goUpload();
        return;
      }

      const cached = getGeneratedVariantKeys(pending.r2Key);
      const keyList = cached?.keys;
      if (!keyList?.length) {
        goGenerate();
        return;
      }
      const v = Math.min(Math.max(0, keyList.length - 1), urlVariantRaw);
      const ck = keyList[v];
      if (!ck) {
        goGenerate();
        return;
      }

      if (!cancelled) {
        setPreviewUrl(pending.previewUrl);
        setResolvedVariantIndex(v);
        setCgiKey(ck);
        setBootstrapStep(null);
        setBaseReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [urlVariantRaw]);

  const startVideoGeneration = useCallback(async (cgi: string) => {
    if (postInFlightRef.current) return;
    postInFlightRef.current = true;
    setVideoError(null);
    setProgress(5);
    setVideoPhase("starting");
    jobIdRef.current = null;
    apiyiBaseRef.current = null;
    pollAbortRef.current = false;

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cgiKey: cgi,
        }),
      });
      const data = (await res.json()) as {
        jobId?: string;
        apiyiBase?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        if (data.code === TRIAL_VIDEO_EXHAUSTED_CODE) {
          setSkipTrialOpen(true);
          setVideoPhase("idle");
          setProgress(0);
          return;
        }
        if (data.code === PAID_VIDEO_LIMIT_CODE) {
          setVideoError(
            data.error ||
              "You've used all your video credits for this billing period. They reset on your next renewal."
          );
          setVideoPhase("error");
          setProgress(0);
          return;
        }
        throw new Error(data.error || "Could not start video");
      }
      if (!data.jobId) {
        throw new Error("No job id returned");
      }
      jobIdRef.current = data.jobId;
      apiyiBaseRef.current =
        typeof data.apiyiBase === "string" && data.apiyiBase.length > 0
          ? data.apiyiBase
          : null;
      setVideoPhase("polling");
      setProgress(12);
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : "Something went wrong");
      setVideoPhase("error");
      setProgress(0);
    } finally {
      postInFlightRef.current = false;
    }
  }, []);

  /** Cached result or kick off generation */
  useEffect(() => {
    if (!baseReady || !cgiKey) return;
    if (videoPhase !== "idle") return;

    try {
      const raw = sessionStorage.getItem(videoCacheKey(cgiKey));
      if (raw) {
        const parsed = JSON.parse(raw) as { mediaUrl?: string; r2Key?: string };
        if (parsed.mediaUrl && typeof parsed.mediaUrl === "string") {
          if (typeof parsed.r2Key === "string") rememberGalleryKey(parsed.r2Key);
          setVideoMediaUrl(parsed.mediaUrl);
          setVideoPhase("complete");
          setProgress(100);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    void startVideoGeneration(cgiKey);
  }, [baseReady, cgiKey, videoPhase, startVideoGeneration]);

  /** Poll job until done */
  useEffect(() => {
    if (videoPhase !== "polling" || !jobIdRef.current) return;

    const jobId = jobIdRef.current;
    let ticks = 0;
    const started = Date.now();
    const maxMs = 10 * 60 * 1000;

    const tick = async () => {
      if (pollAbortRef.current) return;
      ticks += 1;

      // Simulated progress only — must not hit a hard cap below 100 or it looks “stuck” (old cap was 12+75=87).
      const elapsed = Date.now() - started;
      const fromTicks = 12 + Math.min(78, ticks * 3.5); // up to ~90% from poll count
      const longWaitCreep = elapsed > 45_000 ? Math.min(6, Math.floor((elapsed - 45_000) / 20_000)) : 0; // +1 every 20s after 45s
      const target = Math.min(97, fromTicks + longWaitCreep);
      setProgress((p) => Math.max(p, target));

      try {
        const qs = new URLSearchParams({ jobId });
        if (cgiKey) {
          // cgiKey is usually "generated/xxxxx.png", we must pass it so the server can save it
          qs.set("cgiKey", cgiKey);
        }
        const pollBase = apiyiBaseRef.current;
        if (pollBase) qs.set("apiyiBase", pollBase);
        const res = await fetch(`/api/generate-video?${qs.toString()}`, {
          credentials: "include",
        });
        const data = (await res.json()) as {
          status?: string;
          error?: string;
          code?: string;
          mediaUrl?: string;
          r2Key?: string;
        };

        if (data.status === "failed") {
          setVideoError(
            data.error ||
              (data.code === PAID_VIDEO_LIMIT_CODE
                ? "You've used all your video credits for this billing period."
                : "Video generation failed")
          );
          setVideoPhase("error");
          setProgress(0);
          return;
        }

        if (!res.ok) {
          setVideoError(data.error || `Video check failed (${res.status})`);
          setVideoPhase("error");
          setProgress(0);
          return;
        }

        if (data.status === "completed" && data.mediaUrl) {
          try {
            sessionStorage.setItem(
              videoCacheKey(cgiKey!),
              JSON.stringify({ mediaUrl: data.mediaUrl, r2Key: data.r2Key })
            );
          } catch {
            /* ignore */
          }
          if (typeof data.r2Key === "string") rememberGalleryKey(data.r2Key);
          setVideoMediaUrl(data.mediaUrl);
          setVideoPhase("complete");
          setProgress(100);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(TRIAL_VIDEO_QUOTA_CHANGED_EVENT));
          }
          return;
        }

        if (Date.now() - started > maxMs) {
          setVideoError("This is taking longer than expected. Try again in a moment.");
          setVideoPhase("error");
          setProgress(0);
          return;
        }

        setTimeout(tick, 4000);
      } catch {
        if (Date.now() - started > maxMs) {
          setVideoError("Connection issue — please try again.");
          setVideoPhase("error");
          setProgress(0);
          return;
        }
        setTimeout(tick, 5000);
      }
    };

    const t = setTimeout(tick, 2000);
    return () => {
      clearTimeout(t);
      pollAbortRef.current = true;
    };
  }, [videoPhase, cgiKey]);

  useEffect(() => {
    if (videoPhase !== "polling" && videoPhase !== "starting") return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % VIDEO_MESSAGES.length);
    }, 8000);
    return () => clearInterval(id);
  }, [videoPhase]);

  function handleRetry() {
    if (!cgiKey) return;
    try {
      sessionStorage.removeItem(videoCacheKey(cgiKey));
    } catch {
      /* ignore */
    }
    setVideoMediaUrl(null);
    setProgress(0);
    setVideoError(null);
    jobIdRef.current = null;
    pollAbortRef.current = false;
    void startVideoGeneration(cgiKey);
  }

  const handleShareVideo = useCallback(async () => {
    if (!videoMediaUrl) return;
    try {
      const res = await fetch(videoMediaUrl, { credentials: "include" });
      if (!res.ok) throw new Error(`Video fetch failed (${res.status})`);
      const blob = await res.blob();
      const mime =
        blob.type ||
        res.headers.get("content-type")?.split(";")[0]?.trim() ||
        "video/mp4";
      const file = new File([blob], "tinyscribble-animation.mp4", { type: mime });

      const data: ShareData = {
        files: [file],
        title: "My child's drawing!",
      };

      const canUseNativeShare =
        typeof navigator.share === "function" &&
        (!navigator.canShare || navigator.canShare(data));

      if (canUseNativeShare) {
        try {
          await navigator.share(data);
          return;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          /* fall through: e.g. desktop Chrome with flaky file share — save file instead */
        }
      }

      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "tinyscribble-animation.mp4";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("share video", e);
    }
  }, [videoMediaUrl]);

  if (!baseReady || !cgiKey || !previewUrl) {
    const bootTitle =
      bootstrapStep === "funnel"
        ? "Loading your artwork"
        : "Checking your plan";
    const bootBody =
      bootstrapStep === "funnel"
        ? "We’re pulling in your drawing and the CGI versions from this session. If you opened this link in a new device or private window, start again from Upload."
        : "This usually just takes a few seconds";

    return (
      <>
        <SkipTrialModal open={skipTrialOpen} onClose={() => setSkipTrialOpen(false)} />
        <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-[#FFF8F5] via-[#FFFAF7] to-[#FFE8E0]">
          <header className="flex shrink-0 items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
            <Logo />
            <HeaderUserAvatar />
          </header>
          <div className="flex min-h-0 flex-1 flex-col">
            <main className="flex min-h-0 flex-1 flex-col px-5">
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
                <div className="mx-auto flex w-full max-w-[min(100%,22rem)] flex-col items-center">
                  <div
                    className="w-full rounded-[1.35rem] border border-white/90 bg-white/95 px-7 py-10 text-center shadow-[0_20px_50px_-18px_rgba(255,123,92,0.25),0_0_0_1px_rgba(255,123,92,0.06)] backdrop-blur-sm"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <div
                      className="mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center [&_svg]:max-h-[3.25rem]"
                      aria-hidden
                    >
                      <SketchMagicLoader />
                    </div>
                    <h1
                      className="mb-3 text-[32px] font-bold leading-tight tracking-tight text-[#1A1A1A]"
                      style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
                    >
                      {bootTitle}
                    </h1>
                    <p
                      className={`text-[#6B6B6B] ${
                        bootstrapStep === "funnel"
                          ? "text-sm leading-relaxed"
                          : "text-xs leading-snug sm:text-[13px]"
                      }`}
                    >
                      {bootBody}
                    </p>
                    <div
                      className="mx-auto mt-8 h-1 max-w-[7rem] overflow-hidden rounded-full bg-[#FF7B5C]/15"
                      aria-hidden
                    >
                      <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#FF7B5C]/40 to-[#FF9E6C]/60" />
                    </div>
                    {bootStalled ? (
                      <p className="mt-8 border-t border-[#E8E8E8] pt-8 text-xs font-medium uppercase tracking-wider text-[#9B9B9B]">
                        Taking too long? Use the actions below.
                      </p>
                    ) : null}
                  </div>

                  <FunnelBottomDock className="w-full max-w-md">
                    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                      {bootStalled ? (
                        <>
                          <FunnelPrimaryButton
                            type="button"
                            onClick={() => window.location.assign("/upload")}
                            className="w-full"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            Start from upload
                          </FunnelPrimaryButton>
                          <button
                            type="button"
                            onClick={() => window.location.assign("/generate")}
                            className="w-full rounded-full border border-[#E8E8E8] bg-white py-3 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#FFF8F5]"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            Pick a CGI version
                          </button>
                          <button
                            type="button"
                            onClick={() => window.location.assign("/dashboard/upload")}
                            className="text-center text-sm font-semibold text-[#6B6B6B] underline underline-offset-2 hover:text-[#1A1A1A]"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            Dashboard upload
                          </button>
                        </>
                      ) : bootstrapStep === "funnel" ? (
                        <FunnelPrimaryButton
                          type="button"
                          disabled
                          className="w-full cursor-wait !opacity-90"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          Loading your artwork…
                        </FunnelPrimaryButton>
                      ) : null}
                    </div>
                  </FunnelBottomDock>
                </div>
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }

  const showGenerating = videoPhase === "starting" || videoPhase === "polling";
  const showError = videoPhase === "error";
  const showComplete = videoPhase === "complete" && videoMediaUrl;

  return (
    <>
      <SkipTrialModal open={skipTrialOpen} onClose={() => setSkipTrialOpen(false)} />
      <div className="flex h-[100dvh] min-h-[100dvh] flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
      <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
        <Logo />
        <HeaderUserAvatar />
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 flex-col px-5">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {showGenerating ? (
              <div className="flex min-h-0 flex-1 flex-col py-4">
                <div className="mx-auto flex w-full max-w-md flex-col items-center py-2 text-center">
                  <div
                    className="mb-4 w-full max-w-[min(100%,calc(54dvh*9/16))]"
                    style={{
                      animation: "fade-in 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
                      opacity: 0,
                    }}
                  >
                    <div className="relative aspect-[9/16] w-full animate-pulse overflow-hidden rounded-2xl shadow-[0_16px_48px_-20px_rgba(255,123,92,0.4)] ring-2 ring-[#FF7B5C]/35 ring-offset-2 ring-offset-[#FFF8F5]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- /api/media proxy URL */}
                      <img
                        src={cgiMediaUrl(cgiKey)}
                        alt={`CGI version ${resolvedVariantIndex + 1} — we’re animating this frame`}
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    </div>
                  </div>
                  <h1
                    className="mb-2 text-[32px] font-bold text-[#1A1A1A]"
                    style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
                  >
                    Making your video
                  </h1>
                  <p
                    className="mb-6 min-h-[48px] px-2 text-base text-[#6B6B6B]"
                    style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
                  >
                    {VIDEO_MESSAGES[messageIndex]}
                  </p>
                  <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-white/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF7B5C] to-[#FF9E6C] transition-[width] duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p
                    className="pb-mobile-browser text-sm text-[#9B9B9B]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Usually 30–90 seconds · hang tight
                  </p>
                </div>
              </div>
            ) : showError ? (
              <div className="mx-auto w-full min-w-0 max-w-md pb-4 pt-1 text-center">
                <h1
                  className="mb-3 text-[32px] font-bold text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-fredoka)" }}
                >
                  We couldn&apos;t finish the video
                </h1>
                <p className="text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                  {videoError}
                </p>

                <FunnelBottomDock>
                  <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => handleRetry()}
                      className={`${funnelPrimaryButtonClassName} w-full`}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/generate")}
                      className="w-full text-sm font-semibold text-[#6B6B6B] underline"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Back to versions
                    </button>
                  </div>
                </FunnelBottomDock>
              </div>
            ) : showComplete ? (
              <div className="w-full min-w-0 pb-4 pt-1">
                <h1
                  className="mb-6 text-center text-[32px] font-bold text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
                >
                  🎬 Your video is ready!
                </h1>

                <div className="mx-auto mb-6 aspect-[9/16] w-full max-w-[min(100%,calc(85dvh*9/16))] overflow-hidden rounded-2xl border border-white/80 bg-black">
                  <video
                    src={videoMediaUrl ?? undefined}
                    poster={cgiKey ? cgiMediaUrl(cgiKey) : undefined}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-contain bg-black"
                  />
                </div>

                <FunnelBottomDock>
                  <div className="mx-auto flex w-full max-w-md flex-row gap-3">
                    <a
                      href={videoMediaUrl ?? undefined}
                      download="tinyscribble-animation.mp4"
                      className={`${funnelPrimaryButtonClassName} flex flex-1 items-center justify-center gap-2 no-underline`}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <DownloadSimple className="h-5 w-5 shrink-0 text-white" weight="bold" aria-hidden />
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleShareVideo()}
                      className="flex h-14 min-h-[56px] flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#FF7B5C] bg-transparent px-4 text-base font-bold text-[#FF7B5C] transition-colors hover:bg-[#FF7B5C]/8 active:scale-[0.98]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <ArrowUpRight className="h-5 w-5 shrink-0" weight="bold" aria-hidden />
                      Share
                    </button>
                  </div>
                </FunnelBottomDock>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-8">
                <p className="text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                  Getting ready…
                </p>
                <FunnelBottomDock>
                  <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                    <FunnelPrimaryButton
                      type="button"
                      disabled
                      className="w-full cursor-wait !opacity-90"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Starting video…
                    </FunnelPrimaryButton>
                  </div>
                </FunnelBottomDock>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
