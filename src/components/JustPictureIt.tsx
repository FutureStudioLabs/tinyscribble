"use client";

import Image from "next/image";
import { useState } from "react";

const TABS = ["People", "Products", "Animals"] as const;

const EXAMPLES = [
  { src: "/drawing-before.png", label: "Drawing" },
  { src: "/drawing-after.png", label: "CGI" },
  { src: "/drawing-before.png", label: "Drawing" },
  { src: "/drawing-after.png", label: "CGI" },
];

export function JustPictureIt() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("People");

  return (
    <section className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5 py-12 bg-white">
      <div className="w-full max-w-lg mx-auto">
        <h2
          className="text-center text-[32px] sm:text-[28px] font-bold text-[#1A1A1A] mb-8"
          style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
        >
          Just picture it
        </h2>

        {/* Tabs — match See What's Possible */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {TABS.map((tab) => (
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

        {/* Horizontal scroll carousel — one image per card */}
        <div className="overflow-x-auto pb-4 -mx-5 px-5 snap-x snap-mandatory">
          <div className="flex gap-4 min-w-max">
            {EXAMPLES.map(({ src, label }, i) => (
              <div
                key={i}
                className="w-[320px] flex-shrink-0 snap-center flex flex-col gap-4"
              >
                <div className="rounded-xl overflow-hidden bg-[#f5f5f5] aspect-[3/4] w-full">
                  <Image
                    src={src}
                    alt={label}
                    width={288}
                    height={384}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className="text-center text-[#6B6B6B] text-sm flex-shrink-0"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
