/** Host for overlays so they stay visible inside the Fullscreen API element. */
export function portalKorijen(): HTMLElement {
  if (typeof document === "undefined") {
    throw new Error("portal");
  }
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  const fs = document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
  if (fs instanceof HTMLElement) return fs;
  return document.body;
}
