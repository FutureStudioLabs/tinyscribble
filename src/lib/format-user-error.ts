/**
 * Turn raw API / network errors into shorter, calmer copy for the UI.
 * Technical detail can still be passed to support via mailto body.
 */
export function formatErrorForUser(message: string): string {
  const m = message.trim();
  if (!m) return "Something went wrong. Please try again.";

  if (/insufficient_quota|配额不足/i.test(m)) {
    return "We couldn’t complete this step right now—our image service may be at capacity. Please try again in a little while.";
  }

  if (/\b401\b|Unauthorized|invalid.*api.*key/i.test(m)) {
    return "We couldn’t authorize this request. Please try again, or contact support if it keeps happening.";
  }

  if (/\b403\b/.test(m) && /APIYI|apiyi/i.test(m)) {
    return "The image service refused this request (often a quota or permissions issue). Please try again later or contact support.";
  }

  if (m.startsWith("Failed to fetch") || /network|load failed|aborted/i.test(m)) {
    return "We couldn’t reach our servers. Check your connection and try again.";
  }

  if (m.length > 320) {
    return `${m.slice(0, 280).trim()}…`;
  }

  return m;
}
