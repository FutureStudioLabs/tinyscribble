/**
 * Share one async operation per key (e.g. same upload file or same source R2 key).
 * Stops React Strict Mode double-mounts from firing duplicate API calls.
 */
const map = new Map<string, Promise<unknown>>();

export function shareInFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = map.get(key);
  if (existing) return existing as Promise<T>;

  const p: Promise<T> = run().finally(() => {
    if (map.get(key) === p) map.delete(key);
  });
  map.set(key, p);
  return p;
}
