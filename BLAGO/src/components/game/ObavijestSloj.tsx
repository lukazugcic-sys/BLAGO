import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { LevelUpToast } from "./LevelUpToast";
import { PotjernicaToast } from "./PotjernicaToast";
import { ZvijezdaToast } from "./ZvijezdaToast";
import { PohodPozivToast } from "./PohodPozivToast";
import { LiveTicker } from "./LiveTicker";
import { jeSideOtkljucan } from "@/lib/game/sideGate";

export function jeSerifovaPoruka(p: string) {
  return /NAPAD|KATASTROFA|OŠTEĆENA|POHOD|GORI|plakat|TRAŽI SE/i.test(p);
}

export function ObavijestSloj() {
  const poruka = useGameStore((s) => s.poruka);
  const knjigaFaza = useSlotStore((s) => s.knjigaFaza);
  const sideOtkljucan = useGameStore((s) => jeSideOtkljucan(s.gradevine));
  if (knjigaFaza === "uvod" || knjigaFaza === "igra" || knjigaFaza === "kraj") return null;
  const serifova = poruka && jeSerifovaPoruka(poruka);

  return (
    <div className="obavijest-sloj" aria-live="polite">
      {serifova ? <p className="obavijest-rec obavijest-rec-alarm">{poruka}</p> : null}
      {sideOtkljucan && <LiveTicker />}
      {sideOtkljucan && <PotjernicaToast />}
      {sideOtkljucan && <PohodPozivToast />}
      <ZvijezdaToast />
      <LevelUpToast />
    </div>
  );
}
