import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Links a video gallery row to the CGI still used as the source frame so the dashboard
 * can show a fast image thumbnail instead of decoding MP4 in a <video> grid cell.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { videoR2Key?: string; posterR2Key?: string };
  try {
    body = (await request.json()) as { videoR2Key?: string; posterR2Key?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const videoR2Key = typeof body.videoR2Key === "string" ? body.videoR2Key.trim() : "";
  const posterR2Key = typeof body.posterR2Key === "string" ? body.posterR2Key.trim() : "";

  if (!videoR2Key.startsWith("videos/") || videoR2Key.includes("..")) {
    return NextResponse.json({ error: "Invalid video key" }, { status: 400 });
  }
  if (!posterR2Key.startsWith("generated/") || posterR2Key.includes("..")) {
    return NextResponse.json({ error: "Invalid poster key" }, { status: 400 });
  }

  const { error } = await supabase
    .from("gallery_items")
    .update({ thumbnail_r2_key: posterR2Key })
    .eq("user_id", user.id)
    .eq("r2_key", videoR2Key);

  if (error) {
    console.error("gallery video-thumbnail update", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
