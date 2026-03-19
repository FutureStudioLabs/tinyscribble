"use client";

import Link from "next/link";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import { Logo } from "@/components/Logo";
import { useRef, useEffect } from "react";

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.click();
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Navigate to loading screen and start API call
      // router.push("/loading");
    }
    e.target.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5]">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <Logo />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-md mx-auto text-center relative">
          <div className="group inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF7B5C] to-[#FF9B7B] shadow-lg shadow-[#FF7B5C]/25 mb-6 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#FF7B5C]/30 hover:rotate-3">
            <PencilSimpleIcon
              size={28}
              weight="bold"
              color="white"
              className="transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <h1
            className="text-[40px] font-bold text-[#1A1A1A] mb-6"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            Upload a drawing to bring it to life
          </h1>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp"
            className="hidden"
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={handleClick}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#FF7B5C] text-white font-bold text-base transition-colors hover:bg-[#FF6B4A] active:scale-[0.98]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Upload Your Drawing
            <span className="text-lg">↑</span>
          </button>
          <p
            className="mt-6 text-center text-[13px] text-[#9B9B9B] max-w-sm mx-auto"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            By uploading a drawing you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[#6B6B6B]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-[#6B6B6B]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
