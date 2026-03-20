"use client";

import Link from "next/link";
import { ImagesIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";

type GalleryItem = {
  id: string;
  r2Key: string;
  createdAt: string;
  previewUrl: string;
};

function isVideoKey(key: string): boolean {
  return key.startsWith("videos/") || /\.mp4$/i.test(key);
}

type GalleryMediaTab = "image" | "video";

const GALLERY_MEDIA_TABS: { id: GalleryMediaTab; label: string }[] = [
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
];

export default function DashboardGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mediaTab, setMediaTab] = useState<GalleryMediaTab>("image");
  const didDefaultTab = useRef(false);

  const imageItems = useMemo(
    () => items.filter((i) => !isVideoKey(i.r2Key)),
    [items]
  );
  const videoItems = useMemo(
    () => items.filter((i) => isVideoKey(i.r2Key)),
    [items]
  );

  const visibleItems = mediaTab === "image" ? imageItems : videoItems;

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
    else if (videoItems.length === 0 && imageItems.length > 0) setMediaTab("image");
  }, [loading, items.length, imageItems.length, videoItems.length]);

  const showEmptyLibraryHero =
    !loading && !fetchError && items.length === 0;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-8">
        <div className="mx-auto mb-6 w-full max-w-2xl text-left">
          {showEmptyLibraryHero ? (
            <>
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Your library
              </p>
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] shadow-lg shadow-[#8B5CF6]/20">
                <ImagesIcon size={30} weight="bold" color="white" />
              </div>
              <h2
                className="mb-2 text-[28px] font-bold text-[#1A1A1A] sm:text-[32px]"
                style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
              >
                Gallery
              </h2>
            </>
          ) : (
            <>
              <h2
                className="mb-2 text-[28px] font-bold text-[#1A1A1A] sm:text-[32px]"
                style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
              >
                Gallery
              </h2>
              {!loading && items.length > 0 && (
                <p className="text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                  {items.length} {items.length === 1 ? "item" : "items"} from your account
                </p>
              )}
            </>
          )}
        </div>

        {!loading && !fetchError && items.length > 0 && (
          <div className="mx-auto mb-8 w-full max-w-2xl text-left">
            {/* Pills left, count right — same row, vertically centered with tabs */}
            <div className="flex items-center justify-between gap-3">
              <div
                className="flex min-w-0 flex-wrap gap-2"
                role="tablist"
                aria-label="Gallery media type"
              >
                {GALLERY_MEDIA_TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={mediaTab === id}
                    onClick={() => setMediaTab(id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      mediaTab === id
                        ? "bg-[#FF7B5C] text-white"
                        : "border border-[#FF7B5C]/30 bg-white/80 text-[#6B6B6B] hover:bg-[#FFF8F5]"
                    }`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p
                className="shrink-0 text-right text-xs font-medium tabular-nums text-[#9B9B9B]"
                style={{ fontFamily: "var(--font-body)" }}
                aria-live="polite"
              >
                {mediaTab === "image"
                  ? `${imageItems.length} photo${imageItems.length === 1 ? "" : "s"}`
                  : `${videoItems.length} video${videoItems.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-xl bg-[#EDE5E0]/80"
                aria-hidden
              />
            ))}
          </div>
        )}

        {!loading && fetchError && (
          <div className="mx-auto w-full max-w-2xl text-left">
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

        {!loading && !fetchError && items.length === 0 && (
          <div className="mx-auto w-full max-w-2xl text-left">
            <p
              className="mb-8 text-sm leading-relaxed text-[#6B6B6B] sm:text-[15px]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Finished animations and saved work will appear here. Upload a drawing on the{" "}
              <strong className="font-semibold text-[#1A1A1A]">Upload</strong> tab to get started.
            </p>
            <Link
              href="/dashboard/upload"
              className={funnelPrimaryButtonClassName + " mb-6 inline-flex w-full max-w-md justify-center no-underline"}
              style={{ fontFamily: "var(--font-body)" }}
            >
              Upload a drawing
            </Link>
            <p className="text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
              <Link
                href="/dashboard/billing"
                className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
              >
                Billing &amp; plans
              </Link>
              {" · "}
              <Link
                href="/upload"
                className="font-semibold text-[#6B6B6B] underline underline-offset-2 hover:text-[#1A1A1A]"
              >
                Standalone uploader
              </Link>
            </p>
          </div>
        )}

        {!loading &&
          !fetchError &&
          items.length > 0 &&
          visibleItems.length === 0 && (
            <div className="mx-auto w-full max-w-2xl text-left">
              <p
                className="mb-6 text-sm leading-relaxed text-[#6B6B6B] sm:text-[15px]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {mediaTab === "image" ? (
                  <>
                    No saved images yet. Generate CGI versions from the{" "}
                    <Link
                      href="/dashboard/upload"
                      className="font-semibold text-[#1A1A1A] underline decoration-[#C8C8C8] underline-offset-2 hover:decoration-[#1A1A1A]"
                    >
                      Upload
                    </Link>{" "}
                    tab.
                  </>
                ) : (
                  <>
                    No videos yet. Create one from your CGI result on the{" "}
                    <Link
                      href="/generate"
                      className="font-semibold text-[#1A1A1A] underline decoration-[#C8C8C8] underline-offset-2 hover:decoration-[#1A1A1A]"
                    >
                      Generate
                    </Link>{" "}
                    flow.
                  </>
                )}
              </p>
            </div>
          )}

        {!loading && !fetchError && items.length > 0 && visibleItems.length > 0 && (
          <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleItems.map((item) => {
              const video = isVideoKey(item.r2Key);
              return (
                <a
                  key={item.id}
                  href={item.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-xl border border-[#E8E8E8] bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square bg-[#FFF8F5]">
                    {video ? (
                      <video
                        src={item.previewUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
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
                      <span className="absolute bottom-2 left-2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Video
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
