import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react";

function inIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function fsElement() {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function nativeFsAvailable() {
  if (typeof document === "undefined") return false;
  if (inIframe()) return false;
  const doc = document as Document & { webkitFullscreenEnabled?: boolean };
  return !!(document.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

function applyCssFs(on: boolean) {
  document.documentElement.classList.toggle("is-fs", on);
  document.body.classList.toggle("is-fs", on);
}

async function lockPortrait() {
  try {
    const ori = screen.orientation as ScreenOrientation & {
      lock?: (mode: string) => Promise<void>;
    };
    await ori.lock?.("portrait");
  } catch {
    /* private / unsupported */
  }
}

async function enterFs(el: HTMLElement) {
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  const opts: FullscreenOptions = { navigationUI: "hide" };
  if (el.requestFullscreen) await el.requestFullscreen(opts);
  else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen();
  else throw new Error("unsupported");
  await lockPortrait();
}

async function exitFs() {
  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
  if (document.exitFullscreen) return document.exitFullscreen();
  if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen();
}

/** Call from a user gesture (splash tap). No-ops in iframes and Chrome without API. */
export function requestNativeFullscreen(el?: HTMLElement | null) {
  if (typeof document === "undefined") return;
  applyCssFs(true);
  if (!nativeFsAvailable()) return;
  const node = el ?? document.documentElement;
  void enterFs(node).catch(() => {});
}

/**
 * Chrome-friendly "fullscreen": CSS 100dvh app shell always.
 * Native Fullscreen API only on an explicit button, and only when the
 * document is top-level (not an iframe) and the API is enabled.
 */
export function useFullscreen(target: RefObject<HTMLElement | null>) {
  const [native, setNative] = useState(false);
  const [canNative, setCanNative] = useState(false);

  useLayoutEffect(() => {
    applyCssFs(true);
    setCanNative(nativeFsAvailable());
  }, []);

  useEffect(() => {
    const sync = () => setNative(!!fsElement());
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync as EventListener);
    };
  }, []);

  const toggle = useCallback(async () => {
    if (!nativeFsAvailable()) {
      applyCssFs(true);
      return;
    }
    const el = target.current ?? document.documentElement;
    if (fsElement()) {
      await exitFs().catch(() => {});
      applyCssFs(true);
      return;
    }
    try {
      await enterFs(el);
      applyCssFs(true);
    } catch {
      applyCssFs(true);
    }
  }, [target]);

  return { native, canNative, toggle };
}
