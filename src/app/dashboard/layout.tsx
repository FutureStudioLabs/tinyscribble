import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard — TinyScribble",
  description: "Your TinyScribble home — create and manage your drawings.",
};

/** Auth gate only. Upload/gallery use `DashboardMainShell`; billing uses `billing/layout.tsx`. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login?next=" + encodeURIComponent("/dashboard"));
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FFF8F5]">
      {children}
    </div>
  );
}
