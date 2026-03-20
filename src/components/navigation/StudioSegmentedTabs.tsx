"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/upload", label: "Upload" },
  { href: "/dashboard/gallery", label: "Gallery" },
] as const;

function activeIndexForPath(pathname: string | null): number | null {
  if (!pathname) return 0;
  if (pathname === "/dashboard/gallery" || pathname.startsWith("/dashboard/gallery/")) return 1;
  if (pathname === "/dashboard/upload" || pathname.startsWith("/dashboard/upload/")) return 0;
  if (pathname === "/dashboard/billing" || pathname.startsWith("/dashboard/billing/")) return null;
  if (pathname === "/dashboard" || pathname === "/dashboard/") return 0;
  return 0;
}

export function StudioSegmentedTabs() {
  const pathname = usePathname();
  const active = activeIndexForPath(pathname);

  return (
    <div className="relative z-0 mx-auto w-full max-w-md shrink-0 px-5 pt-3 pb-4">
      <div
        className="relative isolate flex w-full rounded-2xl bg-[#EDE5E0]/90 p-[5px] shadow-inner shadow-black/[0.04]"
        role="tablist"
        aria-label="Dashboard sections"
      >
        {/* Sliding pill — hidden on /dashboard/billing (not an Upload/Gallery tab) */}
        <span
          aria-hidden
          className={`pointer-events-none absolute top-[5px] h-[calc(100%-10px)] w-[calc(50%-7px)] rounded-[12px] bg-white shadow-md shadow-[#FF7B5C]/12 ring-1 ring-black/[0.04] transition-[left,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            active === null ? "opacity-0" : "opacity-100"
          }`}
          style={{ left: active === 1 ? "calc(50% + 1.5px)" : 5 }}
        />
        {TABS.map((tab, i) => {
          const isActive = active !== null && i === active;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              className={`relative z-10 flex flex-1 items-center justify-center rounded-[12px] py-2.5 text-sm font-semibold transition-colors duration-200 ${
                isActive ? "text-[#1A1A1A]" : "text-[#8A8A8A] hover:text-[#5C5C5C]"
              }`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
