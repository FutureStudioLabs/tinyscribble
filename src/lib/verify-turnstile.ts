import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function clientIpFromRequest(request: NextRequest): string | null {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
}

async function siteverify(
  token: string,
  remoteIp: string | null
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
  if (data.success) return true;
  console.warn("turnstile siteverify failed", data["error-codes"]);
  return false;
}

/** True when production should require a valid Turnstile token. */
export function isTurnstileEnforced(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

/**
 * If `TURNSTILE_SECRET_KEY` is set, require a valid token or return a 403 JSON response.
 * Returns `null` when verification passed or Turnstile is not configured.
 */
export async function requireValidTurnstile(
  request: NextRequest,
  token: string | null | undefined
): Promise<NextResponse | null> {
  if (!isTurnstileEnforced()) return null;
  if (!token || typeof token !== "string" || token.length < 3) {
    return NextResponse.json(
      { error: "Security check failed. Please refresh the page and try again." },
      { status: 403 }
    );
  }
  const ok = await siteverify(token, clientIpFromRequest(request));
  if (ok) return null;
  return NextResponse.json(
    { error: "Security check failed. Please refresh the page and try again." },
    { status: 403 }
  );
}
