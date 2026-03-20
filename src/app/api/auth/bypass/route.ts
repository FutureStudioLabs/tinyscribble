import { createHash, timingSafeEqual } from "crypto";
import { getAppUrl } from "@/lib/app-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeNextPath } from "@/lib/safe-next-path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * OTP bypass for a configured email + code (dev/testing only).
 * Uses admin.generateLink to create a magic link, then redirects the user to it.
 */
export async function POST(request: NextRequest) {
  const bypassEmail = process.env.OTP_BYPASS_EMAIL?.trim().toLowerCase();
  const bypassCode = process.env.OTP_BYPASS_CODE?.trim();

  if (!bypassEmail || !bypassCode) {
    return NextResponse.json({ error: "Bypass not configured" }, { status: 404 });
  }

  let body: { email?: string; code?: string; next?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const code = (body.code ?? "").trim();

  if (!email || !code) {
    return NextResponse.json({ error: "Missing email or code" }, { status: 400 });
  }

  // Constant-time compare to avoid timing attacks
  const codeHash = createHash("sha256").update(code).digest();
  const bypassHash = createHash("sha256").update(bypassCode).digest();
  const codeMatch = timingSafeEqual(codeHash, bypassHash);

  if (email !== bypassEmail || !codeMatch) {
    return NextResponse.json({ error: "Invalid bypass" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const origin = getAppUrl();
    const next = safeNextPath(body.next);
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.action_link) {
      console.error("bypass generateLink", error);
      return NextResponse.json({ error: "Could not create session" }, { status: 500 });
    }

    return NextResponse.json({ redirectUrl: data.properties.action_link });
  } catch (e) {
    console.error("bypass", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
