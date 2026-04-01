"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export type TurnstileGateHandle = {
  /** No-op when Turnstile is not configured (no public site key). */
  obtainToken: () => Promise<string | undefined>;
};

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

      // Wait for the ref to be set (component mount)
      for (let i = 0; i < 50; i++) {
        if (turnstileRef.current) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const inst = turnstileRef.current;
      if (!inst) return undefined;

      // Wait for the Cloudflare script to fully load the widget
      if (!widgetLoadedRef.current) {
        await Promise.race([
          new Promise<void>((resolve) => {
            widgetLoadedWaiters.current.push(resolve);
          }),
          new Promise<void>((resolve) => setTimeout(resolve, 10_000)),
        ]);
      }

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
