import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardMainShellClient } from "./DashboardMainShellClient";

/**
 * Dashboard shell — hero card, coral hamburger menu, Upload | Gallery tabs (mock-aligned).
 */
export async function DashboardMainShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login?next=" + encodeURIComponent("/dashboard"));
  }

  const metaName = user.user_metadata?.full_name;
  const greetingName =
    typeof metaName === "string" && metaName.trim()
      ? metaName.trim().split(/\s+/)[0]
      : user.email.split("@")[0];

  return <DashboardMainShellClient greetingName={greetingName}>{children}</DashboardMainShellClient>;
}
