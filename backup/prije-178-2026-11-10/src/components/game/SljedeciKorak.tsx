import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Check, ChevronDown, Compass } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { odaberiKorak } from "@/lib/game/korak";
import { idiNaNalog } from "@/lib/game/idiNalog";
import { idi } from "@/lib/game/tokMeni";
import { otvoriCiljZgradu } from "@/lib/game/sljedeciCilj";
import type { Gradevine } from "@/lib/game/types";
import { playSfx } from "@/lib/game/audio";
import { smanjenPokret } from "@/lib/game/feel";
import { loadJSON, saveJSON, SAVE_KEYS } from "@/lib/game/persist";
import { useVodic, vodicIdi } from "@/lib/game/vodic";

import { cn } from "@/lib/utils";

export function SljedeciKorak() {
  const vodic = useVodic();
  const izIgre = useGameStore(
    useShallow((s) => {
      const k = odaberiKorak(s);
      return {
        id: k?.id ?? "",
        rec: k?.rec ?? "",
        vrsta: k?.vrsta ?? "",
        tip: k?.tip ?? "",
        zgrada: k?.zgrada ?? "",
      };
    }),
  );
  const korak = vodic.traka
    ? { id: `vodic-${vodic.korak}`, rec: vodic.rec, vrsta: "vodic", tip: "", zgrada: "" }
    : izIgre;
  const [smanjen, setSmanjen] = useState(() => loadJSON<string>(SAVE_KEYS.korak) === "ikona");
  const [prikaz, setPrikaz] = useState(korak);
  const [kvacica, setKvacica] = useState(false);
  const zadnji = useRef(korak);

  useEffect(() => {
    const prije = zadnji.current;
    if (prije.id && korak.id && prije.id !== korak.id) {
      zadnji.current = korak;
      setPrikaz(prije);
      setKvacica(true);
      const t = window.setTimeout(() => {
        setKvacica(false);
        setPrikaz(korak);
      }, smanjenPokret() ? 100 : 460);
      return () => window.clearTimeout(t);
    }
    zadnji.current = korak;
    setKvacica(false);
    setPrikaz(korak);
  }, [korak]);

  if (!vodic.prikaz || !vodic.traka) return null;
  if (!prikaz.id && !korak.id) return null;

  const spremi = (ikona: boolean) => {
    setSmanjen(ikona);
    saveJSON(SAVE_KEYS.korak, ikona ? "ikona" : "traka");
  };

  const idiTamo = () => {
    playSfx("button");
    if (prikaz.vrsta === "vodic") {
      vodicIdi();
      return;
    }
    if (prikaz.vrsta === "zgrada" && prikaz.zgrada) otvoriCiljZgradu(prikaz.zgrada as keyof Gradevine);
    else if (prikaz.vrsta === "nalog" && prikaz.tip) idiNaNalog(prikaz.tip);
    else idi({ tab: "misije", zadaci: "nalozi" });
  };

  if (smanjen) {
    return (
      <div className="korak-red shrink-0 px-2.5 pt-1">
        <button
          type="button"
          className={cn("korak-ikona", kvacica && "is-kvacica")}
          aria-label={kvacica ? "Korak gotov" : prikaz.rec || "Sljedeći korak"}
          onClick={() => spremi(false)}
        >
          {kvacica ? <Check className="size-4" /> : <Compass className="size-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="korak-red shrink-0 px-2.5 pt-1" data-testid="sljedeci-korak">
      <div className={cn("korak-traka", kvacica && "is-kvacica")}>
        <button type="button" className="korak-smanji" aria-label="Smanji korak" onClick={() => spremi(true)}>
          <ChevronDown className="size-3.5" />
        </button>
        {kvacica ? (
          <span className="korak-rec" role="status">
            <Check className="korak-kvacica size-4" />
            Gotovo
          </span>
        ) : (
          <button type="button" className="korak-rec" onClick={idiTamo}>
            {prikaz.rec}
          </button>
        )}
        {!kvacica && (
          <button type="button" className="korak-idi" onClick={idiTamo}>
            IDI
          </button>
        )}
      </div>
    </div>
  );
}
