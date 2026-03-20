import type { Metadata } from "next";
import { TrialPaywallScreen } from "@/components/paywall/TrialPaywallScreen";

export const metadata: Metadata = {
  title: "Start your free trial — TinyScribble",
  robots: { index: false, follow: false },
};

export default function PaywallPage() {
  return <TrialPaywallScreen />;
}
