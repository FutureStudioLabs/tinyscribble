import type { SupabaseClient } from "@supabase/supabase-js";

export async function countGalleryVideosForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("gallery_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .like("r2_key", "videos/%");

  if (error) {
    console.error("trial gallery count (videos)", error);
    return 0;
  }
  return count ?? 0;
}

/** CGI stills persisted under `generated/` (trial: 3 per batch; paid: 1 per batch). */
export async function countGalleryGeneratedForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("gallery_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .like("r2_key", "generated/%");

  if (error) {
    console.error("trial gallery count (generated)", error);
    return 0;
  }
  return count ?? 0;
}

/** Counts in the current Stripe billing period (epoch ms inclusive). */
export async function countGalleryVideosForUserSince(
  supabase: SupabaseClient,
  userId: string,
  sinceMs: number
): Promise<number> {
  const since = new Date(sinceMs).toISOString();
  const { count, error } = await supabase
    .from("gallery_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .like("r2_key", "videos/%")
    .gte("created_at", since);

  if (error) {
    console.error("gallery count (videos since)", error);
    return 0;
  }
  return count ?? 0;
}

export async function countGalleryGeneratedForUserSince(
  supabase: SupabaseClient,
  userId: string,
  sinceMs: number
): Promise<number> {
  const since = new Date(sinceMs).toISOString();
  const { count, error } = await supabase
    .from("gallery_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .like("r2_key", "generated/%")
    .gte("created_at", since);

  if (error) {
    console.error("gallery count (generated since)", error);
    return 0;
  }
  return count ?? 0;
}
