"use client";

import { createClient } from "@/lib/supabase/client";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { resolvePostLoginDestination } from "@/lib/safe-next-path";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** Human-readable copy for `?error=` codes from auth/checkout redirects. */
const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_checkout:
    "We couldn't verify your checkout. Open TinyScribble from the app or use the link from your payment email.",
  checkout_incomplete:
    "That payment wasn't completed. Try subscribing again from the app.",
  no_checkout_email:
    "We couldn't find an email on that checkout. Use the same email you used in Stripe below.",
  checkout_verify_failed:
    "We couldn't verify your payment right now. Try again in a moment or sign in below.",
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
  if (trimmed === "missing_code") return null;
  if (LOGIN_ERROR_MESSAGES[trimmed]) return LOGIN_ERROR_MESSAGES[trimmed];
  return trimmed;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const errorParam = searchParams.get("error");
  const emailParam = searchParams.get("email");
  const hintParam = searchParams.get("hint");
  const autoSendParam = searchParams.get("auto_send");

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() =>
    messageFromLoginErrorParam(errorParam)
  );
  const codeInputRef = useRef<HTMLInputElement>(null);

  const dest = resolvePostLoginDestination(nextPath ?? undefined);

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
        "We couldn't verify your checkout automatically. Enter the code we sent to your email below."
      );
    }
  }, [hintParam]);

  const sendCode = useCallback(async () => {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (signError) {
        const msg = signError.message.toLowerCase();
        setError(
          msg.includes("rate limit") || msg.includes("too many")
            ? "Too many codes sent. Please wait a few minutes and try again, or enter the code we already sent."
            : signError.message
        );
        setStep("code");
        setLoading(false);
        return;
      }

      setStep("code");
      setMessage("Check your email — we sent you a 6-digit code.");
      setCode("");
      setLoading(false);
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }, [email]);

  const hasAutoSent = useRef(false);
  useEffect(() => {
    if (
      autoSendParam === "1" &&
      emailParam &&
      emailParam.trim() &&
      !hasAutoSent.current
    ) {
      hasAutoSent.current = true;
      setEmail(emailParam);
      setError(null);
      setMessage(null);
      setLoading(true);
      createClient()
        .auth.signInWithOtp({
          email: emailParam.trim(),
          options: { shouldCreateUser: true },
        })
        .then(({ error: signError }) => {
          if (signError) {
            const msg = signError.message.toLowerCase();
            setError(
              msg.includes("rate limit") || msg.includes("too many")
                ? "Too many codes sent. Please wait a few minutes and try again, or enter the code we already sent."
                : signError.message
            );
            setStep("code");
            setTimeout(() => codeInputRef.current?.focus(), 100);
          } else {
            setStep("code");
            setMessage("Check your email — we sent you a 6-digit code.");
            setTimeout(() => codeInputRef.current?.focus(), 100);
          }
        })
        .catch(() => setError("Something went wrong. Try again."))
        .finally(() => setLoading(false));
    }
  }, [autoSendParam, emailParam]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = code.replace(/\D/g, "").slice(0, 6);
    if (token.length !== 6) {
      setError("Please enter a 6-digit code.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });

      if (verifyError) {
        // Try OTP bypass (dev/testing) when normal verify fails
        const bypassRes = await fetch("/api/auth/bypass", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            code: token,
            next: dest,
          }),
        });
        const bypassData = (await bypassRes.json()) as { redirectUrl?: string; error?: string };
        if (bypassRes.ok && bypassData.redirectUrl) {
          window.location.href = bypassData.redirectUrl;
          return;
        }
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      // Full page navigation so server sees the new session cookies
      window.location.href = dest;
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step === "email") void sendCode();
        else void handleVerify(e);
      }}
      className="flex min-h-0 w-full flex-1 flex-col"
    >
      <div className="shrink-0 space-y-5">
        {step === "email" ? (
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
        ) : (
          <div>
            <p
              className="mb-2 text-sm font-semibold text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Code sent to
            </p>
            <p
              className="mb-3 break-all rounded-xl bg-[#FFF8F5] px-4 py-2.5 text-sm font-medium text-[#1A1A1A] ring-1 ring-[#FF7B5C]/12"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {email}
            </p>
            <label
              htmlFor="login-code"
              className="mb-2 block text-sm font-semibold text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Enter 6-digit code
            </label>
            <input
              ref={codeInputRef}
              id="login-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={loading}
              placeholder="000000"
              className="w-full rounded-2xl border border-[#E8E8E8] px-4 py-3.5 text-center text-xl tracking-[0.4em] outline-none ring-[#FF7B5C] focus:border-[#FF7B5C] focus:ring-2 disabled:opacity-60"
              style={{ fontFamily: "var(--font-body)" }}
            />
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setMessage(null);
                setError(null);
                setCode("");
              }}
              className="mt-3 text-sm font-semibold text-[#FF7B5C] hover:text-[#FF6B4A]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Use another email
            </button>
          </div>
        )}

        {error ? (
          <p
            className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
            role="alert"
          >
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
          {loading
            ? step === "email"
              ? "Sending code…"
              : "Verifying…"
            : step === "email"
              ? "Send code"
              : "Verify"}
        </FunnelPrimaryButton>

        <p
          className="text-center text-[13px] text-[#9B9B9B]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          No password — we&apos;ll email you a secure code. By continuing you agree to our{" "}
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
