"use client";

import { useCallback, useRef } from "react";

const SWIPE_THRESHOLD = 48;

type Props = {
  slides: readonly string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
};

export function CgiVariantSlider({ slides, activeIndex, onActiveIndexChange }: Props) {
  const touchStartX = useRef<number | null>(null);
  const n = slides.length;
  const safeIndex = Math.min(Math.max(0, activeIndex), Math.max(0, n - 1));

  const go = useCallback(
    (delta: number) => {
      const next = Math.min(Math.max(0, n - 1), safeIndex + delta);
      onActiveIndexChange(next);
    },
    [n, onActiveIndexChange, safeIndex]
  );

  return (
    <div className="w-full">
      <h2
        className="mb-4 text-center text-[28px] font-bold text-[#1A1A1A] sm:text-[32px]"
        style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
      >
        Your little artist did this ✨
      </h2>
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
          if (n < 2) return;
          if (d > SWIPE_THRESHOLD) go(-1);
          else if (d < -SWIPE_THRESHOLD) go(1);
        }}
        onTouchCancel={() => {
          touchStartX.current = null;
        }}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            width: `${n * 100}%`,
            transform: `translateX(-${(safeIndex * 100) / n}%)`,
          }}
        >
          {slides.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="aspect-[9/16] shrink-0 overflow-hidden rounded-2xl"
              style={{ width: `${100 / n}%` }}
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

      {n > 1 ? (
        <>
          <div className="mt-4 flex justify-center gap-2.5" role="tablist" aria-label="CGI versions">
            {Array.from({ length: n }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={safeIndex === i}
                aria-label={`Version ${i + 1}`}
                onClick={() => onActiveIndexChange(i)}
                className={`h-2.5 w-2.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7B5C] focus-visible:ring-offset-2 ${
                  safeIndex === i ? "bg-[#FF7B5C]" : "bg-[#E8E8E8] hover:bg-[#D0D0D0]"
                }`}
              />
            ))}
          </div>

          <p
            className="mt-3 text-center text-sm text-[#6B6B6B]"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            {n === 3 ? "Swipe to see all 3 scenes" : `Swipe to see all ${n} scenes`}
          </p>
        </>
      ) : null}
    </div>
  );
}
