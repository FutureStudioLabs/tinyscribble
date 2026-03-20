"use client";

import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { SketchMagicLoader } from "@/components/SketchMagicLoader";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";
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

export function GenerateVideoPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const variant = Math.min(2, Math.max(0, parseInt(searchParams.get("v") || "0", 10) || 0));

  const [baseReady, setBaseReady] = useState(false);
  const [cgiKey, setCgiKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [videoPhase, setVideoPhase] = useState<VideoPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [videoMediaUrl, setVideoMediaUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const pollAbortRef = useRef(false);
  const postInFlightRef = useRef(false);

  /** Entitlement + funnel state */
  useEffect(() => {
    let cancelled = false;

    async function fetchEntitlement(): Promise<BillingEntitlementPayload> {
      const entRes = await fetch("/api/billing/entitlement", { credentials: "include" });
      return (await entRes.json()) as BillingEntitlementPayload;
    }

    void (async () => {
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
        router.replace(
          `/paywall?next=${encodeURIComponent(`/generate/video?v=${variant}`)}`
        );
        return;
      }

      const pending = getPendingUpload() ?? getRestoredUploadState();
      if (!pending?.r2Key || !pending.previewUrl) {
        router.replace("/upload");
        return;
      }

      const keys = getGeneratedVariantKeys(pending.r2Key);
      const ck = keys?.[variant];
      if (!ck) {
        router.replace("/generate");
        return;
      }

      if (!cancelled) {
        setPreviewUrl(pending.previewUrl);
        setCgiKey(ck);
        setBaseReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, variant]);

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
    return (
      <div className="flex h-[100vh] min-h-[100vh] flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
        <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
          <Logo />
          <HeaderUserAvatar />
        </header>
        <main className="flex min-h-0 flex-1 flex-col px-5">
          <div className="flex flex-1 flex-col items-center justify-center w-full text-center">
            <p className="text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
              Almost there…
            </p>
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
