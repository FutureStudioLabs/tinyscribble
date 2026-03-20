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

/** CGI stills persisted under `generated/` (each batch adds 3). */
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
