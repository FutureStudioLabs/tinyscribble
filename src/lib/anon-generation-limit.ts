import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";

/** Maximum generation runs allowed per 24-hour window for non-entitled users. */
export const ANON_GENERATION_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export function clientIpFromRequest(request: NextRequest): string | null {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
}

function windowStart(): string {
  return new Date(Date.now() - WINDOW_MS).toISOString();
}

/**
 * Returns true when the caller should be blocked (limit exceeded).
 * Checks fingerprint and IP independently — either one reaching the limit is enough to block.
 * Fails open (returns false) on DB errors to avoid blocking legitimate users.
 */
export async function checkAnonGenerationLimit(
  fingerprintId: string | null | undefined,
  ip: string | null | undefined
): Promise<boolean> {
  if (!fingerprintId && !ip) return false;

  const since = windowStart();
  const db = createAdminClient();

  try {
    const checks: Promise<number>[] = [];

    if (fingerprintId) {
      checks.push(
        (async () => {
          const { count, error } = await db
            .from("anon_generation_attempts")
            .select("id", { count: "exact", head: true })
            .eq("fingerprint_id", fingerprintId)
            .gte("created_at", since);
          if (error) {
            console.error("anon rate limit check (fingerprint)", error);
            return 0;
          }
          return count ?? 0;
        })()
      );
    }

    if (ip) {
      checks.push(
        (async () => {
          const { count, error } = await db
            .from("anon_generation_attempts")
            .select("id", { count: "exact", head: true })
            .eq("ip", ip)
            .gte("created_at", since);
          if (error) {
            console.error("anon rate limit check (ip)", error);
            return 0;
          }
          return count ?? 0;
        })()
      );
    }

    const counts = await Promise.all(checks);
    return counts.some((c) => c >= ANON_GENERATION_LIMIT);
  } catch (err) {
    console.error("anon rate limit unexpected error", err);
    return false; // fail open
  }
}

/**
 * Records one generation attempt. Call this after the rate-limit check passes,
 * before the expensive generation work starts.
 */
export async function recordAnonGeneration(
  fingerprintId: string | null | undefined,
  ip: string | null | undefined
): Promise<void> {
  if (!fingerprintId && !ip) return;
  try {
    const db = createAdminClient();
    const { error } = await db.from("anon_generation_attempts").insert({
      fingerprint_id: fingerprintId ?? null,
      ip: ip ?? null,
    });
    if (error) console.error("anon rate limit record error", error);
  } catch (err) {
    console.error("anon rate limit record unexpected error", err);
  }
}
