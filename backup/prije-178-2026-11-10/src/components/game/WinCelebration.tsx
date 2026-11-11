import { useEffect } from "react";
import { useSlotStore } from "@/lib/stores/slotStore";

/** Kratki natpis. Bez zatamnjenja, haloa i čestica. Linija i glow ostaju na valjcima. */
export function WinCelebration() {
  const tip = useSlotStore((s) => s.winCelebration);
  const celebrationKey = useSlotStore((s) => s.celebrationKey);
  const setWinCelebration = useSlotStore((s) => s.setWinCelebration);

  useEffect(() => {
    if (!tip) return;
    const ms = tip === "jackpot" ? 900 : tip === "win" ? 600 : 700;
    const t = window.setTimeout(() => setWinCelebration(null), ms);
    return () => window.clearTimeout(t);
  }, [celebrationKey, tip, setWinCelebration]);

  if (!tip || tip === "win") return null;

  return (
    <p key={celebrationKey} className="fx-natpis" role="status">
      {tip === "jackpot" ? "JACKPOT" : "OPASNOST"}
    </p>
  );
}
