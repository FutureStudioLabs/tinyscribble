import {
  getObjectBuffer,
  inferContentTypeFromKey,
  isAllowedMediaKey,
} from "@/lib/r2-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Same-origin proxy for R2 objects (private bucket). Only uploads/* and generated/*. */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key || !isAllowedMediaKey(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const { buffer, contentType } = await getObjectBuffer(key);
    const raw = (contentType || "").toLowerCase();
    const resolved =
      raw && raw !== "application/octet-stream"
        ? contentType
        : inferContentTypeFromKey(key) || contentType || "application/octet-stream";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": resolved,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("api/media", key.slice(0, 80), err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
