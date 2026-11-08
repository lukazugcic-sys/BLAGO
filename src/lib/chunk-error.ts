export const CHUNK_RELOAD_KEY = "blago-chunk-reload";
export const CHUNK_BUST_PARAM = "_";

export function isChunkLoadError(error: unknown): boolean {
  const m = error instanceof Error ? error.message : String(error ?? "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w.-]+ failed|ChunkLoadError/i.test(
    m,
  );
}

export function clearChunkReloadFlag() {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window === "undefined") return;
  try {
    const u = new URL(window.location.href);
    if (u.searchParams.has(CHUNK_BUST_PARAM)) {
      u.searchParams.delete(CHUNK_BUST_PARAM);
      const next = u.pathname + u.search + u.hash;
      window.history.replaceState(null, "", next);
    }
  } catch {
    /* ignore */
  }
}

export function reloadBustingCache() {
  try {
    const u = new URL(window.location.href);
    u.searchParams.set(CHUNK_BUST_PARAM, String(Date.now()));
    window.location.replace(u.toString());
  } catch {
    window.location.reload();
  }
}
