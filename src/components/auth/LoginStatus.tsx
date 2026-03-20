import { SignOutButton } from "@/components/auth/SignOutButton";
import { createClient } from "@/lib/supabase/server";

export async function LoginStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  return (
    <div
      className="mb-8 w-full max-w-md rounded-2xl border border-[#E8EBEF] bg-white/90 px-4 py-4 text-center shadow-sm"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <p className="text-sm text-[#6B6B6B]">Signed in as</p>
      <p className="mt-1 text-[15px] font-semibold text-[#1A1A1A]">{user.email}</p>
      <div className="mt-3 flex justify-center">
        <SignOutButton />
      </div>
    </div>
  );
}
