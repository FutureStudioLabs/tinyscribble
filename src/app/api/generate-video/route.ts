import {
  getVeoVideoContent,
  getVeoVideoStatus,
  submitVeoVideoJob,
} from "@/lib/apiyi-video";
import { TRIAL_FREE_VIDEO_LIMIT, TRIAL_VIDEO_EXHAUSTED_CODE } from "@/constants/trial";
import { fetchBillingCustomerStatusForUser } from "@/lib/billing-customer-read";
import { isSubscriptionEntitled } from "@/lib/billing-entitlement";
import { getObjectBuffer, putObjectBuffer } from "@/lib/r2-server";
import { createClient } from "@/lib/supabase/server";
import { countGalleryVideosForUser } from "@/lib/trial-gallery-counts";
import type { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

async function assertVideoAccess(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; user: User }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Subscription required" }, { status: 403 }),
    };
  }
  const { status, errorMessage } = await fetchBillingCustomerStatusForUser(supabase, user);
  if (errorMessage) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Subscription required" }, { status: 403 }),
    };
  }
  if (!isSubscriptionEntitled(status)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Subscription required" }, { status: 403 }),
    };
  }
  return { ok: true, supabase, user };
}

function isGeneratedKey(key: string): boolean {
  // Allow generated/ or uploads/ (if testing with raw uploads)
  return (key.startsWith("generated/") || key.startsWith("uploads/")) && !key.includes("..") && key.length < 500;
}

function safeVideoKey(jobId: string): string {
  const safe = jobId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120) || "job";
  return `videos/veo-${safe}.mp4`;
}

/**
 * POST { cgiKey } — start VEO job from R2 CGI frame. Returns { jobId }.
 */
export async function POST(request: NextRequest) {
  const access = await assertVideoAccess();
  if (!access.ok) return access.response;

  const { supabase, user } = access;
  const { status } = await fetchBillingCustomerStatusForUser(supabase, user);
  if (status?.trim().toLowerCase() === "trialing") {
    const used = await countGalleryVideosForUser(supabase, user.id);
    if (used >= TRIAL_FREE_VIDEO_LIMIT) {
      return NextResponse.json(
        {
          error: "Your trial includes one free video. Subscribe to create more.",
          code: TRIAL_VIDEO_EXHAUSTED_CODE,
        },
        { status: 403 }
      );
    }
  }

  let body: { cgiKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cgiKey = typeof body.cgiKey === "string" ? body.cgiKey.trim() : "";
  if (!isGeneratedKey(cgiKey)) {
    return NextResponse.json({ error: "Invalid cgiKey" }, { status: 400 });
  }

  try {
    const { buffer, contentType } = await getObjectBuffer(cgiKey);
    const jobId = await submitVeoVideoJob(buffer, contentType);
    return NextResponse.json({ jobId });
  } catch (e) {
    console.error("generate-video POST", e);
    const msg = e instanceof Error ? e.message : "Video start failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET ?jobId= — poll status; when completed, pull MP4 into R2 and return { status, r2Key? }.
 */
export async function GET(request: NextRequest) {
  const access = await assertVideoAccess();
  if (!access.ok) return access.response;

  const jobId = request.nextUrl.searchParams.get("jobId")?.trim() ?? "";
  if (!jobId || jobId.length > 200) {
    return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
  }

  /** Same CGI frame used for VEO — stored as gallery thumbnail (reliable vs separate client POST). */
  const cgiKeyParam = request.nextUrl.searchParams.get("cgiKey")?.trim() ?? "";
  const posterR2Key = isGeneratedKey(cgiKeyParam) ? cgiKeyParam : null;

  try {
    const { status, errorMessage } = await getVeoVideoStatus(jobId);

    if (status === "failed") {
      return NextResponse.json({
        status: "failed",
        error: errorMessage || "Video generation failed",
      });
    }

    if (status === "queued" || status === "processing") {
      return NextResponse.json({ status });
    }

    // completed — /content may be JSON { url } or raw MP4 / base64 (see apiyi-video)
    const content = await getVeoVideoContent(jobId);
    let buffer: Buffer;
    if (content.kind === "buffer") {
      buffer = content.buffer;
    } else {
      const videoRes = await fetch(content.url);
      if (!videoRes.ok) {
        throw new Error(`Download video failed ${videoRes.status}`);
      }
      buffer = Buffer.from(await videoRes.arrayBuffer());
    }
    const r2Key = safeVideoKey(jobId);
    await putObjectBuffer(r2Key, buffer, "video/mp4");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      const row: {
        user_id: string;
        r2_key: string;
        thumbnail_r2_key?: string;
      } = {
        user_id: user.id,
        r2_key: r2Key,
      };
      if (posterR2Key) {
        row.thumbnail_r2_key = posterR2Key;
      }
      const { error: galleryErr } = await supabase.from("gallery_items").insert(row);
      if (galleryErr) console.error("gallery_items insert (video)", galleryErr);
    }

    return NextResponse.json({
      status: "completed",
      r2Key,
      mediaUrl: `/api/media?key=${encodeURIComponent(r2Key)}`,
    });
  } catch (e) {
    console.error("generate-video GET", e);
    const msg = e instanceof Error ? e.message : "Video poll failed";
    return NextResponse.json({ status: "failed", error: msg }, { status: 500 });
  }
}
