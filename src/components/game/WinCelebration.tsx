import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSlotStore, type SlotFx } from "@/lib/stores/slotStore";
import { SYMBOL_ART, ART } from "@/lib/game/art";

type Particle = {
  id: number;
  kind: "coin" | "spark" | "ember" | "bone" | "gem";
  dx: number;
  dy: number;
  delay: number;
  size: number;
  rot: number;
  color: string;
};

const HOLD: Record<Exclude<SlotFx, null>, number> = {
  jackpot: 1700,
  skull: 1200,
  win: 780,
};
const FADE: Record<Exclude<SlotFx, null>, number> = {
  jackpot: 420,
  skull: 220,
  win: 220,
};

export function WinCelebration() {
  const tip = useSlotStore((s) => s.winCelebration);
  const celebrationKey = useSlotStore((s) => s.celebrationKey);
  const setWinCelebration = useSlotStore((s) => s.setWinCelebration);
  const [izlaz, setIzlaz] = useState(false);

  useEffect(() => {
    if (!tip) return;
    setIzlaz(false);
    const fade = FADE[tip];
    const hold = HOLD[tip];
    const t1 = window.setTimeout(() => setIzlaz(true), Math.max(0, hold - fade));
    const t2 = window.setTimeout(() => setWinCelebration(null), hold);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [celebrationKey, tip, setWinCelebration]);

  const particles = useMemo<Particle[]>(() => {
    if (!tip) return [];
    const skull = tip === "skull";
    const jack = tip === "jackpot";
    const count = jack ? 9 : skull ? 10 : 7;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const dist = (jack ? 88 : skull ? 70 : 72) + Math.random() * 70;
      const fall = skull ? 40 + Math.random() * 120 : jack ? -16 + Math.random() * 36 : -30;
      const kinds: Particle["kind"][] = skull
        ? i % 3 === 0
          ? ["bone"]
          : ["ember"]
        : jack
          ? i % 4 === 0
            ? ["gem"]
            : i % 2 === 0
              ? ["coin"]
              : ["spark"]
          : i % 2 === 0
            ? ["coin"]
            : ["spark"];
      return {
        id: i,
        kind: kinds[0]!,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist + fall,
        delay: Math.random() * (jack ? 0.32 : 0.2),
        size: jack ? 11 + (i % 14) : skull ? 8 + (i % 11) : 9 + (i % 9),
        rot: Math.random() * 360,
        color: skull
          ? i % 2 === 0
            ? "#e85d5d"
            : "#e89a4a"
          : jack
            ? i % 3 === 0
              ? "#d48cff"
              : "#e8b04a"
            : "#e8b04a",
      };
    });
  }, [celebrationKey, tip]);

  const rain = useMemo(() => {
    if (!tip || tip === "skull") return [];
    const n = tip === "jackpot" ? 4 : 3;
    return Array.from({ length: n }, (_, i) => ({
      id: i,
      left: 6 + ((i * 17) % 88),
      delay: (i % 8) * 0.08,
      dur: 0.9 + (i % 5) * 0.12,
      size: 10 + (i % 7),
    }));
  }, [celebrationKey, tip]);

  if (!tip) return null;

  const label = tip === "jackpot" ? "JACKPOT" : tip === "skull" ? "OPASNOST" : "DOBITAK";
  const sub =
    tip === "jackpot" ? "pet u nizu" : tip === "skull" ? "lubanje u rešetki" : "linija pogađa";

  return (
    <div
      key={celebrationKey}
      className={
        tip === "jackpot"
          ? izlaz
            ? "fx-wrap fx-wrap-jackpot izlaz pointer-events-none absolute inset-0 z-40 overflow-hidden"
            : "fx-wrap fx-wrap-jackpot pointer-events-none absolute inset-0 z-40 overflow-hidden"
          : "pointer-events-none absolute inset-0 z-40 overflow-hidden"
      }
    >
      {tip === "jackpot" && (
        <video
          className="absolute inset-0 size-full object-cover opacity-[0.22] mix-blend-screen"
          autoPlay
          muted
          playsInline
          aria-hidden
        >
          <source src={ART.duga} type="video/mp4" />
        </video>
      )}
      {tip === "jackpot" && <div className="jackpot-rays" aria-hidden />}
      {tip === "jackpot" && <div className="jackpot-halo" aria-hidden />}
      {tip === "jackpot" && <div className="jackpot-halo jackpot-halo-delay" aria-hidden />}
      {tip === "win" && <div className="win-burst-ring" aria-hidden />}
      {tip === "win" && <div className="win-burst-ring win-burst-delay" aria-hidden />}
      {tip === "skull" && <div className="skull-vignette" aria-hidden />}
      {tip === "skull" && <div className="skull-halo" aria-hidden />}
      {tip === "skull" && (
        <img src={SYMBOL_ART.skull} alt="" className="skull-face-fx" draggable={false} />
      )}

      {rain.map((c) => (
        <span
          key={`rain-${celebrationKey}-${c.id}`}
          className="fx-coin fx-coin-rain absolute"
          style={
            {
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              animationDuration: `${c.dur}s`,
              animationDelay: `${c.delay}s`,
            } as CSSProperties
          }
        />
      ))}

      <div className="absolute inset-0 flex items-center justify-center">
        {particles.map((p) => (
          <span
            key={`${celebrationKey}-${p.id}`}
            className={cnKind(p.kind)}
            style={
              {
                width: p.size,
                height: p.size,
                background: p.kind === "spark" || p.kind === "ember" ? p.color : undefined,
                color: p.color,
                ["--dx" as string]: `${p.dx}px`,
                ["--dy" as string]: `${p.dy}px`,
                ["--rot" as string]: `${p.rot}deg`,
                animation: `${p.kind === "ember" ? "ember-rise" : "particle-out"} 0.95s ease-out ${p.delay}s both`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div
        className={
          tip === "skull"
            ? "fx-banner fx-banner-skull"
            : tip === "jackpot"
              ? "fx-banner fx-banner-jackpot"
              : "fx-banner fx-banner-win"
        }
      >
        {label}
        <span className="fx-banner-sub">{sub}</span>
      </div>
    </div>
  );
}

function cnKind(kind: Particle["kind"]) {
  switch (kind) {
    case "coin":
      return "fx-coin absolute";
    case "bone":
      return "fx-bone absolute";
    case "gem":
      return "fx-gem absolute";
    case "ember":
      return "fx-ember absolute";
    default:
      return "fx-spark absolute";
  }
}
