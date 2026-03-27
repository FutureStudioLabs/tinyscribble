import {
  getApiyiBaseUrls,
  shouldRetryApiyiFailure,
} from "@/lib/apiyi-bases";
import { getFetchErrorMessage } from "@/lib/fetch-error-message";
import { NANO_BANANA_IMAGE_PROMPT } from "@/lib/nano-banana-prompt";

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

/** Default image model — brief: use nano-banana only (not nano-banana-2 / pro). */
export const APIYI_DEFAULT_IMAGE_MODEL = "nano-banana";

/**
 * Calls APIYI chat completions with **nano-banana** (or APIYI_IMAGE_MODEL if set).
 * Expect a publicly reachable image URL (e.g. presigned R2 GET). Returns decoded PNG/JPEG bytes.
 * Tries APIYI_FALLBACK_BASE_URL (default vip.apiyi.com) if primary returns 5xx/HTML.
 */
export async function generateNanoBananaImage(
  drawingImageUrl: string
): Promise<Buffer> {
  const apiKey = process.env.APIYI_API_KEY;
  const model = process.env.APIYI_IMAGE_MODEL?.trim() || APIYI_DEFAULT_IMAGE_MODEL;
  if (!apiKey) {
    throw new Error("Missing APIYI_API_KEY");
  }

  const bases = getApiyiBaseUrls();
  let lastErr: Error | null = null;

  for (let bi = 0; bi < bases.length; bi++) {
    const base = bases[bi]!;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    let res: Response;
    try {
      res = await fetch(`${base}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: NANO_BANANA_IMAGE_PROMPT },
                {
                  type: "image_url",
                  image_url: { url: drawingImageUrl },
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error("APIYI image request timed out after 120 seconds.");
      }
      lastErr = new Error(
        `APIYI unreachable at ${base}/v1/chat/completions (${getFetchErrorMessage(e)}). ` +
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
      lastErr = new Error(
        `APIYI ${res.status} at ${base}: ${text.slice(0, 800)}`
      );
      if (tryNext) continue;
      throw lastErr;
    }

    let data: ChatCompletionResponse;
    try {
      data = JSON.parse(text) as ChatCompletionResponse;
    } catch {
      lastErr = new Error(
        `Invalid JSON from APIYI at ${base}: ${text.slice(0, 400)}`
      );
      if (
        bi < bases.length - 1 &&
        shouldRetryApiyiFailure(500, text)
      ) {
        continue;
      }
      throw lastErr;
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No message content in APIYI response");
    }

    let match = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
    if (!match) match = content.match(/([A-Za-z0-9+/=]{100,})/);
    if (!match) {
      throw new Error("Could not parse base64 image from APIYI response");
    }

    return Buffer.from(match[1], "base64");
  }

  throw lastErr ?? new Error("APIYI: all base URLs failed for image generation");
}
