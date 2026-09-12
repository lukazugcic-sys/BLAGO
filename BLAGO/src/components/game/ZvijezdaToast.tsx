import { useEffect } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { dostignucePoId } from "@/lib/game/dostignuca";
import { playSfx } from "@/lib/game/audio";
import { SYMBOL_ART } from "@/lib/game/art";
import { IconBadge } from "./IconBadge";
import { NagradaPikseli } from "./NagradaPikseli";

export function ZvijezdaToast() {
  const id = useGameStore((s) => s.novaZvijezda);
  const skloni = useGameStore((s) => s.skloniZvijezdu);
  const d = id ? dostignucePoId(id) : null;
  useEffect(() => {
    if (!id) return;
    playSfx("collect");
    const t = window.setTimeout(() => skloni(), 4200);
    return () => window.clearTimeout(t);
  }, [id, skloni]);
  if (!d) return null;
  return (
    <button
      type="button"
      className="zvijezda-toast"
      onClick={() => {
        playSfx("button");
        skloni();
      }}
    >
      <IconBadge src={SYMBOL_ART[d.art]} size="md" />
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Zvijezda</span>
        <span className="block text-sm font-bold text-ink">{d.naziv}</span>
        <span className="block text-[11px] font-bold text-dim">{d.opis}</span>
      </span>
      <NagradaPikseli nagrada={d.nagrada} />
    </button>
  );
}
