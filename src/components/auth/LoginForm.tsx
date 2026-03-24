"use client";

import { createClient } from "@/lib/supabase/client";
import { FunnelPrimaryButton } from "@/components/ui/FunnelPrimaryButton";
import { resolvePostLoginDestination } from "@/lib/safe-next-path";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  missing_session: "Missing checkout session. Use the link from your payment confirmation email.",
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

const LOGIN_OTP_RESEND_COOLDOWN_SEC = 45;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const errorParam = searchParams.get("error");
  const emailParam = searchParams.get("email");
  const hintParam = searchParams.get("hint");
  const autoSendParam = searchParams.get("auto_send");
  const sessionIdParam = searchParams.get("session_id");
  const checkoutFlag = searchParams.get("checkout");

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() =>
    messageFromLoginErrorParam(errorParam)
  );
  const [checkoutWelcome, setCheckoutWelcome] = useState(false);
  const [checkoutNextPath, setCheckoutNextPath] = useState<string | null>(null);

  const codeInputRef = useRef<HTMLInputElement>(null);
  const verifyInFlightRef = useRef(false);

  const dest = useMemo(
    () =>
      resolvePostLoginDestination(checkoutNextPath ?? nextPath ?? undefined),
    [checkoutNextPath, nextPath]
  );

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendCooldown]);

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

  /** Restore post-checkout OTP step after refresh (URL has checkout=1, no session_id). */
  useEffect(() => {
    if (checkoutFlag !== "1" || !emailParam?.trim()) return;
    setEmail(emailParam.trim());
    setStep("code");
    setCheckoutWelcome(true);
    if (nextPath) setCheckoutNextPath(nextPath);
  }, [checkoutFlag, emailParam, nextPath]);

  /** Stripe success / complete-checkout: verify session, sync billing, send OTP, show combined UI. */
  useEffect(() => {
    if (checkoutFlag === "1") return;
    if (!sessionIdParam?.startsWith("cs_")) return;

    const ac = new AbortController();
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/auth/verify-checkout-session?session_id=${encodeURIComponent(sessionIdParam)}`,
          { signal: ac.signal }
        );
        const data = (await res.json()) as {
          ok?: boolean;
          email?: string;
          next?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          const code = data.error ?? "checkout_verify_failed";
          setError(
            LOGIN_ERROR_MESSAGES[code] ??
              "We couldn't verify your payment. Try signing in with your email."
          );
          setLoading(false);
          return;
        }

        const next = data.next ?? "/generate";
        const em = (data.email ?? "").trim();
        setEmail(em);
        setCheckoutNextPath(next);
        setCheckoutWelcome(true);

        const supabase = createClient();
        const { error: signError } = await supabase.auth.signInWithOtp({
          email: em,
          options: { shouldCreateUser: true },
        });
        if (cancelled) return;

        if (signError) {
          const msg = signError.message.toLowerCase();
          setError(
            msg.includes("rate limit") || msg.includes("too many")
              ? "Too many codes sent. Please wait a few minutes and try again, or enter the code we already sent."
              : signError.message
          );
        } else {
          setResendCooldown(LOGIN_OTP_RESEND_COOLDOWN_SEC);
        }
        setStep("code");
        setLoading(false);
        setTimeout(() => codeInputRef.current?.focus(), 100);

        const qs = new URLSearchParams({
          next,
          email: em,
          checkout: "1",
        });
        router.replace(`/login?${qs.toString()}`);
      } catch (e) {
        if (cancelled || (e instanceof DOMException && e.name === "AbortError")) return;
        setError("Something went wrong. Try again.");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [sessionIdParam, checkoutFlag, router]);

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
      setResendCooldown(LOGIN_OTP_RESEND_COOLDOWN_SEC);
      setLoading(false);
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }, [email]);

  const resendOtp = useCallback(async () => {
    if (resendCooldown > 0 || resendLoading || !email.trim()) return;
    setError(null);
    setResendLoading(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (signError) {
        const msg = signError.message.toLowerCase();
        setError(
          msg.includes("rate limit") || msg.includes("too many")
            ? "Too many codes sent. Please wait a few minutes and try again, or enter the code we already sent."
            : signError.message
        );
        setResendLoading(false);
        return;
      }
      setMessage("We sent a new code — check your email.");
      setCode("");
      setResendCooldown(LOGIN_OTP_RESEND_COOLDOWN_SEC);
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setResendLoading(false);
    }
  }, [email, resendCooldown, resendLoading]);

  const hasAutoSent = useRef(false);
  useEffect(() => {
    if (sessionIdParam?.startsWith("cs_")) return;
    if (checkoutFlag === "1") return;
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
            setResendCooldown(LOGIN_OTP_RESEND_COOLDOWN_SEC);
            setTimeout(() => codeInputRef.current?.focus(), 100);
          }
        })
        .catch(() => setError("Something went wrong. Try again."))
        .finally(() => setLoading(false));
    }
  }, [autoSendParam, emailParam, sessionIdParam, checkoutFlag]);

  const verifyOtp = useCallback(async () => {
    const token = code.replace(/\D/g, "").slice(0, 6);
    if (token.length !== 6) return;
    if (verifyInFlightRef.current) return;
    verifyInFlightRef.current = true;
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });
      if (verifyError) {
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
      window.location.href = dest;
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    } finally {
      verifyInFlightRef.current = false;
    }
  }, [code, email, dest]);

  useEffect(() => {
    if (step !== "code") return;
    if (code.replace(/\D/g, "").length !== 6) return;
    void verifyOtp();
  }, [step, code, verifyOtp]);

  const verifyingCheckout =
    Boolean(sessionIdParam?.startsWith("cs_")) &&
    checkoutFlag !== "1" &&
    !checkoutWelcome &&
    loading &&
    step === "email";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step === "email") void sendCode();
        else {
          const token = code.replace(/\D/g, "").slice(0, 6);
          if (token.length !== 6) {
            setError("Please enter a 6-digit code.");
            return;
          }
          void verifyOtp();
        }
      }}
      className="flex min-h-0 w-full flex-1 flex-col"
    >
      <div className="shrink-0 space-y-5">
        {verifyingCheckout ? (
          <div className="py-10 text-center">
            <p
              className="text-base text-[#6B6B6B]"
              style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
            >
              Confirming your payment…
            </p>
          </div>
        ) : step === "email" ? (
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
        ) : checkoutWelcome ? (
          <div>
            <p
              className="text-center text-[1.5rem] font-bold text-[#1A1A1A] sm:text-[1.65rem]"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
            >
              You&apos;re in! 🎉
            </p>
            <p
              className="mt-3 text-center text-base text-[#6B6B6B]"
              style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
            >
              We&apos;ve sent a sign-in code to{" "}
              <strong className="font-semibold text-[#1A1A1A]">{email}</strong>
            </p>
            <label
              htmlFor="login-code"
              className="mb-2 mt-6 block text-sm font-semibold text-[#1A1A1A]"
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
            <p
              className="mt-3 text-sm text-[#6B6B6B]"
              style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
            >
              No password needed — just enter the 6-digit code from your email.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2">
              <button
                type="button"
                onClick={() => void resendOtp()}
                disabled={
                  resendLoading || resendCooldown > 0 || loading || !email.trim()
                }
                className="text-left text-sm font-semibold text-[#5C6670] underline decoration-[#B8C0C8] underline-offset-2 transition-colors hover:text-[#1A1A1A] hover:decoration-[#1A1A1A] disabled:cursor-not-allowed disabled:text-[#B0B8C0] disabled:no-underline"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {resendLoading
                  ? "Sending…"
                  : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCheckoutWelcome(false);
                  setCheckoutNextPath(null);
                  setMessage(null);
                  setError(null);
                  setCode("");
                  setResendCooldown(0);
                  router.replace("/login");
                }}
                className="text-left text-sm font-semibold text-[#5C6670] underline decoration-[#B8C0C8] underline-offset-2 transition-colors hover:text-[#1A1A1A] hover:decoration-[#1A1A1A]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Use another email
              </button>
            </div>
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
              className="mb-3 break-all rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] ring-1 ring-[#E8EBEF]"
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
              <span className="mt-1 block text-xs font-normal text-[#9B9B9B]">
                We&apos;ll sign you in automatically when it&apos;s complete.
              </span>
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
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2">
              <button
                type="button"
                onClick={() => void resendOtp()}
                disabled={
                  resendLoading || resendCooldown > 0 || loading || !email.trim()
                }
                className="text-left text-sm font-semibold text-[#5C6670] underline decoration-[#B8C0C8] underline-offset-2 transition-colors hover:text-[#1A1A1A] hover:decoration-[#1A1A1A] disabled:cursor-not-allowed disabled:text-[#B0B8C0] disabled:no-underline"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {resendLoading
                  ? "Sending…"
                  : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setMessage(null);
                  setError(null);
                  setCode("");
                  setResendCooldown(0);
                }}
                className="text-left text-sm font-semibold text-[#5C6670] underline decoration-[#B8C0C8] underline-offset-2 transition-colors hover:text-[#1A1A1A] hover:decoration-[#1A1A1A]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Use another email
              </button>
            </div>
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
              : checkoutWelcome
                ? "Continue"
                : "Verify"}
        </FunnelPrimaryButton>

        {!checkoutWelcome ? (
          <p
            className="text-center text-[13px] text-[#9B9B9B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            No password — we&apos;ll email you a secure code. By continuing you agree to our{" "}
            <Link
              href="/terms"
              className="font-medium text-[#6B6B6B] underline decoration-[#C8C8C8] underline-offset-2 hover:text-[#1A1A1A] hover:decoration-[#1A1A1A]"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-[#6B6B6B] underline decoration-[#C8C8C8] underline-offset-2 hover:text-[#1A1A1A] hover:decoration-[#1A1A1A]"
            >
              Privacy
            </Link>
            .
          </p>
        ) : (
          <p
            className="text-center text-[13px] text-[#9B9B9B]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            By continuing you agree to our{" "}
            <Link
              href="/terms"
              className="font-medium text-[#6B6B6B] underline decoration-[#C8C8C8] underline-offset-2 hover:text-[#1A1A1A] hover:decoration-[#1A1A1A]"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-[#6B6B6B] underline decoration-[#C8C8C8] underline-offset-2 hover:text-[#1A1A1A] hover:decoration-[#1A1A1A]"
            >
              Privacy
            </Link>
            .
          </p>
        )}
      </div>
    </form>
  );
}
