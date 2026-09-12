import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";

const KONFETI = [
  { dx: "-48px", dy: "-36px", c: "#ffd24a" },
  { dx: "52px", dy: "-28px", c: "#8cff5a" },
  { dx: "-18px", dy: "-52px", c: "#ff6b73" },
  { dx: "22px", dy: "-46px", c: "#5ec8ff" },
  { dx: "-62px", dy: "-12px", c: "#ffbf3a" },
  { dx: "64px", dy: "-8px", c: "#ff5ab4" },
];

export function LevelUpToast() {
  const levelUpData = useGameStore((s) => s.levelUpData);
  const clearLevelUp = useGameStore((s) => s.clearLevelUp);
  const [podaci, setPodaci] = useState<{ razina: number; skok?: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!levelUpData) {
      setVisible(false);
      setPodaci(null);
      return;
    }
    setPodaci(levelUpData);
    setVisible(true);
    const t = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(clearLevelUp, 280);
    }, 2500);
    return () => window.clearTimeout(t);
  }, [levelUpData, clearLevelUp]);

  if (!podaci && !visible) return null;
  const skok = podaci?.skok ?? 1;

  return (
    <div
      className="level-toast pointer-events-none relative z-50 overflow-hidden rounded-xl border border-xp/70 bg-panel px-4 py-3 text-center shadow-[0_8px_28px_color-mix(in_oklab,var(--color-xp)_40%,transparent)] transition-[opacity,transform] duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.92)",
      }}
    >
      <span className="level-zrake" aria-hidden />
      {visible &&
        KONFETI.map((k, i) => (
          <span
            key={i}
            className="level-konfeti"
            style={{
              background: k.c,
              ["--dx" as string]: k.dx,
              ["--dy" as string]: k.dy,
              animationDelay: `${i * 40}ms`,
            }}
          />
        ))}
      <p className="relative font-display text-xl tracking-widest text-xp">
        {skok > 1 ? "NOVE RAZINE" : "NOVA RAZINA"}
      </p>
      <p className="relative mt-0.5 text-sm font-bold text-ink">Razina {podaci?.razina}</p>
      <p className="relative mt-1 text-xs font-semibold text-gem">
        +{5 * skok} dijamanta · energija napunjena
      </p>
    </div>
  );
}
