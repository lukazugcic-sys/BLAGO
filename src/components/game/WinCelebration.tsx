import { useEffect, useState } from "react";
import { useSlotStore } from "@/lib/stores/slotStore";
import { natpisRazina } from "@/lib/game/slotPrikaz";
import { cn } from "@/lib/utils";

/**
 * Presentational win banner. Credits are applied elsewhere (naplatiDobitak);
 * this only shows a tiered western casino flash and a count-up of the already
 * credited gold. Reduced-motion: static final number, no animation.
 */
export function WinCelebration() {
  const tip = useSlotStore((s) => s.winCelebration);
  const celebrationKey = useSlotStore((s) => s.celebrationKey);
  const setWinCelebration = useSlotStore((s) => s.setWinCelebration);
  const prikaz = useSlotStore((s) => s.prikazDobitka);
  const setPrikazDobitka = useSlotStore((s) => s.setPrikazDobitka);
  const [broj, setBroj] = useState(0);

  useEffect(() => {
    if (!tip && !prikaz) return;
    const ms = tip === "jackpot" ? 1100 : tip === "skull" ? 700 : prikaz?.razina === "mega" ? 1000 : prikaz?.razina === "veliki" ? 800 : 650;
    const t = window.setTimeout(() => {
      setWinCelebration(null);
      setPrikazDobitka(null);
    }, ms);
    return () => window.clearTimeout(t);
  }, [celebrationKey, tip, prikaz?.key, setWinCelebration, setPrikazDobitka]);

  useEffect(() => {
    if (!prikaz) {
      setBroj(0);
      return;
    }
    const cilj = Math.floor(prikaz.zlato);
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || cilj <= 0) {
      setBroj(cilj);
      return;
    }
    setBroj(0);
    const start = performance.now();
    const trajanje = prikaz.razina === "mega" ? 700 : prikaz.razina === "veliki" ? 520 : 360;
    let raf = 0;
    const korak = (sad: number) => {
      const t = Math.min(1, (sad - start) / trajanje);
      const ease = 1 - (1 - t) * (1 - t);
      setBroj(Math.round(cilj * ease));
      if (t < 1) raf = requestAnimationFrame(korak);
    };
    raf = requestAnimationFrame(korak);
    return () => cancelAnimationFrame(raf);
  }, [prikaz?.key]);

  if (tip === "skull") {
    return (
      <p key={celebrationKey} className="fx-natpis fx-natpis-opasnost" role="status">
        OPASNOST
      </p>
    );
  }

  if (!prikaz && tip !== "jackpot") return null;

  const razina = tip === "jackpot" ? "mega" : prikaz?.razina ?? "mali";
  const natpis = tip === "jackpot" ? "JACKPOT" : natpisRazina(razina);

  return (
    <div
      key={prikaz?.key ?? celebrationKey}
      className={cn("slot-pobjeda", `is-${razina}`, tip === "jackpot" && "is-jackpot")}
      role="status"
      aria-live="polite"
    >
      <span className="slot-pobjeda-sjaj" aria-hidden />
      <span className="slot-pobjeda-natpis">{natpis}</span>
      {prikaz && prikaz.zlato > 0 && (
        <span className="slot-pobjeda-broj">+{broj.toLocaleString("hr-HR")} zlata</span>
      )}
      <span className="slot-pobjeda-kovanice" aria-hidden>
        {Array.from({ length: razina === "mega" ? 7 : razina === "veliki" ? 5 : 3 }, (_, i) => (
          <i key={i} style={{ ["--i" as string]: i }} />
        ))}
      </span>
    </div>
  );
}
