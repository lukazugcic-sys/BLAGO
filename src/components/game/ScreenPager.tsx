import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TABOVI, type TabId } from "@/lib/game/constants";
import { playSfx } from "@/lib/game/audio";
import { uzorakMeka } from "@/lib/game/pokret";
import { smanjenPokret } from "@/lib/game/feel";

type Pane = { id: TabId; node: ReactNode };

export const PAGER_JUMP_MS = 180;

export function paneFromScroll(scrollLeft: number, width: number, n: number) {
  if (width <= 0 || n <= 0) return 0;
  return Math.max(0, Math.min(n - 1, Math.round(scrollLeft / width)));
}

function around(center: number, n: number) {
  const c = Math.max(0, Math.min(Math.max(0, n - 1), center));
  const next = new Set<number>([c]);
  if (c > 0) next.add(c - 1);
  if (c < n - 1) next.add(c + 1);
  return next;
}

export function ScreenPager({
  tab,
  onTab,
  panes,
  sve = false,
}: {
  tab: TabId;
  onTab: (id: TabId) => void;
  panes: Pane[];
  sve?: boolean;
}) {
  const idx = Math.max(0, panes.findIndex((p) => p.id === tab));
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trakaRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(idx);
  const vizRef = useRef(idx);
  const cancelAnim = useRef<(() => void) | null>(null);
  const firstRef = useRef(true);
  const dragRef = useRef<{ x: number; y: number; dx: number; os: "x" | "y" | null } | null>(null);
  const n = panes.length;
  const [ready, setReady] = useState(false);
  const [posjecen, setPosjecen] = useState(() => around(idx, n));
  const [smjer, setSmjer] = useState(0);
  const reduce = smanjenPokret();

  const mounted = useMemo(() => {
    if (sve) return new Set(panes.map((_, i) => i));
    const u = new Set(posjecen);
    u.add(idx);
    if (idx > 0) u.add(idx - 1);
    if (idx < n - 1) u.add(idx + 1);
    return u;
  }, [sve, posjecen, idx, n, panes]);

  idxRef.current = idx;

  const nacrtaj = (frac: number, miruje = false) => {
    const el = trakaRef.current;
    if (!el) return;
    vizRef.current = frac;
    const cijeli = miruje || Math.abs(frac - Math.round(frac)) < 0.001;
    el.style.opacity = "1";
    if (cijeli) {
      el.classList.remove("is-vuce");
      el.style.willChange = "auto";
      el.style.transform = "none";
      el.style.marginLeft = `${-Math.round(frac) * 100}%`;
      const host = scrollerRef.current;
      if (host && host.scrollLeft !== 0) host.scrollLeft = 0;
      return;
    }
    el.classList.add("is-vuce");
    el.style.willChange = "transform";
    el.style.marginLeft = "0px";
    el.style.transform = `translate3d(${-frac * 100}%, 0, 0)`;
  };

  const animirajNa = useCallback((cilj: number, ms: number) => {
    cancelAnim.current?.();
    const from = vizRef.current;
    const el = trakaRef.current;
    if (!el) return;
    const reduce = smanjenPokret();
    if (ms <= 0 || (!reduce && Math.abs(from - cilj) < 0.001)) {
      nacrtaj(cilj, true);
      return;
    }
    if (reduce) nacrtaj(cilj, true);
    const trajanje = reduce ? 100 : ms;
    const t0 = performance.now();
    let raf = 0;
    let otkazan = false;
    const tick = (now: number) => {
      if (otkazan) return;
      const p = Math.min(1, (now - t0) / trajanje);
      const e = reduce ? p : uzorakMeka(p);
      if (!reduce && p < 1) nacrtaj(from + (cilj - from) * e);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      nacrtaj(cilj, true);
      cancelAnim.current = null;
    };
    raf = requestAnimationFrame(tick);
    cancelAnim.current = () => {
      otkazan = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  useLayoutEffect(() => {
    const prvi = firstRef.current;
    firstRef.current = false;
    if (!prvi && Math.abs(vizRef.current - idx) > 0.01) setSmjer(idx > vizRef.current ? 1 : -1);
    setPosjecen((s) => {
      if (s.has(idx)) return s;
      const nset = new Set(s);
      nset.add(idx);
      return nset;
    });
    animirajNa(idx, prvi ? 0 : smanjenPokret() ? 100 : PAGER_JUMP_MS);
    setReady(true);
  }, [idx, animirajNa]);

  useEffect(() => () => cancelAnim.current?.(), []);

  useEffect(() => {
    const host = scrollerRef.current;
    if (!host) return;
    const drzi = () => {
      if (host.scrollLeft !== 0) host.scrollLeft = 0;
    };
    host.addEventListener("scroll", drzi, { passive: true });
    return () => host.removeEventListener("scroll", drzi);
  }, []);

  const zavrsiPotez = (dx: number) => {
    const w = scrollerRef.current?.clientWidth || 1;
    const i = idxRef.current;
    if (dx <= -w * 0.18 && i < n - 1) {
      playSfx("button");
      onTab(panes[i + 1]!.id);
      return;
    }
    if (dx >= w * 0.18 && i > 0) {
      playSfx("button");
      onTab(panes[i - 1]!.id);
      return;
    }
    animirajNa(i, smanjenPokret() ? 100 : PAGER_JUMP_MS);
  };

  return (
    <div
      ref={scrollerRef}
      className="pager-scroller pager-xform relative z-0 min-h-0 min-w-0 w-full flex-1"
      style={{ visibility: ready ? "visible" : "hidden" }}
      data-smanjen={reduce ? "1" : "0"}
      onPointerDown={(e) => {
        const t = e.target as HTMLElement | null;
        if (t?.closest("[data-lock-pan]")) return;
        cancelAnim.current?.();
        dragRef.current = { x: e.clientX, y: e.clientY, dx: 0, os: null };
      }}
      onPointerMove={(e) => {
        const d = dragRef.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (d.os === null) {
          if (Math.hypot(dx, dy) < 8) return;
          d.os = Math.abs(dx) > Math.abs(dy) * 1.15 ? "x" : "y";
          if (d.os === "y") {
            dragRef.current = null;
            return;
          }
        }
        if (d.os !== "x" || smanjenPokret()) return;
        d.dx = dx;
        const w = scrollerRef.current?.clientWidth || 1;
        const frac = idxRef.current - dx / w;
        const stegnut = Math.max(-0.18, Math.min(n - 1 + 0.18, frac));
        nacrtaj(stegnut);
      }}
      onPointerUp={() => {
        const d = dragRef.current;
        dragRef.current = null;
        if (!d || d.os !== "x") return;
        zavrsiPotez(d.dx);
      }}
      onPointerCancel={() => {
        const d = dragRef.current;
        dragRef.current = null;
        if (d?.os === "x") animirajNa(idxRef.current, smanjenPokret() ? 100 : PAGER_JUMP_MS);
      }}
    >
      <div ref={trakaRef} className="pager-traka">
        {panes.map((p, i) => (
          <div
            key={p.id}
            className={
              "pager-pane h-full min-h-0 overflow-y-auto overflow-x-clip overscroll-contain" +
              (i === idx && smjer !== 0 ? (smjer > 0 ? " prijelaz-desno" : " prijelaz-lijevo") : "")
            }
            data-tab={p.id}
            aria-hidden={i !== idx}
            {...(!sve && i !== idx ? { inert: true } : {})}
          >
            {mounted.has(i) ? p.node : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export const PAGER_PANES = TABOVI;
