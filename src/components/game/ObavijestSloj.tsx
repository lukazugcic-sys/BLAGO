import { useSlotStore } from "@/lib/stores/slotStore";
import { LevelUpToast } from "./LevelUpToast";
import { ZvijezdaToast } from "./ZvijezdaToast";
import { PohodPozivToast } from "./PohodPozivToast";

export function jeSerifovaPoruka(p: string) {
  return /NAPAD|KATASTROFA|OŠTEĆENA|POHOD|GORI|plakat|TRAŽI SE|juriša|opljačkao|otjerao/i.test(p);
}

export function ObavijestSloj() {
  const knjigaFaza = useSlotStore((s) => s.knjigaFaza);
  if (knjigaFaza === "uvod" || knjigaFaza === "igra" || knjigaFaza === "kraj") return null;

  return (
    <div className="obavijest-sloj" aria-live="polite">
      <PohodPozivToast />
      <ZvijezdaToast />
      <LevelUpToast />
    </div>
  );
}
