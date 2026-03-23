import {
  getObjectBufferRange,
  getObjectWebStream,
  headObject,
  inferContentTypeFromKey,
  isAllowedMediaKey,
} from "@/lib/r2-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function resolveContentType(raw: string, key: string): string {
  const lower = (raw || "").toLowerCase();
  if (lower && lower !== "application/octet-stream") return raw;
  return inferContentTypeFromKey(key) || raw || "application/octet-stream";
}

/**
 * Parse a single `Range: bytes=…` header (Safari video sends these for MP4).
 * Returns inclusive start/end; null if not a supported single-range request.
 */
function parseByteRange(
  rangeHeader: string | null,
  size: number
): { start: number; end: number } | null {
  if (!rangeHeader || size <= 0) return null;
  const trimmed = rangeHeader.trim();
  if (!trimmed.toLowerCase().startsWith("bytes=")) return null;
  const spec = trimmed.slice(6).trim();
  const comma = spec.indexOf(",");
  if (comma !== -1) return null;

  if (spec.startsWith("-")) {
    const suffix = parseInt(spec.slice(1), 10);
    if (Number.isNaN(suffix) || suffix <= 0) return null;
    const start = Math.max(0, size - suffix);
    return { start, end: size - 1 };
  }

  const dash = spec.indexOf("-");
  if (dash === -1) return null;
  const startStr = spec.slice(0, dash);
  const endStr = spec.slice(dash + 1);
  const start = startStr ? parseInt(startStr, 10) : 0;
  let end: number;
  if (endStr === "") {
    end = size - 1;
  } else {
    end = parseInt(endStr, 10);
  }
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}

/** Same-origin proxy for R2 objects (private bucket). Only uploads/* and generated/*. */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key || !isAllowedMediaKey(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const head = await headObject(key);
      const total = head.contentLength;
      const resolved = resolveContentType(head.contentType, key);

      const parsed = parseByteRange(rangeHeader, total);
      if (parsed === null) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${total}`,
          },
        });
      }

      const { start, end } = parsed;
      const chunk = await getObjectBufferRange(key, start, end);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          "Content-Type": resolved,
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    const { stream, contentLength, contentType } = await getObjectWebStream(key);
    const resolved = resolveContentType(contentType, key);
    return new NextResponse(stream, {
      headers: {
        "Content-Type": resolved,
        ...(contentLength > 0 ? { "Content-Length": String(contentLength) } : {}),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("api/media", key.slice(0, 80), err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
