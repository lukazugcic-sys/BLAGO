import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { APP_VERSION, APP_CHANNEL } from "@/lib/game/version";
import { CREDITS } from "@/lib/game/art";
import { SAVE_KEYS } from "@/lib/game/persist";
import { playSfx } from "@/lib/game/audio";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { useEffect, useRef, useState } from "react";
import { portalKorijen } from "@/lib/game/portal";
import { lokalniNoviPocetak } from "@/lib/game/noviPocetak";

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
  const [noviPotvrda, setNoviPotvrda] = useState(false);
  const [autoRez, setAutoRez] = useState<string | null>(null);
  const [devAlati, setDevAlati] = useState(false);
  const verzijaTaps = useRef(0);
  const testAlat = useGameStore((s) => s.testAlat);
  const autoTest = useGameStore((s) => s.autoTest);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
  const aiDogadaji = useGameStore((s) => s.aiDogadaji !== false);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("dev") === "1";
    let mem = false;
    try {
      mem = window.sessionStorage.getItem("blago-dev") === "1";
    } catch {
      mem = false;
    }
    setDevAlati(q || mem);
  }, [open]);

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
    <div className="modal-pozadina fixed inset-0 z-[80] flex items-end justify-center bg-void/75 p-4 sm:items-center">
      <div className="modal-ulaz max-h-[min(32rem,82dvh)] w-full max-w-sm overflow-y-auto rounded-3xl border border-line bg-panel">
        <div className="p-3 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <p
            className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase"
            onClick={() => {
              verzijaTaps.current += 1;
              if (verzijaTaps.current < 7) return;
              try {
                window.sessionStorage.setItem("blago-dev", "1");
              } catch {
                /* privatno */
              }
              setDevAlati(true);
            }}
          >
            {APP_CHANNEL} {APP_VERSION}
          </p>
          <button
            type="button"
            onClick={() => {
              setPotvrda(false);
              setNoviPotvrda(false);
              onClose();
            }}
            className="flex size-8 items-center justify-center rounded-full border border-line text-dim"
            aria-label="Zatvori"
          >
            <X className="size-4" />
          </button>
        </div>
        <h2 className="font-display text-lg text-gold">BLAGO beta</h2>
        <p className="mt-1 text-xs font-bold leading-relaxed text-ink/75">
          Igraj u pregledniku. Na telefonu otvori izbornik preglednika i dodaj na početni zaslon.
        </p>
        <a
          href={`/apk/BLAGO-${APP_VERSION}.apk`}
          download={`BLAGO-${APP_VERSION}.apk`}
          className="mt-3 flex min-h-10 w-full items-center justify-center rounded-full bg-gold text-xs font-bold tracking-widest text-void uppercase"
        >
          Preuzmi APK {APP_VERSION}
        </a>

        {devAlati && (
        <>
        <h3 className="mt-3 text-[10px] font-bold tracking-[0.22em] text-gold uppercase">
          Alati za testiranje
        </h3>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {ALATI.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                playSfx("button");
                testAlat(a.id);
              }}
              className="min-h-10 rounded-xl border border-line bg-panel-2 px-2 text-[11px] font-bold text-ink"
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
            className="min-h-10 rounded-xl border border-ruby/50 bg-ruby/15 px-2 text-[11px] font-bold text-ruby"
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
          className="mt-1.5 min-h-10 w-full rounded-xl border border-gold/50 bg-gold/15 text-xs font-bold tracking-widest text-gold uppercase"
        >
          {autoRez ? `Auto-test ${autoRez}` : "Pokreni auto-test"}
        </button>
        </>
        )}
        <button
          type="button"
          onClick={() => {
            playSfx("button");
            if (!noviPotvrda) {
              setNoviPotvrda(true);
              return;
            }
            lokalniNoviPocetak();
          }}
          className="mt-1.5 min-h-10 w-full rounded-xl border border-line bg-panel-2 px-2 text-[11px] font-bold text-ink"
        >
          {noviPotvrda ? "Da, počni ispočetka na ovom uređaju" : "Novi početak (test)"}
        </button>
        {noviPotvrda && (
          <p className="mt-1 text-[10px] font-bold leading-relaxed text-dim">
            Briše spremanje na ovom uređaju i serverski zapis ove prijave, pa krene od priče.
          </p>
        )}

        <button
          type="button"
          role="switch"
          aria-checked={aiDogadaji}
          data-testid="ai-dogadaji"
          onClick={() => {
            playSfx("button");
            const cur = useGameStore.getState();
            useGameStore.setState({ aiDogadaji: cur.aiDogadaji === false });
            cur.spremi();
          }}
          className="mt-2 flex min-h-10 w-full items-center justify-between rounded-xl border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink"
        >
          <span>AI događaji</span>
          <span>{aiDogadaji ? "Uključeno" : "Isključeno"}</span>
        </button>
        <p className="mt-1 text-[10px] font-bold leading-relaxed text-dim" data-testid="ai-cloud-rec">
          Kontekst igre (bez osobnih podataka) šalje se na Cloudflare radi stvaranja događaja.
        </p>

        <p className="mt-2 text-[10px] font-bold leading-relaxed tracking-wide text-dim">{CREDITS}</p>
        <button
          type="button"
          onClick={() => {
            playSfx("button");
            reset();
          }}
          className="mt-2 min-h-10 w-full rounded-full border border-ruby/50 bg-ruby/15 text-xs font-bold tracking-widest text-ruby uppercase"
        >
          {potvrda ? "Stvarno obriši spremanje" : "Obriši spremanje"}
        </button>
        </div>
      </div>
    </div>,
    portalKorijen(),
  );
}
