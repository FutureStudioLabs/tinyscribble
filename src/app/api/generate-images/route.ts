import { generateNanoBananaImage } from "@/lib/apiyi-image";
import { getPresignedGetUrl, putObjectBuffer } from "@/lib/r2-server";
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

  const stream = new ReadableStream({
    async start(controller) {
      const push = (obj: unknown) => controller.enqueue(ndjsonLine(obj));

      try {
        push({ type: "progress", percent: 2 });
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
