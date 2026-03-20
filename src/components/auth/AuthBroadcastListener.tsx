"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Notifies other tabs when email magic-link auth completes so they can refresh session. */
export const AUTH_BROADCAST_CHANNEL = "tinyscribble-auth";

export type AuthBroadcastMessage = { type: "session-ready" };

export function AuthBroadcastListener() {
  const router = useRouter();

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    ch.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
      if (event.data?.type === "session-ready") {
        router.refresh();
      }
    };
    return () => ch.close();
  }, [router]);

  return null;
}
