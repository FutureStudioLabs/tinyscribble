"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        void (async () => {
          setLoading(true);
          await createClient().auth.signOut();
          router.refresh();
          setLoading(false);
        })();
      }}
      className="text-sm font-semibold text-[#5C6670] underline-offset-2 transition-colors hover:text-[#1A1A1A] hover:underline disabled:opacity-60"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
