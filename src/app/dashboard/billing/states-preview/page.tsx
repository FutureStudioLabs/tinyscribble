import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StatesPreviewClient } from "./StatesPreviewClient";

export const metadata: Metadata = {
  title: "Billing states preview — TinyScribble",
  robots: { index: false, follow: false },
};

/** Temporary static UI lab for trial/paid dashboard states. Remove when done testing. */
export default async function BillingStatesPreviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login?next=" + encodeURIComponent("/dashboard/billing/states-preview"));
  }

  return <StatesPreviewClient />;
}
