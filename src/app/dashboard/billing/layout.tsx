import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { Logo } from "@/components/Logo";

/** Same chrome as upload/gallery: logo + account menu only. */
export default function DashboardBillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="relative z-40 flex shrink-0 items-center justify-between border-b border-[#FF7B5C]/10 bg-[#FFF8F5]/90 px-5 py-4 backdrop-blur-md">
        <Logo />
        <HeaderUserAvatar />
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </>
  );
}
