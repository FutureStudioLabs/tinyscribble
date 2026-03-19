"use client";

import Link from "next/link";
import {
  ImagesIcon,
  CameraIcon,
  FolderIcon,
  GoogleDriveLogoIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import { Logo } from "@/components/Logo";
import { useRef, useState, useEffect } from "react";

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleUploadClick = () => {
    setMenuOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMenuOpen(false);
      // TODO: Navigate to loading screen and start API call
      // router.push("/loading");
    }
    e.target.value = "";
  };

  const openPhotoLibrary = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp"
            className="hidden"
            onChange={handleChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleChange}
          />
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              onClick={handleUploadClick}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#FF7B5C] text-white font-bold text-base transition-colors hover:bg-[#FF6B4A] active:scale-[0.98]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Upload Your Drawing
              <span className="text-lg">↑</span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                  aria-hidden="true"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  ref={menuRef}
                  className="absolute left-0 right-0 top-full mt-3 z-50 rounded-[24px] bg-zinc-800/90 backdrop-blur-xl shadow-2xl py-3 border border-white/10"
                >
                <button
                  type="button"
                  onClick={openPhotoLibrary}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left text-white hover:bg-white/10 transition-colors first:rounded-t-[24px]"
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <ImagesIcon size={24} weight="regular" color="white" />
                  </div>
                  <span className="font-medium" style={{ fontFamily: "var(--font-body)" }}>Photo Library</span>
                </button>
                <button
                  type="button"
                  onClick={openCamera}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left text-white hover:bg-white/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <CameraIcon size={24} weight="regular" color="white" />
                  </div>
                  <span className="font-medium" style={{ fontFamily: "var(--font-body)" }}>Take Photo</span>
                </button>
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left text-white hover:bg-white/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <FolderIcon size={24} weight="regular" color="white" />
                  </div>
                  <span className="font-medium" style={{ fontFamily: "var(--font-body)" }}>Choose File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left text-white/70 hover:bg-white/10 transition-colors last:rounded-b-[24px]"
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <GoogleDriveLogoIcon size={24} weight="regular" color="white" />
                  </div>
                  <span className="font-medium" style={{ fontFamily: "var(--font-body)" }}>Google Drive</span>
                </button>
              </div>
            </>
          )}
          </div>
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
