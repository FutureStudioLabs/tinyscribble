"use client";

import {
  JUST_PICTURE_IT_INDICES_BY_TAB,
  JUST_PICTURE_IT_TABS,
  JUST_PICTURE_IT_VIDEO_PATHS,
  type JustPictureItTab,
} from "@/data/justPictureItVideos";
import { useEffect, useRef, useState } from "react";

function JustPictureItVideoCard({ src, index }: { src: string; index: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const container = wrapRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void video.play().catch(() => {
            /* autoplay policy — ignore */
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.55, rootMargin: "0px" }
    );
    io.observe(container);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="w-[320px] flex-shrink-0 snap-center flex flex-col gap-3"
    >
      <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#1a1a1a]/[0.06]">
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          aria-label={`TinyScribble example animation ${index + 1}`}
        />
      </div>
    </div>
  );
}

export function JustPictureIt() {
  const [activeTab, setActiveTab] = useState<JustPictureItTab>("People");

  const indices = JUST_PICTURE_IT_INDICES_BY_TAB[activeTab];
  const videos = indices.map((i) => ({
    src: JUST_PICTURE_IT_VIDEO_PATHS[i]!,
    index: i,
  }));

  return (
    <section className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5 py-12 bg-white">
      <div className="w-full max-w-lg mx-auto">
        <h2
          className="text-center text-[32px] sm:text-[28px] font-bold text-[#1A1A1A] mb-8"
          style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
        >
          Just picture it
        </h2>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {JUST_PICTURE_IT_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#FF7B5C] text-white"
                  : "bg-white/80 text-[#6B6B6B] border border-[#FF7B5C]/30 hover:bg-[#FFF8F5]"
              }`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto pb-4 -mx-5 px-5 snap-x snap-mandatory">
          <div className="flex min-w-max gap-4">
            {videos.map(({ src, index }) => (
              <JustPictureItVideoCard key={src} src={src} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
