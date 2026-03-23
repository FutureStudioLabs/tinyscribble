"use client";

import {
  DashboardStatesPreviewHero,
  DashboardStatesPreviewUpload,
  DASHBOARD_STATE_CASES,
  type DashboardStateCaseId,
} from "@/components/dashboard/dashboard-states-preview-variants";
import Link from "next/link";
import { PaidUpgradeModal } from "@/components/paywall/PaidUpgradeModal";
import { StartEarlyModal } from "@/components/paywall/StartEarlyModal";
import { useState } from "react";
import { CaretRightIcon } from "@phosphor-icons/react";

function FakeTabs() {
  return (
    <div className="relative z-0 w-full min-w-0 shrink-0 bg-white pb-5 pt-4">
      <div className="relative isolate flex w-full rounded-[14px] bg-[#F5F5F5] p-1" role="tablist">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-[11px] bg-white opacity-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          style={{ left: 4 }}
        />
        <div className="relative z-10 flex flex-1 items-center justify-center rounded-[11px] py-3 text-[15px] font-bold text-[#1A1A1A]">
          Upload
        </div>
        <div className="relative z-10 flex flex-1 items-center justify-center rounded-[11px] py-3 text-[15px] font-bold text-[#AAAAAA]">
          Gallery
        </div>
      </div>
    </div>
  );
}

/** Standalone design preview for the 7 hero/upload cases. Modals use live billing APIs. */
export function StatesPreviewClient() {
  const [active, setActive] = useState<DashboardStateCaseId>(1);
  const [startEarlyOpen, setStartEarlyOpen] = useState(false);
  const [paidUpgradeOpen, setPaidUpgradeOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-lg px-4 pb-8 pt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/dashboard/upload"
            className="text-sm font-semibold text-[#FF7B5C] underline-offset-2 hover:underline"
          >
            ← Open dashboard Upload (recommended)
          </Link>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            Test UI only
          </span>
        </div>
        <p className="mb-6 text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
          Use this page to review hero + upload layouts for each case. Live dashboard uses real billing
          and entitlements on{" "}
          <Link href="/dashboard/upload" className="font-semibold text-[#FF7B5C] underline">
            /dashboard/upload
          </Link>
          .
        </p>

        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9B9B9B]">Trial states</p>
        <div className="mb-8 flex flex-col gap-3">
          {DASHBOARD_STATE_CASES.filter((x) => x.section === "trial").map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-white p-4 text-left shadow-[0_8px_24px_-12px_rgba(0,0,0,0.1)] transition ${
                active === item.id
                  ? "border-[#FF7B5C] ring-2 ring-[#FF7B5C]/25"
                  : "border-transparent hover:border-[#E8E8E8]"
              }`}
            >
              <div className="min-w-0">
                <p className="font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
                  {item.title}
                </p>
                <p className="mt-0.5 text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                  {item.subtitle}
                </p>
              </div>
              <CaretRightIcon size={22} weight="bold" className="shrink-0 text-[#FF7B5C]" aria-hidden />
            </button>
          ))}
        </div>

        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9B9B9B]">Paid subscriber</p>
        <div className="mb-10 flex flex-col gap-3">
          {DASHBOARD_STATE_CASES.filter((x) => x.section === "paid").map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-white p-4 text-left shadow-[0_8px_24px_-12px_rgba(0,0,0,0.1)] transition ${
                active === item.id
                  ? "border-[#FF7B5C] ring-2 ring-[#FF7B5C]/25"
                  : "border-transparent hover:border-[#E8E8E8]"
              }`}
            >
              <div className="min-w-0">
                <p className="font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
                  {item.title}
                </p>
                <p className="mt-0.5 text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                  {item.subtitle}
                </p>
              </div>
              <CaretRightIcon size={22} weight="bold" className="shrink-0 text-[#FF7B5C]" aria-hidden />
            </button>
          ))}
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]">Preview</p>
      </div>

      <div className="border-t border-[#E8E8E8] bg-white">
        <div className="mx-auto w-full max-w-lg px-4 pb-10 pt-4">
          <div className="shrink-0 pt-2">
            <DashboardStatesPreviewHero
              c={active}
              onStartEarlyClick={() => setStartEarlyOpen(true)}
              onPaidUpgradeClick={() => setPaidUpgradeOpen(true)}
            />
          </div>
          <FakeTabs />
          <div className="flex min-h-[min(70vh,520px)] min-w-0 flex-1 flex-col bg-white">
            <DashboardStatesPreviewUpload
              c={active}
              onStartEarlyClick={() => setStartEarlyOpen(true)}
            />
          </div>
        </div>
      </div>

      <StartEarlyModal open={startEarlyOpen} onClose={() => setStartEarlyOpen(false)} />
      <PaidUpgradeModal open={paidUpgradeOpen} onClose={() => setPaidUpgradeOpen(false)} />
    </div>
  );
}
