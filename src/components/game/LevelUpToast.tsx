import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";

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
      className="pointer-events-none absolute top-3 right-4 left-4 z-50 rounded-xl border border-xp/70 bg-panel px-4 py-3 text-center shadow-[0_8px_28px_color-mix(in_oklab,var(--color-xp)_40%,transparent)] transition-[opacity,transform] duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-140px)",
      }}
    >
      <p className="font-display text-xl tracking-widest text-xp">
        {skok > 1 ? "NOVE RAZINE" : "NOVA RAZINA"}
      </p>
      <p className="mt-0.5 text-sm font-bold text-ink">Razina {podaci?.razina}</p>
      <p className="mt-1 text-xs font-semibold text-gem">
        +{5 * skok} dijamanta · energija napunjena
      </p>
    </div>
  );
}
