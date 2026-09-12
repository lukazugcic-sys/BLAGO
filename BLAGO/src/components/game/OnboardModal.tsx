import { useState } from "react";
import { createPortal } from "react-dom";
import { Dices, Home, Radio } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { SAVE_KEYS, saveJSON } from "@/lib/game/persist";
import { playSfx } from "@/lib/game/audio";
import { APP_VERSION } from "@/lib/game/version";
import { ART } from "@/lib/game/art";

const KORACI = [
  {
    naslov: "Tvoje ime",
    tekst: "Kako te zovu?",
  },
  {
    naslov: "Tri pravila",
    tekst: "Vrti. Gradi kaubu. Zovi družinu kodom sobe.",
  },
] as const;

export function OnboardModal({
  open,
  onDone,
}: {
  open: boolean;
  onDone: () => void;
}) {
  const ime = useGameStore((s) => s.imeIgraca);
  const postaviIme = useGameStore((s) => s.postaviIme);
  const [korak, setKorak] = useState(0);
  const [imeTxt, setImeTxt] = useState(
    ime === "Igrač" || ime === "Astro-kauboj" || ime === "Kauboj" ? "" : ime,
  );

  if (!open || typeof document === "undefined") return null;

  const zavrsi = () => {
    const n = imeTxt.trim().slice(0, 16) || "Kauboj";
    postaviIme(n);
    saveJSON(SAVE_KEYS.onboard, { v: APP_VERSION, t: Date.now() });
    playSfx("collect");
    onDone();
  };

  return createPortal(
    <div className="modal-pozadina fixed inset-0 z-[90] flex items-end justify-center bg-void/80 p-4 sm:items-center">
      <div className="modal-ulaz w-full max-w-sm overflow-hidden rounded-3xl border border-gold/40 bg-panel shadow-[0_20px_50px_rgb(0_0_0_/_0.55)]">
        <div className="relative h-28 overflow-hidden">
          <img src={ART.kauba} alt="" className="size-full object-cover object-[center_35%]" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
        </div>
        <div className="p-5 pt-3">
        <p className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase">Beta · {APP_VERSION}</p>
        {korak === 0 ? (
          <>
            <h2 className="mt-2 font-display text-2xl text-gold">{KORACI[0].naslov}</h2>
            <p className="mt-1 text-sm font-bold text-ink/80">{KORACI[0].tekst}</p>
            <input
              autoFocus
              value={imeTxt}
              maxLength={16}
              placeholder="npr. Šerif"
              onChange={(e) => setImeTxt(e.target.value)}
              className="mt-4 w-full rounded-xl border border-line bg-void/70 px-3 py-3 text-base font-bold text-ink outline-none focus:border-gold/60"
            />
            <button
              type="button"
              data-testid="onboard-dalje"
              onClick={() => {
                playSfx("button");
                setKorak(1);
              }}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-gold text-sm font-bold tracking-[0.2em] text-void uppercase"
            >
              Dalje
            </button>
          </>
        ) : (
          <>
            <h2 className="mt-2 font-display text-2xl text-gold">{KORACI[1].naslov}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              <li className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-volt/20 text-volt">
                  <Dices className="size-5" />
                </span>
                <span className="text-sm font-bold text-ink">ZAVRTI — energija plaća kolo (×2 = 2); zlato, drvo, kamen</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-wood/20 text-wood">
                  <Home className="size-5" />
                </span>
                <span className="text-sm font-bold text-ink">KAUBA — gradi i čuvaj ostavu</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <Radio className="size-5" />
                </span>
                <span className="text-sm font-bold text-ink">POHOD — ista soba, živi kauboji</span>
              </li>
            </ul>
            <button
              type="button"
              data-testid="onboard-igraj"
              onClick={zavrsi}
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-gold text-sm font-bold tracking-[0.2em] text-void uppercase"
            >
              Igraj
            </button>
          </>
        )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
