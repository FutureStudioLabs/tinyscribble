"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  /** Auto-reveal from right to left on load */
  autoReveal?: boolean;
  /** Use for blob: URLs or when Next/Image remote config is not needed */
  unoptimized?: boolean;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = "Child's original drawing",
  afterAlt = "AI-generated CGI result",
  autoReveal = true,
  unoptimized = false,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(100); // Start with full "after" (right side)
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(percent);
    },
    []
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging.current && e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  // Auto-reveal: animate from right (100) to center (50) on load
  useEffect(() => {
    if (!autoReveal) return;
    const duration = 1500;
    const start = 100;
    const end = 50;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 2; // ease-out
      setPosition(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [autoReveal]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] min-h-[320px] rounded-2xl overflow-hidden select-none touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Before image (full width, underneath) */}
      <div className="absolute inset-0">
        <Image
          src={beforeSrc}
          alt={beforeAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 600px"
          priority
          unoptimized={unoptimized}
        />
      </div>

      {/* After image (clipped by position) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={afterSrc}
          alt={afterAlt}
          fill
          className="object-cover object-[left_top]"
          sizes="(max-width: 768px) 100vw, 600px"
          priority
          unoptimized={unoptimized}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-lg z-10"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      />

      {/* Handle with star emoji */}
      <div
        className="absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg border-2 border-[#FF7B5C]/30 cursor-ew-resize touch-none"
        style={{ left: `${position}%`, transform: "translate(-50%, -50%)" }}
      >
        <span className="text-2xl" aria-hidden>
          ⭐
        </span>
      </div>
    </div>
  );
}
