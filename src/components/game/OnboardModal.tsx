import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGameStore } from "@/lib/stores/gameStore";
import { SAVE_KEYS, saveJSON } from "@/lib/game/persist";
import { playSfx } from "@/lib/game/audio";
import { APP_VERSION } from "@/lib/game/version";
import { ART } from "@/lib/game/art";
import { portalKorijen } from "@/lib/game/portal";
import { vodicKrajPrice } from "@/lib/game/vodic";
import { imeJePrazno } from "@/lib/game/ime";

const KARTICE = [
  {
    naslov: "Šerif na prašini",
    tekst: "Boro te čeka na praznoj ulici. Kauba još nema krov. Kako će se zvati?",
  },
  {
    naslov: "Nema ni bunara",
    tekst: "Prvo zavrti kolo. Zlato i drvo plaćaju prvu kuću. Pilana već reže.",
  },
  {
    naslov: "Ostani do zore",
    tekst: "Vrti, digni kuću, pokupi drvo, primi nalog. Čeka te dnevna nagrada.",
  },
] as const;

let nacrtImena: string | null = null;

function pocetnoIme(ime: string) {
  if (nacrtImena !== null) return nacrtImena;
  const p = imeJePrazno(ime) ? "" : ime;
  nacrtImena = p;
  return p;
}

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
  const [imeTxt, setImeTxt] = useState(() => pocetnoIme(ime));
  const imePolje = useRef<HTMLInputElement>(null);
  const korakRef = useRef(0);
  korakRef.current = korak;

  useEffect(() => {
    if (!open || korak !== 0) return;
    const id = window.requestAnimationFrame(() => {
      const el = imePolje.current;
      if (!el) return;
      el.focus();
      const n = el.value.length;
      try {
        el.setSelectionRange(n, n);
      } catch {
        /* stariji webview */
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, korak]);

  if (!open || typeof document === "undefined") return null;

  const zavrsi = (preskoci: boolean) => {
    const n = (nacrtImena ?? imeTxt).trim().slice(0, 16);
    if (n) postaviIme(n);
    nacrtImena = null;
    saveJSON(SAVE_KEYS.onboard, { v: APP_VERSION, t: Date.now() });
    playSfx(preskoci ? "button" : "collect");
    vodicKrajPrice();
    onDone();
  };

  const dalje = (e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
    if (korakRef.current >= KARTICE.length - 1) {
      zavrsi(false);
      return;
    }
    playSfx("button");
    setKorak((k) => Math.min(KARTICE.length - 1, k + 1));
  };

  const kartica = KARTICE[korak] ?? KARTICE[0];
  const zadnja = korak >= KARTICE.length - 1;

  return createPortal(
    <div className="g179-preklop fixed inset-0 z-[90] flex items-end justify-center bg-void/80 p-4 sm:items-center" style={{ animation: "none" }}>
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-gold/40 bg-panel shadow-[0_20px_50px_rgb(0_0_0_/_0.55)]" style={{ animation: "none" }}>
        <div className="relative h-28 overflow-hidden">
          <img src={ART.kauba} alt="" className="size-full object-cover object-[center_35%]" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
        </div>
        <div className="p-5 pt-3">
          <p className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase">
            {korak + 1} / {KARTICE.length}
          </p>
          <h2 className="mt-2 font-display text-2xl text-gold">{kartica.naslov}</h2>
          <p className="mt-2 text-sm font-bold leading-snug text-ink/85">{kartica.tekst}</p>
          {korak === 0 && (
            <input
              ref={imePolje}
              value={imeTxt}
              maxLength={16}
              autoComplete="off"
              placeholder="npr. Prašina"
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                nacrtImena = e.target.value;
                setImeTxt(e.target.value);
              }}
              className="mt-4 w-full rounded-xl border border-line bg-void/70 px-3 py-3 text-base font-bold text-ink outline-none focus:border-gold/60"
            />
          )}
          {zadnja ? (
            <button
              type="button"
              data-testid="onboard-igraj"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                zavrsi(false);
              }}
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-gold text-sm font-bold tracking-[0.2em] text-void uppercase"
            >
              U kaubu
            </button>
          ) : (
            <button
              type="button"
              data-testid="onboard-dalje"
              onPointerDown={dalje}
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-gold text-sm font-bold tracking-[0.2em] text-void uppercase"
            >
              Dalje
            </button>
          )}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              zavrsi(true);
            }}
            className="mt-2 min-h-11 w-full text-xs font-bold tracking-widest text-dim uppercase"
          >
            Preskoči priču
          </button>
        </div>
      </div>
    </div>,
    portalKorijen(),
  );
}
