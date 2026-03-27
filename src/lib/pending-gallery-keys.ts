const STORAGE_KEY = "tinyscribble:pending-gallery-keys";

function readList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
}

function writeList(keys: string[]) {
  try {
    if (keys.length === 0) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* quota / private mode */
  }
}

function isAllowedGalleryKey(key: string): boolean {
  if (!key || key.length > 512 || key.includes("..")) return false;
  return (
    key.startsWith("uploads/") ||
    key.startsWith("generated/") ||
    key.startsWith("videos/")
  );
}

/** Queue R2 keys to attach to the user gallery after sign-in (anonymous funnel). */
export function rememberGalleryKey(key: string): void {
  if (typeof window === "undefined" || !key) return;
  if (!isAllowedGalleryKey(key)) return;
  const list = readList();
  if (!list.includes(key)) list.push(key);
  writeList(list);
}

export function rememberGalleryKeys(keys: readonly string[]): void {
  for (const k of keys) rememberGalleryKey(k);
}

export function getPendingGalleryKeysSnapshot(): string[] {
  return [...new Set(readList())];
}

export function clearPendingGalleryKeys(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
