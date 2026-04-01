import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardBillingClient } from "./DashboardBillingClient";

export const metadata: Metadata = {
  title: "Billing — TinyScribble",
  description: "View your TinyScribble plan, renewal date, and subscription settings.",
};

export default async function DashboardBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login?next=" + encodeURIComponent("/dashboard/billing"));
  }

  return <DashboardBillingClient email={user.email} />;
}
