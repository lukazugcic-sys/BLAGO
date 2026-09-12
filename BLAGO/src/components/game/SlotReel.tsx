import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BLAGO } from "@/lib/game/constants";
import { useSlotStore } from "@/lib/stores/slotStore";
import { SlotSymbol } from "./SlotSymbol";
import { cn } from "@/lib/utils";

/** Per-column spin period — later columns slightly slower for stagger feel. */
const REEL_SPD = [0, 1, 2, 3, 4].map((c) => `${(0.095 + c * 0.012).toFixed(3)}s`);

function cellPt(idx: number) {
  const col = idx % 5;
  const row = Math.floor(idx / 5);
  return `${(col + 0.5) * 20},${(row + 0.5) * 20}`;
}

function ReelCol({
  col,
  spinning,
  compact,
  children,
}: {
  col: number;
  spinning: boolean;
  compact?: boolean;
  children: ReactNode;
}) {
  const was = useRef(spinning);
  const [land, setLand] = useState(false);

  useEffect(() => {
    if (was.current && !spinning) {
      setLand(true);
      const t = window.setTimeout(() => setLand(false), 480);
      was.current = spinning;
      return () => window.clearTimeout(t);
    }
    was.current = spinning;
  }, [spinning]);

  return (
    <div
      className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5 sm:gap-2", land && "reel-land")}
      data-col={col}
      style={spinning ? { ["--reel-spd" as string]: REEL_SPD[col] } : undefined}
    >
      {children}
    </div>
  );
}

const ReelColMemo = memo(ReelCol);

export const SlotReel = memo(function SlotReel({ compact = false }: { compact?: boolean }) {
  const simboli = useSlotStore((s) => s.simboli);
  const dobitnaPolja = useSlotStore((s) => s.dobitnaPolja);
  const expandPolja = useSlotStore((s) => s.expandPolja);
  const dobitneLinije = useSlotStore((s) => s.dobitneLinije);
  const spinningCols = useSlotStore((s) => s.spinningCols);
  const winCelebration = useSlotStore((s) => s.winCelebration);
  // Primitive only — avoid re-rendering the reel on unrelated dobitak field churn
  const winZlato = useSlotStore((s) =>
    s.winCelebration && s.dobitakNaCekanju && s.dobitakNaCekanju.zlato > 0
      ? s.dobitakNaCekanju.zlato
      : 0,
  );
  const winSet = useMemo(() => new Set(dobitnaPolja), [dobitnaPolja]);
  const expandSet = useMemo(() => new Set(expandPolja), [expandPolja]);
  const hasWinAnywhere = winSet.size > 0;
  const skullHit =
    winCelebration === "skull" || (hasWinAnywhere && simboli[dobitnaPolja[0]!] === "skull");

  return (
    <div
      className={cn(
        "relative",
        winCelebration === "jackpot" && "reel-jackpot",
        skullHit && "reel-skull",
        winCelebration === "win" && "reel-win",
      )}
    >
      <div className={cn("grid grid-cols-5", compact ? "gap-1" : "gap-1.5 sm:gap-2")}>
        {[0, 1, 2, 3, 4].map((col) => (
          <ReelColMemo key={col} col={col} spinning={!!spinningCols[col]} compact={compact}>
            {[0, 1, 2].map((row) => {
              const idx = row * 5 + col;
              const simbolId = simboli[idx] ?? "gold";
              const isWin = winSet.has(idx);
              const isExpand = expandSet.has(idx);
              const isSkullCell = isWin && simbolId === "skull";
              const dim = !isWin && !isExpand && hasWinAnywhere;
              return (
                <div
                  key={idx}
                  className={cn("relative", dim && "opacity-30")}
                  title={BLAGO[simbolId].tip}
                  style={isExpand ? { ["--expand-d" as string]: `${row * 70}ms` } : undefined}
                >
                  <SlotSymbol
                    id={simbolId}
                    win={isWin && !isSkullCell}
                    skullHit={isSkullCell}
                    spinning={!!spinningCols[col]}
                    expanding={isExpand}
                  />
                  {isWin && !isSkullCell && (
                    <>
                      <span className="slot-spark" aria-hidden />
                      <span className="slot-spark slot-spark-delay" aria-hidden />
                    </>
                  )}
                  {isSkullCell && <span className="slot-ember" aria-hidden />}
                </div>
              );
            })}
          </ReelColMemo>
        ))}
      </div>

      {dobitneLinije.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible"
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          aria-hidden
        >
          {dobitneLinije.map((line, i) => (
            <polyline
              key={i}
              className="payline-draw"
              fill="none"
              stroke="url(#paylineGold)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={line.map(cellPt).join(" ")}
            />
          ))}
          <defs>
            <linearGradient id="paylineGold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff4c8" />
              <stop offset="45%" stopColor="#e8b04a" />
              <stop offset="100%" stopColor="#fff4c8" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {skullHit && <div className="skull-cracks pointer-events-none absolute inset-0 z-[3]" aria-hidden />}

      {winZlato > 0 && (
        <div className="win-float-gold pointer-events-none absolute inset-x-0 top-[42%] z-[4] text-center font-display text-3xl tracking-widest text-gold">
          +{winZlato}
        </div>
      )}
    </div>
  );
});
