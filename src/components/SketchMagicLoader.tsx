"use client";

import { useId } from "react";

const SPARKLE_D = "M0,-5.5 L1.3,-1.3 L5.5,0 L1.3,1.3 L0,5.5 L-1.3,1.3 L-5.5,0 L-1.3,-1.3 Z";

/** 5-point star centered at (0,0), ~outer radius 11 */
const STAR5_D =
  "M0,-11 L2.6,-3.4 L10.5,-3.4 L4.2,2.6 L6.5,10.3 L0,6.4 L-6.5,10.3 L-4.2,2.6 L-10.5,-3.4 L-2.6,-3.4 Z";

const ORBIT_ANGLES = [0, 52, 118, 175, 233, 301];

/**
 * Harry Potter–style “spells in the air”: orbiting sparkles, glowing star core,
 * rising golden motes. Palette blends warm gold with TinyScribble coral + mint.
 */
export function SketchMagicLoader({ className = "" }: { className?: string }) {
  const raw = useId().replace(/:/g, "");
  const gradId = `magic-grad-${raw}`;
  const glowId = `magic-glow-${raw}`;
  const r = 32;

  return (
    <div
      className={`magic-loader-root relative flex h-[104px] w-[104px] shrink-0 items-center justify-center ${className}`.trim()}
      role="status"
      aria-label="Bringing your drawing to life"
    >
      {/* Rising motes (wand-cast dust) */}
      <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        {[12, 28, 44, 61, 78, 52].map((left, i) => (
          <span
            key={i}
            className="magic-loader-mote absolute bottom-5 h-1.5 w-1.5 rounded-full"
            style={{
              left: `${left}%`,
              animationDelay: `${i * 0.35}s`,
              background:
                i % 3 === 0
                  ? "linear-gradient(135deg, #FFE566, #FF9E6C)"
                  : i % 3 === 1
                    ? "#4ECDC4"
                    : "#FFD27A",
              boxShadow: "0 0 6px rgba(255, 229, 102, 0.9)",
            }}
          />
        ))}
      </div>

      <svg
        width="104"
        height="104"
        viewBox="0 0 100 100"
        fill="none"
        className="relative z-10 overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE566" />
            <stop offset="35%" stopColor="#FF9E6C" />
            <stop offset="100%" stopColor="#4ECDC4" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#FFE566" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#FF9E6C" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4ECDC4" stopOpacity="0" />
          </radialGradient>
          <filter id={`${raw}-soft`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient magical bloom */}
        <circle cx="50" cy="50" r="38" fill={`url(#${glowId})`} className="magic-loader-core-glow" />

        {/* Orbiting constellation */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="14s"
            repeatCount="indefinite"
          />
          {ORBIT_ANGLES.map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x = 50 + r * Math.sin(rad);
            const y = 50 - r * Math.cos(rad);
            return (
              <g key={deg} transform={`translate(${x} ${y})`}>
                <path
                  d={SPARKLE_D}
                  fill={i % 2 === 0 ? "#FFE17A" : "#FFAB8C"}
                  className="magic-loader-sparkle-twinkle"
                  style={{ animationDelay: `${i * 0.25}s` }}
                />
              </g>
            );
          })}
        </g>

        {/* Counter-spinning inner ring (subtle, “spells crossing”) */}
        <g opacity={0.85}>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 50 50"
            to="0 50 50"
            dur="22s"
            repeatCount="indefinite"
          />
          {[30, 90, 150, 210, 270, 330].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x = 50 + 22 * Math.sin(rad);
            const y = 50 - 22 * Math.cos(rad);
            return (
              <g key={deg} transform={`translate(${x} ${y})`}>
                <circle
                  cx={0}
                  cy={0}
                  r={1.4}
                  fill="#4ECDC4"
                  className="magic-loader-sparkle-twinkle"
                  style={{ animationDelay: `${0.15 + i * 0.2}s` }}
                />
              </g>
            );
          })}
        </g>

        {/* Central magical star */}
        <g transform="translate(50, 50)" filter={`url(#${raw}-soft)`}>
          <path d={STAR5_D} fill={`url(#${gradId})`} className="magic-loader-central-star" />
        </g>
      </svg>
    </div>
  );
}
