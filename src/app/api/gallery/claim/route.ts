import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function isClaimableKey(k: string): boolean {
  if (!k || k.length > 512 || k.includes("..")) return false;
  return (
    k.startsWith("uploads/") ||
    k.startsWith("generated/") ||
    k.startsWith("videos/")
  );
}

/**
 * Attach anonymous funnel uploads/generations to the signed-in user’s gallery.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawKeys = (body as { keys?: unknown }).keys;
  const keys = Array.isArray(rawKeys)
    ? rawKeys.filter((k): k is string => typeof k === "string")
    : [];

  const unique = [...new Set(keys.filter(isClaimableKey))];
  let inserted = 0;

  for (const r2_key of unique) {
    const { data: existing } = await supabase
      .from("gallery_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("r2_key", r2_key)
      .maybeSingle();

    if (existing) continue;

    const { error } = await supabase.from("gallery_items").insert({
      user_id: user.id,
      r2_key,
    });

    if (error) {
      console.error("gallery claim insert", r2_key, error);
    } else {
      inserted += 1;
    }
  }

  return NextResponse.json({ ok: true, requested: unique.length, inserted });
}
