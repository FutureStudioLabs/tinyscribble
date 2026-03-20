import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/safe-next-path";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    // Common when someone opens /auth/callback directly, a preview bot hits the URL, or the
    // email client strips query params. Don’t show a scary error — the login form is enough.
    console.warn("auth callback: no ?code= — redirecting to /login");
    const login = new URL("/login", origin);
    const nextPath = searchParams.get("next");
    if (nextPath) {
      const safe = safeNextPath(nextPath);
      if (safe !== "/") {
        login.searchParams.set("next", safe);
      }
    }
    return NextResponse.redirect(login.toString());
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("auth callback exchange failed", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Redirect to destination. Session cookies are set on this response.
  const dest = next !== "/" ? next : "/dashboard";
  return NextResponse.redirect(`${origin}${dest}`);
}
