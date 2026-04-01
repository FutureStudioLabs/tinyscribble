/**
 * Lazily loads FingerprintJS (open-source, free tier) and returns the visitor ID.
 * The promise is cached for the lifetime of the page so FingerprintJS is only
 * initialised once regardless of how many times this is called.
 *
 * Safe to call from any client-side event handler; never import in server code.
 */

let cached: Promise<string | undefined> | null = null;

export function loadFingerprint(): Promise<string | undefined> {
  if (!cached) {
    cached = (async () => {
      try {
        const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
      } catch {
        // Ad blockers or privacy browsers can block FingerprintJS — fail gracefully.
        // Rate limiting falls back to IP-only when visitorId is unavailable.
        return undefined;
      }
    })();
  }
  return cached;
}
