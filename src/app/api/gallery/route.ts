import { getPresignedGetUrl } from "@/lib/r2-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Returns gallery items for the authenticated user (RLS). */
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
    .select("id, r2_key, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("gallery fetch", error);
    return NextResponse.json({ items: [], error: error.message }, { status: 500 });
  }

  const rows = items ?? [];
  const mapped = await Promise.all(
    rows.map(async (row) => {
      let previewUrl: string;
      try {
        previewUrl = await getPresignedGetUrl(row.r2_key, 3600);
      } catch (e) {
        console.error("gallery presign", row.r2_key?.slice(0, 64), e);
        previewUrl = `/api/media?key=${encodeURIComponent(row.r2_key)}`;
      }
      return {
        id: row.id,
        r2Key: row.r2_key,
        createdAt: row.created_at,
        previewUrl,
      };
    })
  );

  return NextResponse.json({ items: mapped });
}
