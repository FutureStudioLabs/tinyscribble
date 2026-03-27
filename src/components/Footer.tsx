"use client";

import Link from "next/link";
import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  TiktokLogoIcon,
  YoutubeLogoIcon,
  LinkedinLogoIcon,
} from "@phosphor-icons/react";

export function Footer() {
  return (
    <footer className="relative bg-[#545e66] text-white pt-12 pb-8 overflow-hidden">
      {/* Subtle curved top */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-[#545e66] rounded-b-[50%] -translate-y-1/2" />
      <div className="relative flex flex-col items-center gap-8 px-5 pt-4">
        {/* Social icons */}
        <div className="flex gap-3">
          {[
            { name: "Facebook", href: "#", Icon: FacebookLogoIcon },
            { name: "Instagram", href: "#", Icon: InstagramLogoIcon },
            { name: "TikTok", href: "#", Icon: TiktokLogoIcon },
            { name: "YouTube", href: "#", Icon: YoutubeLogoIcon },
            { name: "LinkedIn", href: "#", Icon: LinkedinLogoIcon },
          ].map(({ name, href, Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              className="flex w-10 h-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
            >
              <Icon size={20} weight="fill" color="white" />
            </a>
          ))}
        </div>
        {/* Navigation links */}
        <nav className="flex flex-col items-center gap-3">
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white text-sm transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Terms of Use
          </Link>
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white text-sm transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Privacy Policy
          </Link>
          <Link href="/cookies" className="text-white/90 hover:text-white text-sm transition-colors" style={{ fontFamily: "var(--font-body)" }}>
            Cookie Policy
          </Link>
        </nav>
        {/* Copyright */}
        <p className="text-white/70 text-xs text-center" style={{ fontFamily: "var(--font-body)" }}>
          © TinyScribble, Future Studio LLC
        </p>
      </div>
    </footer>
  );
}
