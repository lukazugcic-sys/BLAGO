import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { APP_VERSION, APP_CHANNEL } from "@/lib/game/version";
import { CREDITS, ART } from "@/lib/game/art";
import { SAVE_KEYS } from "@/lib/game/persist";
import { playSfx } from "@/lib/game/audio";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { useState } from "react";

const ALATI: Array<{
  id: "zlato" | "energija" | "dijamanti" | "resursi" | "stitovi" | "popravi";
  n: string;
}> = [
  { id: "zlato", n: "+5 000 zlata" },
  { id: "energija", n: "Puna energija" },
  { id: "dijamanti", n: "+50 dijamant" },
  { id: "resursi", n: "+drvo kamen željezo" },
  { id: "stitovi", n: "Puni štitovi" },
  { id: "popravi", n: "Popravi zgrade" },
];

export function BetaSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [potvrda, setPotvrda] = useState(false);
  const [autoRez, setAutoRez] = useState<string | null>(null);
  const testAlat = useGameStore((s) => s.testAlat);
  const autoTest = useGameStore((s) => s.autoTest);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
  if (!open || typeof document === "undefined") return null;

  const reset = () => {
    if (!potvrda) {
      setPotvrda(true);
      return;
    }
    for (const key of Object.values(SAVE_KEYS)) {
      window.localStorage.removeItem(key);
    }
    window.location.reload();
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-void/75 p-4 sm:items-center">
      <div className="max-h-[min(40rem,90dvh)] w-full max-w-sm overflow-y-auto rounded-3xl border border-line bg-panel">
        <div className="relative h-20 overflow-hidden">
          <img src={ART.oblaci} alt="" className="size-full object-cover" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
        </div>
        <div className="p-5 pt-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase">
            {APP_CHANNEL} {APP_VERSION}
          </p>
          <button
            type="button"
            onClick={() => {
              setPotvrda(false);
              onClose();
            }}
            className="flex size-8 items-center justify-center rounded-full border border-line text-dim"
            aria-label="Zatvori"
          >
            <X className="size-4" />
          </button>
        </div>
        <h2 className="font-display text-xl text-gold">BLAGO beta</h2>
        <p className="mt-2 text-xs font-bold leading-relaxed text-ink/75">
          Spremanje je na ovom uređaju. Družina radi u istoj sobi. Reci što ne valja
          — ovo je testna verzija.
        </p>

        <h3 className="mt-5 text-[10px] font-bold tracking-[0.22em] text-gold uppercase">
          Alati za testiranje
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ALATI.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                playSfx("button");
                testAlat(a.id);
              }}
              className="min-h-11 rounded-xl border border-line bg-panel-2 px-2 text-[11px] font-bold text-ink"
            >
              {a.n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              playSfx("button");
              onClose();
              setRaidAktivan(true);
            }}
            className="min-h-11 rounded-xl border border-ruby/50 bg-ruby/15 px-2 text-[11px] font-bold text-ruby"
          >
            Pokreni pohod
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            playSfx("button");
            const r = autoTest();
            setAutoRez(`${r.ok}/${r.ukupno}`);
          }}
          className="mt-2 min-h-11 w-full rounded-xl border border-gold/50 bg-gold/15 text-xs font-bold tracking-widest text-gold uppercase"
        >
          {autoRez ? `Auto-test ${autoRez}` : "Pokreni auto-test"}
        </button>

        <p className="mt-3 text-[10px] font-bold leading-relaxed tracking-wide text-dim">{CREDITS}</p>
        <button
          type="button"
          onClick={() => {
            playSfx("button");
            reset();
          }}
          className="mt-4 min-h-11 w-full rounded-full border border-ruby/50 bg-ruby/15 text-xs font-bold tracking-widest text-ruby uppercase"
        >
          {potvrda ? "Stvarno obriši spremanje" : "Obriši spremanje"}
        </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}