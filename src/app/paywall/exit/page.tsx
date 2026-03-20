import type { Metadata } from "next";
import { ExitPaywallScreen } from "@/components/paywall/ExitPaywallScreen";

export const metadata: Metadata = {
  title: "Limited offer — TinyScribble",
  robots: { index: false, follow: false },
};

export default function PaywallExitPage() {
  return <ExitPaywallScreen />;
}
