"use client";

import { createContext, useContext, type ReactNode } from "react";

export type DashboardShellModalsContextValue = {
  openStartEarly: () => void;
  openPaidUpgrade: () => void;
};

const DashboardShellModalsContext = createContext<DashboardShellModalsContextValue | null>(null);

export function DashboardShellModalsProvider({
  children,
  openStartEarly,
  openPaidUpgrade,
}: {
  children: ReactNode;
  openStartEarly: () => void;
  openPaidUpgrade: () => void;
}) {
  return (
    <DashboardShellModalsContext.Provider value={{ openStartEarly, openPaidUpgrade }}>
      {children}
    </DashboardShellModalsContext.Provider>
  );
}

/** Present on dashboard shell (`/dashboard/upload`, gallery under same shell). */
export function useDashboardShellModalsOptional(): DashboardShellModalsContextValue | null {
  return useContext(DashboardShellModalsContext);
}
