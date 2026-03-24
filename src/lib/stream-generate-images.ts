import { BillingApiError } from "@/lib/billing-api-error";

type StreamLine =
  | { type: "progress"; percent: number }
  | { type: "complete"; keys: string[]; sceneBatchMode?: "single" | "triple" }
  | { type: "error"; error: string };

export type StreamGenerateImagesResult = {
  keys: string[];
  sceneBatchMode: "single" | "triple";
};

/**
 * Calls POST /api/generate-images (NDJSON stream) and reports real server progress.
 * Paid subscribers get one scene per run (`single`); trial and others get three (`triple`).
 */
export async function streamGenerateImages(
  r2Key: string,
  onProgress: (percent: number) => void
): Promise<StreamGenerateImagesResult> {
  const res = await fetch("/api/generate-images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson",
    },
    body: JSON.stringify({ r2Key }),
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Generation failed (${res.status})`;
    let code: string | undefined;
    try {
      const j = JSON.parse(text) as { error?: string; code?: string };
      if (j.error) msg = j.error;
      if (typeof j.code === "string") code = j.code;
    } catch {
      /* keep msg */
    }
    throw new BillingApiError(msg, code);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let keys: string[] | null = null;
  let sceneBatchMode: "single" | "triple" | null = null;

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";

    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let msg: StreamLine;
      try {
        msg = JSON.parse(trimmed) as StreamLine;
      } catch {
        continue;
      }
      if (msg.type === "progress") {
        onProgress(Math.min(99, Math.max(0, msg.percent)));
      } else if (msg.type === "complete") {
        keys = msg.keys;
        if (msg.sceneBatchMode === "single" || msg.sceneBatchMode === "triple") {
          sceneBatchMode = msg.sceneBatchMode;
        }
      } else if (msg.type === "error") {
        throw new Error(msg.error);
      }
    }

    if (done) break;
  }

  const tail = buffer.trim();
  if (tail) {
    try {
      const msg = JSON.parse(tail) as StreamLine;
      if (msg.type === "progress") {
        onProgress(Math.min(99, Math.max(0, msg.percent)));
      } else if (msg.type === "complete") {
        keys = msg.keys;
        if (msg.sceneBatchMode === "single" || msg.sceneBatchMode === "triple") {
          sceneBatchMode = msg.sceneBatchMode;
        }
      } else if (msg.type === "error") {
        throw new Error(msg.error);
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        /* trailing partial line */
      } else {
        throw e;
      }
    }
  }

  if (!keys || keys.length < 1) {
    throw new Error("Invalid response from server");
  }

  const resolvedMode: "single" | "triple" =
    sceneBatchMode ?? (keys.length === 1 ? "single" : "triple");

  onProgress(100);
  return { keys, sceneBatchMode: resolvedMode };
}
