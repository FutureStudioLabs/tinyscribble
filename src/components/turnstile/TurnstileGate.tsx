"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";

/**
 * Preload the Cloudflare Turnstile script so it's cached before the widget mounts.
 * Safe to call multiple times / on pages that don't render TurnstileGate.
 */
export function preloadTurnstileScript(): void {
  if (!siteKey || typeof document === "undefined") return;
  if (document.querySelector(`link[href="${TURNSTILE_SCRIPT_URL}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "script";
  link.href = TURNSTILE_SCRIPT_URL;
  document.head.appendChild(link);
}

export type TurnstileGateHandle = {
  /** No-op when Turnstile is not configured (no public site key). */
  obtainToken: () => Promise<string | undefined>;
};

/**
 * Wait for the global `window.turnstile` object (the Cloudflare API) to be defined.
 */
function waitForGlobalTurnstile(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).turnstile) {
      resolve(true);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof window !== "undefined" && (window as any).turnstile) {
        clearInterval(id);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(id);
        resolve(false);
      }
    }, 200);
  });
}

export const TurnstileGate = forwardRef<TurnstileGateHandle>(function TurnstileGate(
  _props,
  ref
) {
  const turnstileRef = useRef<TurnstileInstance>(null);
  const widgetLoadedRef = useRef(false);
  const widgetLoadedWaiters = useRef<Array<() => void>>([]);

  const onWidgetLoad = useCallback(() => {
    widgetLoadedRef.current = true;
    for (const fn of widgetLoadedWaiters.current) fn();
    widgetLoadedWaiters.current = [];
  }, []);

  useImperativeHandle(ref, () => ({
    obtainToken: async () => {
      if (!siteKey) return undefined;

      for (let i = 0; i < 50; i++) {
        if (turnstileRef.current) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const inst = turnstileRef.current;
      if (!inst) return undefined;

      if (!widgetLoadedRef.current) {
        await Promise.race([
          new Promise<void>((resolve) => {
            widgetLoadedWaiters.current.push(resolve);
          }),
          new Promise<void>((resolve) => setTimeout(resolve, 12_000)),
        ]);
      }

      const globalReady = await waitForGlobalTurnstile(5_000);
      if (!globalReady) return undefined;

      try {
        inst.reset();
        inst.execute();
        const token = await inst.getResponsePromise(45_000);
        return token;
      } catch {
        return undefined;
      }
    },
  }));

  if (!siteKey) return null;

  return (
    <div className="pointer-events-none fixed left-0 top-0 -z-10 h-0 w-0 overflow-hidden opacity-0" aria-hidden>
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        options={{ size: "invisible", execution: "execute" }}
        onWidgetLoad={onWidgetLoad}
      />
    </div>
  );
});
