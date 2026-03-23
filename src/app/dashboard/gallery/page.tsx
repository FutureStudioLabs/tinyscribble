"use client";

import Link from "next/link";
import {
  PlusIcon,
  PlayIcon,
  SparkleIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
type GalleryItem = {
  id: string;
  r2Key: string;
  createdAt: string;
  previewUrl: string;
};

function isVideoKey(key: string): boolean {
  return key.startsWith("videos/") || /\.mp4$/i.test(key);
}

/** Video grid cell — first frame can be slow over /api/media; show spinner until ready. */
function GalleryVideoPreview({ previewUrl }: { previewUrl: string }) {
  const [thumbReady, setThumbReady] = useState(false);

  return (
    <>
      <video
        src={previewUrl}
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
        onLoadedData={() => setThumbReady(true)}
        onError={() => setThumbReady(true)}
      />
      {!thumbReady ? (
        <span
          className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/92 shadow-sm ring-1 ring-black/[0.06]"
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Loading preview</span>
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#F28B66] border-t-transparent"
            aria-hidden
          />
        </span>
      ) : null}
    </>
  );
}

/** e.g. "15 Mar" */
function formatGalleryDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(d);
  } catch {
    return "";
  }
}

type GalleryMediaTab = "video" | "scene";

const TABS: { id: GalleryMediaTab; label: string }[] = [
  { id: "video", label: "Videos" },
  { id: "scene", label: "Scenes" },
];

/** Gallery filter — compact centered chips (distinct from Upload / Gallery full-width segment). */
function GallerySegmentTabs({
  active,
  onChange,
}: {
  active: GalleryMediaTab;
  onChange: (id: GalleryMediaTab) => void;
}) {
  return (
    <div
      className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3"
      role="tablist"
      aria-label="Gallery media type"
    >
      {TABS.map(({ id, label }) => {
        const isActive = active === id;
        const isVideo = id === "video";
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold tracking-tight transition-all duration-200 active:scale-[0.98] ${
              isActive
                ? "bg-gradient-to-r from-[#FF7B5C] to-[#FF9E6C] text-white shadow-[0_4px_16px_-4px_rgba(255,123,92,0.55)]"
                : "border border-[#E8E4E0] bg-white text-[#5C5C5C] shadow-sm hover:border-[#FF7B5C]/35 hover:bg-[#FFF8F5] hover:text-[#1A1A1A]"
            }`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            {isVideo ? (
              <VideoCameraIcon
                size={20}
                weight={isActive ? "fill" : "regular"}
                className={isActive ? "text-white" : "text-[#FF7B5C]/80"}
              />
            ) : (
              <SparkleIcon
                size={20}
                weight={isActive ? "fill" : "regular"}
                className={isActive ? "text-white" : "text-[#FF7B5C]/80"}
              />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}


export default function DashboardGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mediaTab, setMediaTab] = useState<GalleryMediaTab>("scene");
  const didDefaultTab = useRef(false);

  const imageItems = useMemo(
    () => items.filter((i) => !isVideoKey(i.r2Key)),
    [items]
  );
  const videoItems = useMemo(
    () => items.filter((i) => isVideoKey(i.r2Key)),
    [items]
  );

  const visibleItems = mediaTab === "scene" ? imageItems : videoItems;

  const load = useCallback(() => {
    setFetchError(null);
    setLoading(true);
    fetch("/api/gallery", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { items?: GalleryItem[]; error?: string }) => {
        if (data.error) setFetchError(data.error);
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => setFetchError("Couldn’t load your gallery."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading || didDefaultTab.current || items.length === 0) return;
    didDefaultTab.current = true;
    if (imageItems.length === 0 && videoItems.length > 0) setMediaTab("video");
    else if (videoItems.length === 0 && imageItems.length > 0) setMediaTab("scene");
  }, [loading, items.length, imageItems.length, videoItems.length]);

  const newHref = mediaTab === "scene" ? "/dashboard/upload" : "/generate/video";
  const newLabel = mediaTab === "scene" ? "New scene" : "New video";

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto pb-10 pt-4">
        {!loading && fetchError && (
          <div className="mb-6 text-left">
            <p className="mb-4 text-sm text-red-600" style={{ fontFamily: "var(--font-body)" }}>
              {fetchError}
            </p>
            <button
              type="button"
              onClick={load}
              className="text-sm font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Try again
            </button>
          </div>
        )}

        {!fetchError && (
          <>
            <div className="mb-5">
              <GallerySegmentTabs active={mediaTab} onChange={setMediaTab} />
            </div>

            {loading && (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square animate-pulse rounded-2xl bg-[#F5EDE8]/90"
                    aria-hidden
                  />
                ))}
              </div>
            )}

            {!loading && !fetchError && items.length === 0 && (
              <div className="space-y-6">
                <p
                  className="text-sm leading-relaxed text-[#6B6B6B]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Finished work will show up here. Start with{" "}
                  <strong className="font-semibold text-[#1A1A1A]">New scene</strong> or{" "}
                  <strong className="font-semibold text-[#1A1A1A]">New video</strong> below.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/dashboard/upload"
                    className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#F28B66] bg-[#FDF8F5] text-[#F28B66] transition hover:bg-[#FAF4EF]"
                  >
                    <PlusIcon size={32} weight="bold" />
                    <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)" }}>
                      New scene
                    </span>
                  </Link>
                  <Link
                    href="/generate/video"
                    className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#F28B66] bg-[#FDF8F5] text-[#F28B66] transition hover:bg-[#FAF4EF]"
                  >
                    <PlusIcon size={32} weight="bold" />
                    <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)" }}>
                      New video
                    </span>
                  </Link>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="inline-block text-sm font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Billing &amp; plans
                </Link>
              </div>
            )}

            {!loading && !fetchError && items.length > 0 && visibleItems.length === 0 && (
              <div className="space-y-4">
                <p
                  className="text-sm leading-relaxed text-[#6B6B6B]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {mediaTab === "scene"
                    ? "No scenes saved yet."
                    : "No videos saved yet."}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={newHref}
                    className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#F28B66] bg-[#FDF8F5] text-[#F28B66] transition hover:bg-[#FAF4EF]"
                  >
                    <PlusIcon size={32} weight="bold" />
                    <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)" }}>
                      {newLabel}
                    </span>
                  </Link>
                </div>
              </div>
            )}

            {!loading && !fetchError && items.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {visibleItems.map((item) => {
                  const video = isVideoKey(item.r2Key);
                  const dateStr = formatGalleryDate(item.createdAt);
                  return (
                    <a
                      key={item.id}
                      href={item.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-[#FDF8F5] shadow-sm ring-1 ring-black/[0.04]"
                    >
                      <div className="relative h-full w-full">
                        {video ? (
                          <GalleryVideoPreview previewUrl={item.previewUrl} />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element -- proxied same-origin URL from R2
                          <img
                            src={item.previewUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                        )}
                        {video && (
                          <span
                            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F28B66] text-white shadow-md shadow-[#F28B66]/35"
                            aria-hidden
                          >
                            <PlayIcon size={22} weight="fill" className="ml-0.5" />
                          </span>
                        )}
                        {dateStr ? (
                          <span
                            className="absolute bottom-2.5 left-2.5 text-[11px] font-medium text-[#9B9B9B]"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            {dateStr}
                          </span>
                        ) : null}
                      </div>
                    </a>
                  );
                })}

                <Link
                  href={newHref}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#F28B66] bg-[#FDF8F5] text-[#F28B66] transition hover:bg-[#FAF4EF]"
                >
                  <PlusIcon size={32} weight="bold" />
                  <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)" }}>
                    {newLabel}
                  </span>
                </Link>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}
