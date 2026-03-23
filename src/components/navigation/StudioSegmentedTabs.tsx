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
    <div className="relative z-0 w-full min-w-0 shrink-0 bg-white pb-5 pt-4">
      <div
        className="relative isolate flex w-full rounded-[14px] bg-[#F5F5F5] p-1"
        role="tablist"
        aria-label="Dashboard sections"
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-[11px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-[left,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            active === null ? "opacity-0" : "opacity-100"
          }`}
          style={{ left: active === 1 ? "calc(50% + 0px)" : 4 }}
        />
        {TABS.map((tab, i) => {
          const isActive = active !== null && i === active;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              className={`relative z-10 flex flex-1 items-center justify-center rounded-[11px] py-3 text-[15px] font-bold transition-colors duration-200 ${
                isActive ? "text-[#1A1A1A]" : "text-[#AAAAAA] hover:text-[#777777]"
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
