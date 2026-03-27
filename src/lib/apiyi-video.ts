import {
  getApiyiBaseUrls,
  isAllowedApiyiBase,
  normalizeApiyiBase,
  shouldRetryApiyiFailure,
} from "@/lib/apiyi-bases";
import { getFetchErrorMessage } from "@/lib/fetch-error-message";
import { VEO_VIDEO_PROMPT } from "@/lib/veo-video-prompt";

const DEFAULT_MODEL = "veo-3.1-fast-fl";

function resolveVideoBase(apiyiBaseOverride?: string | null): string {
  const bases = getApiyiBaseUrls();
  if (apiyiBaseOverride != null && apiyiBaseOverride !== "") {
    const n = normalizeApiyiBase(apiyiBaseOverride);
    if (isAllowedApiyiBase(n)) return n;
  }
  return bases[0]!;
}

function getVideoApiConfig(apiyiBaseOverride?: string | null) {
  const apiKey = process.env.APIYI_API_KEY?.trim();
  const base = resolveVideoBase(apiyiBaseOverride);
  const model = process.env.APIYI_VIDEO_MODEL || DEFAULT_MODEL;
  if (!apiKey) throw new Error("Missing APIYI_API_KEY");
  return { apiKey, base, model };
}

type VideoCreateResponse = { id?: string; status?: string };

/**
 * Step 1: Submit CGI frame as multipart. Returns job id and the APIYI base that accepted it
 * (poll status/content on the same host). Tries fallback VIP host on 5xx/HTML errors.
 */
export async function submitVeoVideoJob(
  imageBuffer: Buffer,
  imageContentType: string
): Promise<{ jobId: string; base: string }> {
  const apiKey = process.env.APIYI_API_KEY?.trim();
  const model = process.env.APIYI_VIDEO_MODEL || DEFAULT_MODEL;
  if (!apiKey) throw new Error("Missing APIYI_API_KEY");

  const ext =
    imageContentType.includes("png") ? "png" : imageContentType.includes("webp") ? "webp" : "jpg";
  const blob = new Blob([new Uint8Array(imageBuffer)], {
    type: imageContentType || "image/png",
  });

  const bases = getApiyiBaseUrls();
  let lastErr: Error | null = null;

  for (let bi = 0; bi < bases.length; bi++) {
    const base = bases[bi]!;
    const form = new FormData();
    form.append("prompt", VEO_VIDEO_PROMPT);
    form.append("model", model);
    form.append("input_reference", blob, `frame.${ext}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    let res: Response;
    try {
      res = await fetch(`${base}/v1/videos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error("APIYI video submit timed out after 120 seconds.");
      }
      lastErr = new Error(
        `APIYI unreachable at ${base}/v1/videos (${getFetchErrorMessage(e)}). ` +
          "Confirm APIYI_API_KEY on the server."
      );
      if (bi < bases.length - 1) continue;
      throw lastErr;
    }
    clearTimeout(timeout);

    const text = await res.text();
    if (!res.ok) {
      const tryNext =
        bi < bases.length - 1 && shouldRetryApiyiFailure(res.status, text);
      lastErr = new Error(`APIYI video submit ${res.status} at ${base}: ${text.slice(0, 800)}`);
      if (tryNext) continue;
      throw lastErr;
    }

    let data: VideoCreateResponse;
    try {
      data = JSON.parse(text) as VideoCreateResponse;
    } catch {
      lastErr = new Error(`Invalid JSON from APIYI video submit at ${base}`);
      if (bi < bases.length - 1 && shouldRetryApiyiFailure(500, text)) continue;
      throw lastErr;
    }

    const id = data.id;
    if (!id || typeof id !== "string") {
      throw new Error("APIYI video submit: missing job id");
    }
    return { jobId: id, base };
  }

  throw lastErr ?? new Error("APIYI: all base URLs failed for video submit");
}

type VideoStatusResponse = {
  status?: string;
  error?: { message?: string };
};

/**
 * Step 2: Poll job status. Pass the same `apiyiBase` returned from {@link submitVeoVideoJob}.
 */
export async function getVeoVideoStatus(
  jobId: string,
  apiyiBase?: string | null
): Promise<{
  status: "queued" | "processing" | "completed" | "failed";
  errorMessage?: string;
}> {
  const { apiKey, base } = getVideoApiConfig(apiyiBase);
  let res: Response;
  try {
    res = await fetch(`${base}/v1/videos/${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (e) {
    throw new Error(
      `APIYI video status fetch failed (${getFetchErrorMessage(e)})`
    );
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`APIYI video status ${res.status}: ${text.slice(0, 500)}`);
  }
  let data: VideoStatusResponse;
  try {
    data = JSON.parse(text) as VideoStatusResponse;
  } catch {
    throw new Error("Invalid JSON from APIYI video status");
  }
  const raw = (data.status || "").toLowerCase();
  if (raw === "failed" || raw === "error") {
    return {
      status: "failed",
      errorMessage: data.error?.message || "Video generation failed",
    };
  }
  if (raw === "completed" || raw === "succeeded" || raw === "success") {
    return { status: "completed" };
  }
  if (raw === "processing" || raw === "running" || raw === "in_progress") {
    return { status: "processing" };
  }
  return { status: "queued" };
}

function looksLikeMp4(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // ISO BMFF: "ftyp" at offset 4
  return buf.subarray(4, 8).toString("ascii") === "ftyp";
}

function looksLikeWebm(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
}

/** Find first https URL in a JSON-like object (APIYI may nest fields differently). */
function findVideoUrlInJson(value: unknown, depth = 0): string | null {
  if (depth > 8) return null;
  if (typeof value === "string") {
    const t = value.trim();
    if (/^https?:\/\//i.test(t)) return t;
    return null;
  }
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const u = findVideoUrlInJson(item, depth + 1);
      if (u) return u;
    }
    return null;
  }
  const o = value as Record<string, unknown>;
  const preferredKeys = [
    "url",
    "video_url",
    "videoUrl",
    "download_url",
    "downloadUrl",
    "file_url",
    "output_url",
    "href",
    "link",
  ];
  for (const k of preferredKeys) {
    const v = o[k];
    if (typeof v === "string" && /^https?:\/\//i.test(v.trim())) return v.trim();
  }
  for (const v of Object.values(o)) {
    const u = findVideoUrlInJson(v, depth + 1);
    if (u) return u;
  }
  return null;
}

function parseJsonLenient(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/im);
    if (fence) {
      try {
        return JSON.parse(fence[1].trim()) as unknown;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function findBase64VideoField(obj: unknown): Buffer | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const keys = ["video_base64", "video", "data", "file", "content", "b64"];
  for (const k of keys) {
    const v = o[k];
    if (typeof v !== "string" || v.length < 100) continue;
    const cleaned = v.replace(/^data:video\/[^;]+;base64,/i, "").replace(/\s/g, "");
    if (/^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length > 100) {
      try {
        return Buffer.from(cleaned, "base64");
      } catch {
        /* continue */
      }
    }
  }
  for (const v of Object.values(o)) {
    if (v && typeof v === "object") {
      const inner = findBase64VideoField(v);
      if (inner) return inner;
    }
  }
  return null;
}

export type VeoVideoContentResult =
  | { kind: "url"; url: string }
  | { kind: "buffer"; buffer: Buffer };

/**
 * Step 3: Parse GET /v1/videos/:id/content.
 * APIYI may return JSON `{ url }`, nested URLs, base64 video, or raw MP4 bytes.
 */
export async function getVeoVideoContent(
  jobId: string,
  apiyiBase?: string | null
): Promise<VeoVideoContentResult> {
  const { apiKey, base } = getVideoApiConfig(apiyiBase);
  let res: Response;
  try {
    res = await fetch(`${base}/v1/videos/${encodeURIComponent(jobId)}/content`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (e) {
    throw new Error(
      `APIYI video content fetch failed (${getFetchErrorMessage(e)})`
    );
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const arrayBuffer = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  if (!res.ok) {
    const preview = buf.toString("utf8").slice(0, 500);
    throw new Error(`APIYI video content ${res.status}: ${preview}`);
  }

  const isDeclaredBinary =
    contentType.includes("video/") ||
    contentType.includes("octet-stream") ||
    contentType.includes("application/octet");

  if (isDeclaredBinary && (looksLikeMp4(buf) || looksLikeWebm(buf) || buf.length > 10_000)) {
    return { kind: "buffer", buffer: buf };
  }

  const text = buf.toString("utf8");
  const parsed = parseJsonLenient(text);

  if (parsed !== null) {
    const url = findVideoUrlInJson(parsed);
    if (url) return { kind: "url", url };

    const fromB64 = findBase64VideoField(parsed);
    if (fromB64 && fromB64.length > 1_000) {
      return { kind: "buffer", buffer: fromB64 };
    }
  }

  // Body is not valid JSON — often raw MP4 with wrong/missing Content-Type
  if (looksLikeMp4(buf) || looksLikeWebm(buf)) {
    return { kind: "buffer", buffer: buf };
  }

  const snippet = text.replace(/\s+/g, " ").slice(0, 280);
  throw new Error(
    `APIYI video content: expected JSON with a video URL, base64 payload, or binary MP4. content-type=${contentType || "(none)"} preview=${snippet}`
  );
}

/**
 * @deprecated Prefer {@link getVeoVideoContent} (handles binary + alternate JSON).
 */
export async function getVeoVideoContentUrl(
  jobId: string,
  apiyiBase?: string | null
): Promise<string> {
  const r = await getVeoVideoContent(jobId, apiyiBase);
  if (r.kind === "url") return r.url;
  throw new Error("APIYI video content: response was binary; use getVeoVideoContent + upload");
}
