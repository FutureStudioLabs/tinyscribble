"use client";

import { createClient } from "@/lib/supabase/client";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { resolvePostLoginDestination } from "@/lib/safe-next-path";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Human-readable copy for `?error=` codes from auth/checkout redirects. */
const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_checkout:
    "We couldn’t verify your checkout. Open TinyScribble from the app or use the link from your payment email.",
  checkout_incomplete:
    "That payment wasn’t completed. Try subscribing again from the app.",
  no_checkout_email:
    "We couldn’t find an email on that checkout. Use the same email you used in Stripe below.",
  checkout_verify_failed:
    "We couldn’t verify your payment right now. Try again in a moment or sign in below.",
};

function messageFromLoginErrorParam(raw: string | null): string | null {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return "Something went wrong. Please try again.";
  }
  const trimmed = decoded.trim();
  // Legacy URLs; opening /auth/callback without ?code= is normal — not a user mistake.
  if (trimmed === "missing_code") {
    return null;
  }
  if (LOGIN_ERROR_MESSAGES[trimmed]) {
    return LOGIN_ERROR_MESSAGES[trimmed];
  }
  return trimmed;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const errorParam = searchParams.get("error");
  const emailParam = searchParams.get("email");
  const hintParam = searchParams.get("hint");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() =>
    messageFromLoginErrorParam(errorParam)
  );

  useEffect(() => {
    setError(messageFromLoginErrorParam(errorParam));
  }, [errorParam]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  useEffect(() => {
    if (hintParam === "sign_in") {
      setMessage(
        "We couldn’t open an automatic sign-in link. Send yourself a magic link below — use the same email you used in Stripe."
      );
    }
  }, [hintParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const dest = resolvePostLoginDestination(nextPath ?? undefined);
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(dest)}`;

      const { error: signError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (signError) {
        setError(signError.message);
        setLoading(false);
        return;
      }

      setMessage("Check your email — we sent you a magic link to sign in.");
      setLoading(false);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex min-h-0 w-full flex-1 flex-col"
    >
      <div className="shrink-0 space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="mb-2 block text-sm font-semibold text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-[#E8E8E8] px-4 py-3.5 text-base outline-none ring-[#FF7B5C] focus:border-[#FF7B5C] focus:ring-2 disabled:opacity-60"
            style={{ fontFamily: "var(--font-body)" }}
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p
            className="rounded-xl bg-[#E8F8F5] px-3 py-2 text-sm font-medium text-[#1B5E20]"
            role="status"
          >
            {message}
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex w-full flex-col gap-4 pt-8 pb-2">
        <FunnelPrimaryButton type="submit" disabled={loading} className="disabled:!opacity-70">
          {loading ? "Sending link…" : "Send magic link"}
        </FunnelPrimaryButton>

        <p
          className="text-center text-[13px] text-[#9B9B9B]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          No password — we&apos;ll email you a secure link. By continuing you agree to our{" "}
          <Link href="/terms" className="underline hover:text-[#6B6B6B]">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-[#6B6B6B]">
            Privacy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
