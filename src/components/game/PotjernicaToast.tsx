import { useEffect } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { potjernicaPoId, RIJETKOST_REC } from "@/lib/game/potjernice";
import { playSfx } from "@/lib/game/audio";

export function PotjernicaToast() {
  const id = useGameStore((s) => s.novaPotjernica);
  const album = useGameStore((s) => s.potjernice);
  const skloni = useGameStore((s) => s.skloniPotjernicu);
  const p = id ? potjernicaPoId(id) : null;
  useEffect(() => {
    if (!id) return;
    const t = window.setTimeout(() => skloni(), 5200);
    return () => window.clearTimeout(t);
  }, [id, skloni]);
  if (!p) return null;
  const n = album[p.id] ?? 1;

  return (
    <button
      type="button"
      className="potjernica-toast"
      onClick={() => {
        playSfx("button");
        skloni();
      }}
    >
      <span className="potjernica-list" style={{ background: p.boja }}>
        <span className="potjernica-stem">TRAŽI SE</span>
        <span className="potjernica-ime">{p.ime}</span>
        <span className="potjernica-cijena">${p.cijena}</span>
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[10px] font-bold tracking-[0.2em] text-gold uppercase">
          {n > 1 ? "Duplikat" : "Nova potjernica"} · {RIJETKOST_REC[p.rijetkost]}
        </span>
        <span className="block text-sm font-bold text-ink">{p.ime}</span>
        <span className="block text-[11px] font-bold text-dim">{p.rec}</span>
      </span>
    </button>
  );
}