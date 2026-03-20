import {
  TRIAL_FREE_IMAGE_LIMIT,
  TRIAL_IMAGE_BATCH_SIZE,
  TRIAL_IMAGE_LIMIT_CODE,
} from "@/constants/trial";
import { generateNanoBananaImage } from "@/lib/apiyi-image";
import { fetchBillingCustomerStatusForUser } from "@/lib/billing-customer-read";
import { getPresignedGetUrl, putObjectBuffer } from "@/lib/r2-server";
import { createClient } from "@/lib/supabase/server";
import { countGalleryGeneratedForUser } from "@/lib/trial-gallery-counts";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

function ndjsonLine(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(obj)}\n`);
}

export async function POST(request: NextRequest) {
  let r2Key: string;
  try {
    const body = (await request.json()) as { r2Key?: string };
    r2Key = body?.r2Key ?? "";
    if (typeof r2Key !== "string" || !r2Key.startsWith("uploads/")) {
      return NextResponse.json(
        { error: "Invalid or missing r2Key" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    const { status, errorMessage } = await fetchBillingCustomerStatusForUser(supabase, user);
    if (!errorMessage && status?.trim().toLowerCase() === "trialing") {
      const used = await countGalleryGeneratedForUser(supabase, user.id);
      if (used + TRIAL_IMAGE_BATCH_SIZE > TRIAL_FREE_IMAGE_LIMIT) {
        return NextResponse.json(
          {
            error:
              "Your trial includes up to 5 CGI images. Subscribe in Billing to create more.",
            code: TRIAL_IMAGE_LIMIT_CODE,
          },
          { status: 403 }
        );
      }
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const push = (obj: unknown) => controller.enqueue(ndjsonLine(obj));

      try {
        push({ type: "progress", percent: 2 });
        const {
          data: { user: streamUser },
        } = await supabase.auth.getUser();

        const drawingUrl = await getPresignedGetUrl(r2Key, 3600);
        push({ type: "progress", percent: 8 });

        let finishedImages = 0;
        const onImageDone = () => {
          finishedImages += 1;
          const pct = 8 + Math.round((finishedImages / 3) * 62);
          push({ type: "progress", percent: pct });
        };

        const [buf1, buf2, buf3] = await Promise.all([
          generateNanoBananaImage(drawingUrl).then((b) => {
            onImageDone();
            return b;
          }),
          generateNanoBananaImage(drawingUrl).then((b) => {
            onImageDone();
            return b;
          }),
          generateNanoBananaImage(drawingUrl).then((b) => {
            onImageDone();
            return b;
          }),
        ]);

        push({ type: "progress", percent: 74 });

        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const keys = [
          `generated/${stamp}-1.png`,
          `generated/${stamp}-2.png`,
          `generated/${stamp}-3.png`,
        ] as const;

        await Promise.all([
          putObjectBuffer(keys[0], buf1, "image/png"),
          putObjectBuffer(keys[1], buf2, "image/png"),
          putObjectBuffer(keys[2], buf3, "image/png"),
        ]);

        if (streamUser?.id) {
          const { error: galleryErr } = await supabase.from("gallery_items").insert(
            keys.map((k) => ({ user_id: streamUser.id, r2_key: k }))
          );
          if (galleryErr) console.error("gallery_items insert (images)", galleryErr);
        }

        push({ type: "progress", percent: 94 });
        push({ type: "complete", keys: [...keys] });
      } catch (err) {
        console.error("generate-images:", err);
        push({
          type: "error",
          error: err instanceof Error ? err.message : "Generation failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
