import {
  getVeoVideoContent,
  getVeoVideoStatus,
  submitVeoVideoJob,
} from "@/lib/apiyi-video";
import { fetchBillingCustomerStatusForUser } from "@/lib/billing-customer-read";
import { isSubscriptionEntitled } from "@/lib/billing-entitlement";
import { getObjectBuffer, putObjectBuffer } from "@/lib/r2-server";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

async function userIsEntitled(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return false;
  const { status, errorMessage } = await fetchBillingCustomerStatusForUser(
    supabase,
    user
  );
  if (errorMessage) return false;
  return isSubscriptionEntitled(status);
}

function isGeneratedKey(key: string): boolean {
  return key.startsWith("generated/") && !key.includes("..") && key.length < 500;
}

function safeVideoKey(jobId: string): string {
  const safe = jobId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120) || "job";
  return `videos/veo-${safe}.mp4`;
}

/**
 * POST { cgiKey } — start VEO job from R2 CGI frame. Returns { jobId }.
 */
export async function POST(request: NextRequest) {
  if (!(await userIsEntitled())) {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
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
  if (!(await userIsEntitled())) {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  }

  const jobId = request.nextUrl.searchParams.get("jobId")?.trim() ?? "";
  if (!jobId || jobId.length > 200) {
    return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
  }

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
      const { error: galleryErr } = await supabase.from("gallery_items").insert({
        user_id: user.id,
        r2_key: r2Key,
      });
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
