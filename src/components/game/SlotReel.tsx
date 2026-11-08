import { memo, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ghostCol, REEL_FX, PAY_BOJE, PAY_TOCKE_RED, payIdx, simbolSkoro } from "@/lib/game/slotFx";
import { useSlotStore } from "@/lib/stores/slotStore";
import { SlotSymbol } from "./SlotSymbol";
import { cn } from "@/lib/utils";
import type { SimbolId } from "@/lib/game/types";
import { HOLD_UI_MS, HOLD_PX, holdDosta, smanjenPokret } from "@/lib/game/feel";
import { SlotPlatno } from "./SlotPlatno";

/** Full-window loop duration — later columns lag so the drum staggers. */
const REEL_SPD = [0, 1, 2, 3, 4].map((c) => `${(0.24 + c * 0.055).toFixed(3)}s`);

function PayTicks({ active }: { active: Set<number> }) {
  return (
    <div className="pay-tocke" data-testid="pay-tocke" aria-hidden>
      {PAY_TOCKE_RED.map((idx) => (
        <span
          key={idx}
          className={cn("pay-tocka", active.has(idx) && "is-on")}
          style={{ color: PAY_BOJE[idx], borderColor: PAY_BOJE[idx] }}
        >
          {idx + 1}
        </span>
      ))}
    </div>
  );
}

function ReelCol({
  col,
  spinning,
  ids,
  winAt,
  expandAt,
  dim,
  onHold,
}: {
  col: number;
  spinning: boolean;
  ids: [SimbolId, SimbolId, SimbolId];
  winAt: boolean[];
  expandAt: boolean[];
  dim: boolean[];
  onHold?: (id: SimbolId, x: number, y: number) => void;
}) {
  const was = useRef(spinning);
  const [land, setLand] = useState(false);
  const [skoro, setSkoro] = useState(false);
  const [landMs, setLandMs] = useState(320);
  const ghosts = useMemo(() => ghostCol(col), [col]);
  const strip: SimbolId[] = spinning ? [...ghosts, ...ghosts] : ids;
  const hold = useRef<{ i: number; x: number; y: number; timer: number; opened: boolean; start: number } | null>(null);
  const [drzi, setDrzi] = useState<number | null>(null);

  useEffect(() => {
    if (smanjenPokret()) {
      was.current = spinning;
      setLand(false);
      setSkoro(false);
      return;
    }
    if (was.current && !spinning) {
      const turbo = useSlotStore.getState().turboRezim;
      const blizu = !turbo && col === 4 && !!simbolSkoro(useSlotStore.getState().simboli);
      const ms = turbo ? 150 : blizu ? 420 : 320;
      setLandMs(ms);
      setSkoro(blizu);
      setLand(true);
      was.current = false;
      const t = window.setTimeout(() => {
        setLand(false);
        setSkoro(false);
      }, ms + 20);
      return () => window.clearTimeout(t);
    }
    if (spinning) {
      setLand(false);
      setSkoro(false);
    }
    was.current = spinning;
  }, [spinning, col]);

  return (
    <div
      className={cn("reel-col", spinning && "is-spin", land && !spinning && "is-land", land && skoro && "is-skoro")}
      data-col={col}
      data-fx={spinning ? "spin" : land ? "land" : "idle"}
      style={{
        ...(spinning ? { ["--reel-spd" as string]: REEL_SPD[col] } : {}),
        ...(land && !spinning ? { ["--land" as string]: `${landMs}ms` } : {}),
      }}
    >
      <div className="reel-sizer" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="reel-window">
        <div className="reel-strip">
          {strip.map((id, i) => {
            const vis = !spinning && !land && i < 3;
            return (
              <div
                key={`${spinning ? "g" : "r"}-${i}`}
                className={cn("reel-cell", vis && dim[i] && "is-dim", vis && drzi === i && "chip-drzi")}
                style={vis && expandAt[i] ? { ["--expand-d" as string]: `${i * 70}ms` } : undefined}
                onPointerDown={
                  vis && onHold
                    ? (e: PointerEvent<HTMLDivElement>) => {
                        if (hold.current?.timer) window.clearTimeout(hold.current.timer);
                        setDrzi(i);
                        hold.current = {
                          i,
                          x: e.clientX,
                          y: e.clientY,
                          opened: false,
                          start: Date.now(),
                          timer: window.setTimeout(() => {
                            const h = hold.current;
                            if (!h || h.i !== i) return;
                            h.opened = true;
                            setDrzi(null);
                            onHold(id, h.x, h.y);
                          }, HOLD_UI_MS),
                        };
                      }
                    : undefined
                }
                onPointerMove={
                  vis && onHold
                    ? (e: PointerEvent<HTMLDivElement>) => {
                        const h = hold.current;
                        if (!h || h.opened || h.i !== i) return;
                        if (Math.hypot(e.clientX - h.x, e.clientY - h.y) > HOLD_PX) {
                          window.clearTimeout(h.timer);
                          hold.current = null;
                          setDrzi(null);
                        }
                      }
                    : undefined
                }
                onPointerUp={
                  vis && onHold
                    ? () => {
                        const h = hold.current;
                        if (!h || h.i !== i) return;
                        window.clearTimeout(h.timer);
                        if ((h.opened || holdDosta(h.start, HOLD_UI_MS)) && !h.opened) onHold(id, h.x, h.y);
                        hold.current = null;
                        setDrzi(null);
                      }
                    : undefined
                }
                onPointerCancel={
                  vis && onHold
                    ? () => {
                        const h = hold.current;
                        if (h?.timer) window.clearTimeout(h.timer);
                        hold.current = null;
                        setDrzi(null);
                      }
                    : undefined
                }
              >
                <SlotSymbol
                  id={id}
                  win={vis && winAt[i] && id !== "skull"}
                  skullHit={vis && winAt[i] && id === "skull"}
                  spinning={false}
                  expanding={vis && expandAt[i]}
                />
                {vis && winAt[i] && id !== "skull" && (
                  <>
                    <span className="slot-spark" aria-hidden />
                    <span className="slot-spark slot-spark-delay" aria-hidden />
                  </>
                )}
                {vis && winAt[i] && id === "skull" && <span className="slot-ember" aria-hidden />}
              </div>
            );
          })}
        </div>
      </div>
      {REEL_FX.map((fx) => (
        <span key={fx} className={`reel-fx reel-fx-${fx}`} aria-hidden />
      ))}
    </div>
  );
}

const ReelColMemo = memo(ReelCol);

export const SlotReel = memo(function SlotReel({
  onHoldSimbol,
}: {
  onHoldSimbol?: (id: SimbolId, x: number, y: number) => void;
}) {
  const simboli = useSlotStore((s) => s.simboli);
  const [glSpreman, setGlSpreman] = useState(false);
  const [glPokret, setGlPokret] = useState(false);
  const dobitnaPolja = useSlotStore((s) => s.dobitnaPolja);
  const expandPolja = useSlotStore((s) => s.expandPolja);
  const dobitneLinije = useSlotStore((s) => s.dobitneLinije);
  const spinningCols = useSlotStore((s) => s.spinningCols);
  const vrti = spinningCols.some(Boolean);
  const biloVrti = useRef(false);
  const [najava, setNajava] = useState(false);
  useEffect(() => {
    if (vrti && !biloVrti.current) {
      setNajava(true);
      biloVrti.current = true;
      const t = window.setTimeout(() => setNajava(false), 200);
      return () => window.clearTimeout(t);
    }
    if (!vrti) biloVrti.current = false;
  }, [vrti]);
  const winCelebration = useSlotStore((s) => s.winCelebration);
  const winSet = useMemo(() => new Set(dobitnaPolja), [dobitnaPolja]);
  const expandSet = useMemo(() => new Set(expandPolja), [expandPolja]);
  const hasWinAnywhere = winSet.size > 0;
  const skullHit =
    winCelebration === "skull" || (hasWinAnywhere && simboli[dobitnaPolja[0]!] === "skull");
  const aktivne = useMemo(() => {
    const s = new Set<number>();
    for (const line of dobitneLinije) {
      const i = payIdx(line);
      if (i >= 0) s.add(i);
    }
    return s;
  }, [dobitneLinije]);

  return (
    <div
      className={cn(
        "slot-reel-stol relative",
        najava && "is-najava",
        winCelebration === "jackpot" && "reel-jackpot",
        skullHit && "reel-skull",
        winCelebration === "win" && "reel-win",
      )}
      style={{ display: "grid", gridTemplateColumns: "1.35rem minmax(0, 1fr) 1.35rem" }}
    >
      <PayTicks active={aktivne} />
      <div className="slot-reel-mreza">
        <div className={cn("slot-reel-stupovi", glSpreman && glPokret && "is-gl")}>
          <SlotPlatno onSpreman={setGlSpreman} onPokret={setGlPokret} />
          {[0, 1, 2, 3, 4].map((col) => {
            const ids: [SimbolId, SimbolId, SimbolId] = [
              simboli[col] ?? "gold",
              simboli[col + 5] ?? "gold",
              simboli[col + 10] ?? "gold",
            ];
            const idxs = [col, col + 5, col + 10];
            return (
              <ReelColMemo
                key={col}
                col={col}
                spinning={!!spinningCols[col]}
                ids={ids}
                winAt={idxs.map((i) => winSet.has(i))}
                expandAt={idxs.map((i) => expandSet.has(i))}
                dim={idxs.map((i) => !winSet.has(i) && !expandSet.has(i) && hasWinAnywhere)}
                onHold={spinningCols[col] ? undefined : onHoldSimbol}
              />
            );
          })}
          {dobitneLinije.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible"
              viewBox="0 0 5 3"
              preserveAspectRatio="none"
              aria-hidden
            >
              {dobitneLinije.map((line, i) => {
                const idx = payIdx(line);
                const boja = idx >= 0 ? PAY_BOJE[idx] : "#e8b04a";
                const points = line
                  .map((cell) => {
                    const col = cell % 5;
                    const row = Math.floor(cell / 5);
                    return `${col + 0.5},${row + 0.5}`;
                  })
                  .join(" ");
                return (
                  <polyline
                    key={i}
                    className="payline-draw"
                    fill="none"
                    stroke={boja}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    points={points}
                  />
                );
              })}
            </svg>
          )}
        </div>

        {skullHit && <div className="skull-cracks pointer-events-none absolute inset-0 z-[3]" aria-hidden />}
      </div>
      <PayTicks active={aktivne} />
    </div>
  );
});
