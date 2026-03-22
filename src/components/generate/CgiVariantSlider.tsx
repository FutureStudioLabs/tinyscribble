"use client";

import { useCallback, useRef } from "react";

const SWIPE_THRESHOLD = 48;

type Props = {
  slides: readonly [string, string, string];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
};

export function CgiVariantSlider({ slides, activeIndex, onActiveIndexChange }: Props) {
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      const next = Math.min(2, Math.max(0, activeIndex + delta));
      onActiveIndexChange(next);
    },
    [activeIndex, onActiveIndexChange]
  );

  return (
    <div className="w-full">
      <div
        className="relative mx-auto w-full max-w-[min(100%,calc(54dvh*9/16))] touch-pan-y overflow-hidden"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const end = e.changedTouches[0]?.clientX;
          if (end == null) return;
          const d = end - touchStartX.current;
          touchStartX.current = null;
          if (d > SWIPE_THRESHOLD) go(-1);
          else if (d < -SWIPE_THRESHOLD) go(1);
        }}
        onTouchCancel={() => {
          touchStartX.current = null;
        }}
      >
        <div
          className="flex w-[300%] transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${(activeIndex * 100) / 3}%)` }}
        >
          {slides.map((src, i) => (
            <div
              key={src}
              className="aspect-[9/16] w-1/3 shrink-0 overflow-hidden rounded-2xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- /api/media URLs */}
              <img
                src={src}
                alt={`CGI version ${i + 1}`}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2.5" role="tablist" aria-label="CGI versions">
        {([0, 1, 2] as const).map((i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={activeIndex === i}
            aria-label={`Version ${i + 1}`}
            onClick={() => onActiveIndexChange(i)}
            className={`h-2.5 w-2.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7B5C] focus-visible:ring-offset-2 ${
              activeIndex === i ? "bg-[#FF7B5C]" : "bg-[#E8E8E8] hover:bg-[#D0D0D0]"
            }`}
          />
        ))}
      </div>

      <p
        className="mt-3 text-center text-sm text-[#6B6B6B]"
        style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
      >
        Swipe or tap a dot to browse the three styles
      </p>
    </div>
  );
}
