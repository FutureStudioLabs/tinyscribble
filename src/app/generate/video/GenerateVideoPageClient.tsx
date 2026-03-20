"use client";

import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { SketchMagicLoader } from "@/components/SketchMagicLoader";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";
import { TRIAL_VIDEO_QUOTA_CHANGED_EVENT } from "@/constants/trial";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { getGeneratedVariantKeys } from "@/lib/generated-variants-cache";
import { getPendingUpload, getRestoredUploadState } from "@/lib/upload-store";
import { ArrowLeftIcon, VideoCameraIcon } from "@phosphor-icons/react";
import Link from "next/link";
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

type VideoPhase = "idle" | "starting" | "polling" | "complete" | "error";

type BootstrapStep = "entitlement" | "funnel";

export function GenerateVideoPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const variant = Math.min(2, Math.max(0, parseInt(searchParams.get("v") || "0", 10) || 0));

  const [baseReady, setBaseReady] = useState(false);
  const [cgiKey, setCgiKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bootstrapStep, setBootstrapStep] = useState<BootstrapStep | null>("entitlement");
  const [bootStalled, setBootStalled] = useState(false);

  const [videoPhase, setVideoPhase] = useState<VideoPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [videoMediaUrl, setVideoMediaUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const jobIdRef = useRef<string | null>(null);
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
      const next = `/generate/video?v=${variant}`;
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

      const keys = getGeneratedVariantKeys(pending.r2Key);
      const ck = keys?.[variant];
      if (!ck) {
        goGenerate();
        return;
      }

      if (!cancelled) {
        setPreviewUrl(pending.previewUrl);
        setCgiKey(ck);
        setBootstrapStep(null);
        setBaseReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [variant]);

  const startVideoGeneration = useCallback(async (cgi: string) => {
    if (postInFlightRef.current) return;
    postInFlightRef.current = true;
    setVideoError(null);
    setProgress(5);
    setVideoPhase("starting");
    jobIdRef.current = null;
    pollAbortRef.current = false;

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cgiKey: cgi }),
      });
      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Could not start video");
      }
      if (!data.jobId) {
        throw new Error("No job id returned");
      }
      jobIdRef.current = data.jobId;
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
        const parsed = JSON.parse(raw) as { mediaUrl?: string };
        if (parsed.mediaUrl && typeof parsed.mediaUrl === "string") {
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
        const res = await fetch(
          `/api/generate-video?jobId=${encodeURIComponent(jobId)}`,
          { credentials: "include" }
        );
        const data = (await res.json()) as {
          status?: string;
          error?: string;
          mediaUrl?: string;
          r2Key?: string;
        };

        if (data.status === "failed") {
          setVideoError(data.error || "Video generation failed");
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

  if (!baseReady || !cgiKey || !previewUrl) {
    const bootTitle =
      bootstrapStep === "funnel"
        ? "Loading your artwork"
        : "Checking your plan";
    const bootBody =
      bootstrapStep === "funnel"
        ? "We’re pulling in your drawing and the CGI versions from this session. If you opened this link in a new device or private window, start again from Upload."
        : "Making sure your subscription is active. Right after checkout this can take a few seconds while Stripe and your account sync.";

    return (
      <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-[#FFF8F5] via-[#FFFAF7] to-[#FFE8E0]">
        <header className="flex shrink-0 items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <Logo />
          <HeaderUserAvatar />
        </header>
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div
            className="w-full max-w-[min(100%,22rem)] rounded-[1.35rem] border border-white/90 bg-white/95 px-7 py-10 text-center shadow-[0_20px_50px_-18px_rgba(255,123,92,0.25),0_0_0_1px_rgba(255,123,92,0.06)] backdrop-blur-sm"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <div
              className="mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center [&_svg]:max-h-[3.25rem]"
              aria-hidden
            >
              <SketchMagicLoader />
            </div>
            <h1
              className="mb-3 text-[1.35rem] font-bold leading-tight tracking-tight text-[#1A1A1A] sm:text-2xl"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
            >
              {bootTitle}
            </h1>
            <p className="text-sm leading-relaxed text-[#6B6B6B]">{bootBody}</p>
            <div
              className="mx-auto mt-8 h-1 max-w-[7rem] overflow-hidden rounded-full bg-[#FF7B5C]/15"
              aria-hidden
            >
              <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#FF7B5C]/40 to-[#FF9E6C]/60" />
            </div>
            {bootStalled ? (
              <div className="mt-8 space-y-3 border-t border-[#E8E8E8] pt-8">
                <p className="text-xs font-medium text-[#9B9B9B] uppercase tracking-wider">
                  Taking too long?
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => window.location.assign("/upload")}
                    className="w-full rounded-full bg-[#FF7B5C] py-3 text-sm font-semibold text-white shadow-md shadow-[#FF7B5C]/25 transition hover:bg-[#FF6B4A]"
                  >
                    Start from upload
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.assign("/generate")}
                    className="w-full rounded-full border border-[#E8E8E8] bg-white py-3 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#FFF8F5]"
                  >
                    Pick a CGI version
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.assign("/dashboard/upload")}
                    className="text-sm font-semibold text-[#6B6B6B] underline underline-offset-2 hover:text-[#1A1A1A]"
                  >
                    Dashboard upload
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  const showGenerating = videoPhase === "starting" || videoPhase === "polling";
  const showError = videoPhase === "error";
  const showComplete = videoPhase === "complete" && videoMediaUrl;

  return (
    <div className="flex h-[100vh] min-h-[100vh] flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
      <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
        <Logo />
        <HeaderUserAvatar />
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-5">
        {showGenerating ? (
          <div className="flex min-h-0 flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-1 flex-col items-center justify-center w-full max-w-md mx-auto text-center">
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
                Making your video
              </h1>
              <p
                className="text-[#6B6B6B] text-base mb-6 min-h-[48px] px-2"
                style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
              >
                {VIDEO_MESSAGES[messageIndex]}
              </p>
              <div className="mb-1 flex w-full items-center justify-between gap-3 text-xs text-[#9B9B9B]">
                <span style={{ fontFamily: "var(--font-body)" }}>Progress</span>
                <span style={{ fontFamily: "var(--font-body)" }}>{progress}%</span>
              </div>
              <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF7B5C] to-[#FF9E6C] transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-[#9B9B9B]" style={{ fontFamily: "var(--font-body)" }}>
                Usually 30–90 seconds · hang tight
              </p>
            </div>
          </div>
        ) : showError ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="w-full min-w-0 pb-4 pt-1 max-w-md mx-auto text-center">
                <h1
                  className="text-[22px] font-bold text-[#1A1A1A] mb-3"
                  style={{ fontFamily: "var(--font-fredoka)" }}
                >
                  We couldn&apos;t finish the video
                </h1>
                <p className="text-[#6B6B6B] mb-6 text-sm" style={{ fontFamily: "var(--font-body)" }}>
                  {videoError}
                </p>
              </div>
            </div>
            <div className="w-full shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 max-w-md mx-auto space-y-3">
              <button
                type="button"
                onClick={() => handleRetry()}
                className={funnelPrimaryButtonClassName + " w-full"}
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
          </>
        ) : showComplete ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="w-full min-w-0 pb-4 pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/generate")}
                  className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#6B6B6B] hover:text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <ArrowLeftIcon size={18} weight="bold" aria-hidden />
                  Back to versions
                </button>

                <div className="mb-3 flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F8F0] px-3 py-1 text-xs font-semibold text-[#1B5E3F]">
                    <VideoCameraIcon size={14} weight="bold" aria-hidden />
                    Your video is ready
                  </span>
                </div>

                <h1
                  className="text-center text-[24px] sm:text-[28px] font-bold text-[#1A1A1A] mb-2"
                  style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
                >
                  Here&apos;s your animation
                </h1>
                <p
                  className="text-center text-[#6B6B6B] text-sm mb-6"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  From <strong className="font-semibold text-[#1A1A1A]">version {variant + 1}</strong>
                  . Download or share from your device — you can also start another from{" "}
                  <Link href="/dashboard/upload" className="font-semibold text-[#FF7B5C] underline">
                    Upload
                  </Link>
                  .
                </p>

                <div className="mb-6 mx-auto w-full max-w-[min(100%,calc(85dvh*9/16))] overflow-hidden rounded-2xl border border-white/80 bg-black shadow-sm aspect-[9/16]">
                  <video
                    src={videoMediaUrl}
                    controls
                    playsInline
                    className="h-full w-full object-contain bg-black"
                  />
                </div>

                <p
                  className="mb-2 rounded-xl border border-[#FF7B5C]/20 bg-[#FFF8F5] p-4 text-sm text-[#6B6B6B]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <strong className="text-[#1A1A1A]">Tip:</strong> find stills in{" "}
                  <Link href="/dashboard/gallery" className="font-semibold text-[#FF7B5C] underline">
                    Gallery
                  </Link>{" "}
                  · manage your plan in{" "}
                  <Link href="/dashboard/billing" className="font-semibold text-[#FF7B5C] underline">
                    Billing
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="w-full shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
              <Link
                href="/dashboard/upload"
                className={`${funnelPrimaryButtonClassName} block w-full text-center no-underline`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                Upload another drawing
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <p className="text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
              Getting ready…
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
