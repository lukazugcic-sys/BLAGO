import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react";

type BlagoFsApi = {
  toggle: () => void;
  enter: () => void;
  exit: () => void;
  isImmersive: () => boolean;
};

function inIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function blagoFs(): BlagoFsApi | null {
  if (typeof window === "undefined") return null;
  const api = (window as Window & { BlagoFs?: BlagoFsApi }).BlagoFs;
  return api ?? null;
}

function isCapacitorNative() {
  try {
    const c = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } })
      .Capacitor;
    return !!(c?.isNativePlatform?.() || c?.getPlatform?.() === "android");
  } catch {
    return false;
  }
}

function fsElement() {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function nativeFsAvailable() {
  if (typeof document === "undefined") return false;
  if (blagoFs() || isCapacitorNative()) return true;
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
export function requestNativeFullscreen(_el?: HTMLElement | null) {
  if (typeof document === "undefined") return;
  applyCssFs(true);
  const api = blagoFs();
  if (api) {
    try {
      // 0.9.167: keep Android status bar visible by default (exit immersive).
      api.exit();
    } catch {
      /* bars already visible */
    }
    return;
  }
  if (!nativeFsAvailable()) return;
  const aktivacija = (navigator as Navigator & { userActivation?: { isActive?: boolean } }).userActivation;
  if (aktivacija && aktivacija.isActive === false) return;
  const node = document.documentElement;
  void enterFs(node).catch(() => {});
}

/**
 * Chrome-friendly "fullscreen": CSS 100dvh app shell always.
 * APK uses native immersive sticky via BlagoFs (Android WebView has no Fullscreen API).
 * Browser uses the Fullscreen API when the document is top-level.
 */
export function useFullscreen(target: RefObject<HTMLElement | null>) {
  const [native, setNative] = useState(false);
  const [canNative, setCanNative] = useState(false);

  useLayoutEffect(() => {
    applyCssFs(true);
    const sync = () => {
      const api = blagoFs();
      if (api || isCapacitorNative()) {
        setCanNative(true);
        if (api) {
          try {
            setNative(!!api.isImmersive());
          } catch {
            setNative(true);
          }
        } else {
          setNative(true);
        }
        return !!api;
      }
      setCanNative(nativeFsAvailable());
      setNative(!!fsElement());
      return false;
    };
    if (sync()) return;
    const id = window.setInterval(() => {
      if (sync()) window.clearInterval(id);
    }, 200);
    const stop = window.setTimeout(() => window.clearInterval(id), 5000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, []);

  useEffect(() => {
    const sync = () => {
      const api = blagoFs();
      if (api) {
        try {
          setNative(!!api.isImmersive());
        } catch {
          /* keep */
        }
        return;
      }
      setNative(!!fsElement());
    };
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync as EventListener);
    };
  }, []);

  const toggle = useCallback(async () => {
    const api = blagoFs();
    if (api) {
      try {
        api.toggle();
        setNative((v) => !v);
      } catch {
        /* still CSS shell */
      }
      applyCssFs(true);
      return;
    }
    if (!nativeFsAvailable()) {
      applyCssFs(true);
      return;
    }
    const el = document.documentElement;
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
