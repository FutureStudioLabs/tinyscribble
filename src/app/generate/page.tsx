"use client";

import { Logo } from "@/components/Logo";
import { getPendingUpload } from "@/lib/upload-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GeneratePage() {
  const router = useRouter();
  const upload = typeof window !== "undefined" ? getPendingUpload() : null;

  useEffect(() => {
    if (!upload) {
      router.replace("/upload");
    }
  }, [upload, router]);

  if (!upload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
        <div className="animate-pulse text-[#6B6B6B]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0]">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <Logo />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-md mx-auto text-center">
          <h1
            className="text-[24px] sm:text-[28px] font-bold text-[#1A1A1A] mb-4"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            Bring your image to life
          </h1>
          <p
            className="text-[#6B6B6B] text-base mb-6"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            Image generation coming soon…
          </p>
        </div>
      </main>
    </div>
  );
}
