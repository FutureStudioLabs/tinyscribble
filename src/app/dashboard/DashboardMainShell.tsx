import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";
import { StudioSegmentedTabs } from "@/components/navigation/StudioSegmentedTabs";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Header, welcome line, and Upload | Gallery tabs — used only under /dashboard/upload and /dashboard/gallery.
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
  const displayName =
    typeof metaName === "string" && metaName.trim()
      ? metaName.trim().split(/\s+/)[0]
      : user.email.split("@")[0];

  return (
    <>
      <header className="relative z-40 flex shrink-0 items-center justify-between border-b border-[#FF7B5C]/10 bg-[#FFF8F5]/90 px-5 py-4 backdrop-blur-md">
        <Logo />
        <HeaderUserAvatar />
      </header>

      <div className="mx-auto w-full max-w-md px-5 pt-4">
        <h1
          className="mb-2 text-[28px] font-bold text-[#1A1A1A] sm:text-[32px]"
          style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
        >
          Welcome back, {displayName}
        </h1>
        <p className="text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
          Signed in as <span className="font-medium text-[#1A1A1A]">{user.email}</span>
        </p>
      </div>

      <StudioSegmentedTabs />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </>
  );
}
