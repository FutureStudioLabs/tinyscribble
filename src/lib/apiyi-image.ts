import { NANO_BANANA_IMAGE_PROMPT } from "@/lib/nano-banana-prompt";

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

/**
 * Calls APIYI nano-banana with a publicly reachable image URL (e.g. presigned R2 GET).
 * Returns decoded PNG/JPEG bytes.
 */
export async function generateNanoBananaImage(
  drawingImageUrl: string
): Promise<Buffer> {
  const apiKey = process.env.APIYI_API_KEY;
  const base = process.env.APIYI_BASE_URL || "https://api.apiyi.com";
  const model = process.env.APIYI_IMAGE_MODEL || "nano-banana";
  if (!apiKey) {
    throw new Error("Missing APIYI_API_KEY");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  let res: Response;
  try {
    res = await fetch(`${base.replace(/\/$/, "")}/v1/chat/completions`, {
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
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`APIYI ${res.status}: ${text.slice(0, 800)}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
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
