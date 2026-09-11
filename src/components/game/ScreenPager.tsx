import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { TABOVI, type TabId } from "@/lib/game/constants";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

type Pane = { id: TabId; node: ReactNode };

export function ScreenPager({
  tab,
  onTab,
  panes,
}: {
  tab: TabId;
  onTab: (id: TabId) => void;
  panes: Pane[];
}) {
  const idx = Math.max(0, panes.findIndex((p) => p.id === tab));
  const wrapRef = useRef<HTMLDivElement>(null);
  const dxRef = useRef(0);
  const axisRef = useRef<null | "h" | "v">(null);
  const dragRef = useRef(false);
  const originRef = useRef({ x: 0, y: 0, t: 0 });
  const idxRef = useRef(idx);
  const wRef = useRef(0);
  const [w, setW] = useState(0);
  const [dx, setDx] = useState(0);
  const [anim, setAnim] = useState(true);
  const skipClick = useRef(false);
  const [mounted, setMounted] = useState(() => new Set<number>([0, 1, 2, 3]));

  idxRef.current = idx;
  const n = panes.length;

  const keepAround = (center: number, extra?: number) => {
    const next = new Set<number>([center]);
    if (center > 0) next.add(center - 1);
    if (center < n - 1) next.add(center + 1);
    if (extra !== undefined) next.add(extra);
    return next;
  };

  useEffect(() => {
    setMounted((prev) => {
      const next = keepAround(idx);
      prev.forEach((i) => next.add(i));
      return next;
    });
    // Keep neighbors mounted so swipe/scroll does not remount heavy panes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, n]);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const next = el.clientWidth;
      wRef.current = next;
      setW(next);
    });
    ro.observe(el);
    wRef.current = el.clientWidth;
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const commit = useCallback(
    (nextIdx: number) => {
      const clamped = Math.max(0, Math.min(panes.length - 1, nextIdx));
      dxRef.current = 0;
      setDx(0);
      setAnim(true);
      if (clamped !== idxRef.current) {
        playSfx("button");
        onTab(panes[clamped]!.id);
      }
    },
    [onTab, panes],
  );

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest("[data-lock-pan]")) return;
    dragRef.current = true;
    axisRef.current = null;
    skipClick.current = false;
    originRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    setMounted(keepAround(idxRef.current));
    setAnim(false);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const mx = e.clientX - originRef.current.x;
    const my = e.clientY - originRef.current.y;
    if (!axisRef.current) {
      if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
      axisRef.current = Math.abs(mx) > Math.abs(my) * 1.2 ? "h" : "v";
      if (axisRef.current === "h") {
        wrapRef.current?.setPointerCapture(e.pointerId);
        skipClick.current = true;
      } else {
        dragRef.current = false;
        setAnim(true);
        setDx(0);
        dxRef.current = 0;
        return;
      }
    }
    if (axisRef.current !== "h") return;
    const last = panes.length - 1;
    let next = mx;
    if ((idxRef.current === 0 && next > 0) || (idxRef.current === last && next < 0)) {
      next *= 0.28;
    }
    dxRef.current = next;
    setDx(next);
  };

  const onUp = () => {
    if (!dragRef.current && axisRef.current !== "h") {
      axisRef.current = null;
      return;
    }
    dragRef.current = false;
    const wasH = axisRef.current === "h";
    axisRef.current = null;
    if (!wasH) {
      setAnim(true);
      dxRef.current = 0;
      setDx(0);
      return;
    }
    const width = wRef.current || 1;
    const offset = dxRef.current;
    const dt = Math.max(24, performance.now() - originRef.current.t);
    const velocity = offset / dt;
    const threshold = width * 0.16;
    if (offset < -threshold || velocity < -0.45) commit(idxRef.current + 1);
    else if (offset > threshold || velocity > 0.45) commit(idxRef.current - 1);
    else {
      setAnim(true);
      dxRef.current = 0;
      setDx(0);
    }
    window.setTimeout(() => {
      skipClick.current = false;
    }, 90);
  };

  const tx = w ? -idx * w + dx : 0;

  return (
    <div
      ref={wrapRef}
      className="relative z-0 min-h-0 flex-1 overflow-hidden touch-pan-y"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onClickCapture={(e) => {
        if (skipClick.current) {
          e.preventDefault();
          e.stopPropagation();
          skipClick.current = false;
        }
      }}
    >
      <div
        className={cn("flex h-full", anim && "pager-track", (!anim || dx !== 0) && "will-change-transform")}
        style={{
          width: w ? w * n : `${n * 100}%`,
          transform: w
            ? `translate3d(${tx}px, 0, 0)`
            : `translate3d(-${idx * (100 / Math.max(1, n))}%, 0, 0)`,
          transition: anim ? undefined : "none",
        }}
      >
        {panes.map((p, i) => (
          <div
            key={p.id}
            className="h-full shrink-0 overflow-y-auto overflow-x-hidden overscroll-contain"
            style={{ width: w || `${100 / Math.max(1, n)}%` }}
            aria-hidden={i !== idx}
            {...(i !== idx ? { inert: true } : {})}
          >
            {mounted.has(i) ? p.node : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export const PAGER_PANES = TABOVI;
