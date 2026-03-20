"use client";

import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";
import type { BillingEntitlementPayload } from "@/lib/billing-entitlement-types";
import { getGeneratedVariantKeys } from "@/lib/generated-variants-cache";
import { getPendingUpload } from "@/lib/upload-store";
import { ArrowLeftIcon, VideoCameraIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function mediaUrl(key: string) {
  return `/api/media?key=${encodeURIComponent(key)}`;
}

export function GenerateVideoPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const variant = Math.min(2, Math.max(0, parseInt(searchParams.get("v") || "0", 10) || 0));

  const [ready, setReady] = useState(false);
  const [cgiKey, setCgiKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const entRes = await fetch("/api/billing/entitlement", { credentials: "include" });
      const ent = (await entRes.json()) as Partial<BillingEntitlementPayload>;
      if (cancelled) return;
      if (!ent.entitled) {
        if (!ent.authenticated) {
          router.replace(
            `/login?next=${encodeURIComponent(`/generate/video?v=${variant}`)}`
          );
          return;
        }
        router.replace("/paywall");
        return;
      }

      const pending = getPendingUpload();
      if (!pending?.r2Key || !pending.previewUrl) {
        router.replace("/upload");
        return;
      }

      const keys = getGeneratedVariantKeys(pending.r2Key);
      if (!keys?.[variant]) {
        router.replace("/generate");
        return;
      }

      if (!cancelled) {
        setPreviewUrl(pending.previewUrl);
        setCgiKey(keys[variant]!);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, variant]);

  if (!ready || !cgiKey || !previewUrl) {
    return (
      <div className="flex h-[100vh] min-h-[100vh] flex-col items-center justify-center bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0] px-5">
        <p className="text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
          Checking your subscription…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
      <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
        <Logo />
        <HeaderUserAvatar />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => router.push("/generate")}
          className="mb-4 flex items-center gap-2 self-start text-sm font-semibold text-[#6B6B6B] hover:text-[#1A1A1A]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <ArrowLeftIcon size={18} weight="bold" aria-hidden />
          Back to versions
        </button>

        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E8F8F0] px-3 py-1 text-xs font-semibold text-[#1B5E3F]">
          <VideoCameraIcon size={14} weight="bold" aria-hidden />
          Included in your plan
        </div>

        <h1
          className="mb-2 text-[26px] font-bold leading-tight text-[#1A1A1A] sm:text-[30px]"
          style={{ fontFamily: "var(--font-fredoka)" }}
        >
          Video from version {variant + 1}
        </h1>
        <p
          className="mb-6 text-sm leading-relaxed text-[#6B6B6B]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Your subscription is active, so you&apos;re cleared for video creation. The animator
          pipeline is still shipping — this page confirms your frame and plan. When video export is
          live, it will start from the CGI you picked below (usage limits will apply per your plan).
        </p>

        <div className="mb-6 overflow-hidden rounded-2xl border border-white/80 bg-white/60 shadow-sm">
          <BeforeAfterSlider
            beforeSrc={previewUrl}
            afterSrc={mediaUrl(cgiKey)}
            beforeAlt="Original drawing"
            afterAlt="Selected CGI frame for video"
            unoptimized
          />
        </div>

        <p
          className="mb-6 rounded-xl border border-[#FF7B5C]/20 bg-[#FFF8F5] p-4 text-sm text-[#6B6B6B]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <strong className="text-[#1A1A1A]">What happens next:</strong> we&apos;ll use this render
          as the video source. You&apos;ll get updates in{" "}
          <Link href="/dashboard/gallery" className="font-semibold text-[#FF7B5C] underline">
            Gallery
          </Link>{" "}
          and can manage billing anytime from{" "}
          <Link href="/dashboard/billing" className="font-semibold text-[#FF7B5C] underline">
            Billing
          </Link>
          .
        </p>

        <Link
          href="/dashboard/upload"
          className={`${funnelPrimaryButtonClassName} text-center no-underline`}
          style={{ fontFamily: "var(--font-body)" }}
        >
          Upload another drawing
        </Link>
      </main>
    </div>
  );
}
