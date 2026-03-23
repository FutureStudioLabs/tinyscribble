"use client";

import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { DashboardHeroCard } from "@/components/dashboard/DashboardHeroCard";
import { Logo } from "@/components/Logo";
import { StudioSegmentedTabs } from "@/components/navigation/StudioSegmentedTabs";
import { DashboardShellModalsProvider } from "@/components/dashboard/dashboard-shell-modals-context";
import { PaidUpgradeModal } from "@/components/paywall/PaidUpgradeModal";
import { StartEarlyModal } from "@/components/paywall/StartEarlyModal";
import { useState } from "react";

type Props = {
  greetingName: string;
  children: React.ReactNode;
};

export function DashboardMainShellClient({ greetingName, children }: Props) {
  const [startEarlyOpen, setStartEarlyOpen] = useState(false);
  const [paidUpgradeOpen, setPaidUpgradeOpen] = useState(false);

  return (
    <DashboardShellModalsProvider
      openStartEarly={() => setStartEarlyOpen(true)}
      openPaidUpgrade={() => setPaidUpgradeOpen(true)}
    >
      <>
        <header className="relative z-40 flex shrink-0 items-center justify-between bg-white px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
          <Logo />
          <HeaderUserAvatar trigger="hamburger" hideTrialQuotaBadge />
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-4">
          <div className="shrink-0 pt-2">
            <DashboardHeroCard
              greetingName={greetingName}
              onStartEarlyClick={() => setStartEarlyOpen(true)}
              onPaidUpgradeClick={() => setPaidUpgradeOpen(true)}
            />
          </div>
          <StudioSegmentedTabs />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">{children}</div>
        </div>

        <StartEarlyModal open={startEarlyOpen} onClose={() => setStartEarlyOpen(false)} />
        <PaidUpgradeModal open={paidUpgradeOpen} onClose={() => setPaidUpgradeOpen(false)} />
      </>
    </DashboardShellModalsProvider>
  );
}
