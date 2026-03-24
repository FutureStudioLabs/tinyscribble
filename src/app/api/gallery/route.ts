import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Returns gallery items for the authenticated user (RLS).
 * Previews use same-origin `/api/media` so missing objects return a normal 404/JSON
 * from the app — not raw S3/R2 XML in the browser (presigned direct-to-R2 URLs do that).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ items: [] });
  }

  const { data: items, error } = await supabase
    .from("gallery_items")
    .select("id, r2_key, created_at, thumbnail_r2_key")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("gallery fetch", error);
    return NextResponse.json({ items: [], error: error.message }, { status: 500 });
  }

  function isVideoKey(key: string): boolean {
    return key.startsWith("videos/") || /\.mp4$/i.test(key);
  }

  return NextResponse.json({
    items: (items ?? []).map((row) => {
      const openUrl = `/api/media?key=${encodeURIComponent(row.r2_key)}`;
      const vid = isVideoKey(row.r2_key);
      const thumb =
        typeof row.thumbnail_r2_key === "string" ? row.thumbnail_r2_key.trim() : "";
      const hasPoster = Boolean(
        vid && thumb && (thumb.startsWith("generated/") || thumb.startsWith("uploads/")) && !thumb.includes("..")
      );
      const previewUrl = hasPoster ? `/api/media?key=${encodeURIComponent(thumb)}` : openUrl;
      return {
        id: row.id,
        r2Key: row.r2_key,
        createdAt: row.created_at,
        previewUrl,
        openUrl,
        hasPoster,
      };
    }),
  });
}
