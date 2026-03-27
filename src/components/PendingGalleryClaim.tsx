"use client";

import { createClient } from "@/lib/supabase/client";
import {
  clearPendingGalleryKeys,
  getPendingGalleryKeysSnapshot,
} from "@/lib/pending-gallery-keys";
import { useEffect, useRef } from "react";

/**
 * After sign-in, moves sessionStorage-queued R2 keys into `gallery_items`.
 * Lives in root layout so funnel pages (/generate, /upload) still claim without dashboard shell.
 */
export function PendingGalleryClaim() {
  const inFlight = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    async function claimIfNeeded() {
      const keys = getPendingGalleryKeysSnapshot();
      if (keys.length === 0) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const res = await fetch("/api/gallery/claim", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys }),
        });
        if (res.ok) clearPendingGalleryKeys();
      } finally {
        inFlight.current = false;
      }
    }

    void claimIfNeeded();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user?.id) return;
      if (event === "SIGNED_IN") void claimIfNeeded();
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
