/** Clamp bottom-nav long-press sheet (nav-stupac) into the viewport.
 *  0.9.169: bottom-anchored in the lower half; no off-screen edges.
 */

export type NavStupacViewport = {
  width: number;
  height: number;
  /** Top system inset (status bar), px */
  safeTop?: number;
  /** Bottom system inset; ignore if navHeight already includes it */
  safeBottom?: number;
};

export type NavStupacOpts = {
  /** Icon / anchor center X in viewport coordinates */
  anchorX: number;
  viewport: NavStupacViewport;
  /** Preferred sheet width before horizontal clamp */
  preferredWidth?: number;
  /**
   * Distance from viewport bottom to the top of the bottom nav (px).
   * When the nav element already includes safe-area padding, pass
   * `innerHeight - nav.getBoundingClientRect().top` (do not add safeBottom again).
   */
  navStackHeight?: number;
  /** Gap between sheet bottom and nav top */
  gap?: number;
  /** Horizontal inset from screen edges */
  margin?: number;
  /** Cap as a fraction of usable viewport height (default 0.5 = lower half) */
  maxHeightFraction?: number;
};

export type NavStupacPozicija = {
  /** CSS `left` — left edge of the sheet (not center) */
  left: number;
  width: number;
  /** CSS `bottom` — sheet sits just above the nav */
  bottom: number;
  /** CSS `max-height` — ≤ half of usable viewport, fits above nav */
  maxHeight: number;
};

const DEFAULT_PREFERRED = 288;
const DEFAULT_NAV = 72;
const DEFAULT_GAP = 8;
const DEFAULT_MARGIN = 8;

/** Pure: clamp long-press sheet box into the lower half of the viewport. */
export function stezniNavStupacPoziciju(o: NavStupacOpts): NavStupacPozicija {
  const margin = o.margin ?? DEFAULT_MARGIN;
  const gap = o.gap ?? DEFAULT_GAP;
  const safeTop = Math.max(0, o.viewport.safeTop ?? 0);
  const safeBottom = Math.max(0, o.viewport.safeBottom ?? 0);
  const vw = Math.max(0, o.viewport.width);
  const vh = Math.max(0, o.viewport.height);

  const maxW = Math.max(0, vw - margin * 2);
  const width = Math.min(Math.max(0, o.preferredWidth ?? DEFAULT_PREFERRED), maxW);

  // Left edge so the full width stays on-screen (fixes edge tabs Zid / Tržnica).
  const rawLeft = o.anchorX - width / 2;
  const left = maxW <= 0 ? margin : Math.max(margin, Math.min(rawLeft, vw - margin - width));

  const navStack = Math.max(0, o.navStackHeight ?? DEFAULT_NAV + safeBottom);
  const bottom = navStack + gap;

  const usable = Math.max(0, vh - safeTop - safeBottom);
  const halfCap = usable * (o.maxHeightFraction ?? 0.5);
  // Room from sheet bottom up to below the top safe inset.
  const roomUp = Math.max(0, vh - bottom - safeTop - margin);
  const maxHeight = Math.min(halfCap, roomUp);

  return {
    left: Number.isFinite(left) ? left : margin,
    width: Number.isFinite(width) ? width : 0,
    bottom: Number.isFinite(bottom) ? bottom : gap,
    maxHeight: Number.isFinite(maxHeight) ? maxHeight : 0,
  };
}

/** Preferred width for a tab's long-press sheet (Kauba grid is wider). */
export function navStupacPreferredWidth(tabId: string, viewportWidth: number): number {
  const margin = DEFAULT_MARGIN * 2;
  if (tabId === "selo") return Math.min(22 * 16, Math.max(0, viewportWidth - margin));
  return Math.min(18 * 16, Math.max(0, viewportWidth - margin));
}
