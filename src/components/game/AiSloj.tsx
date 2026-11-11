import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { napuniBazen, pokupiPrvi, useBazen } from "@/lib/game/aiBazen";
import { citajOdsutnost, sloziKontekst } from "@/lib/game/aiDogadaj";
import { playSfx } from "@/lib/game/audio";
import { danDoba } from "@/lib/game/ljudi";
import { vodicJosIde } from "@/lib/game/vodic";
import { usePovratak, zatvoriPovratak } from "@/lib/game/aiPrikaz";
import { portalKorijen } from "@/lib/game/portal";
import { useGameStore } from "@/lib/stores/gameStore";

function ulazIz(jos: () => boolean) {
  const s = useGameStore.getState();
  const sad = Date.now();
  const lokal = {
    energija: s.energija,
    maxEnergija: 0,
    stitovi: s.stitovi,
    metci: s.metci,
    ostecene: Object.values(s.ostecenja).filter(Boolean).length,
    posljednji: s.aiPosljednji,
  };
  const kontekst = sloziKontekst({
    vodicIde: vodicJosIde(),
    razina: s.igracRazina,
    xp: s.xp,
    gradevine: s.gradevine,
    ostecenja: s.ostecenja,
    zlato: s.zlato,
    dijamanti: s.dijamanti,
    resursi: s.resursi,
    energija: s.energija,
    baterija: s.razine.baterija || 0,
    stitovi: s.stitovi,
    oklop: s.razine.oklop || 0,
    metci: s.metci,
    sreca: s.razine.sreca || 0,
    stanovnici: s.stanovnici,
    misije: s.misije,
    gradnje: s.gradnje,
    doba: danDoba(new Date(sad)),
    kisa: s.kisaDo > sad,
    odsutnostMs: citajOdsutnost(),
    posljednji: s.aiPosljednji,
  });
  lokal.maxEnergija = kontekst.energija.max;
  return {
    ai: s.aiDogadaji !== false,
    jos,
    lokal,
    kontekst,
    posljednji: s.aiPosljednji ?? [],
    gradevine: s.gradevine,
    gradnje: s.gradnje,
  };
}

export function AiOznaka({ ziva }: { ziva: boolean }) {
  const objekti = useBazen();
  const ai = useGameStore((s) => s.aiDogadaji !== false);
  const broj = objekti.length;
  const radi = useRef(false);

  useEffect(() => {
    if (!ziva) return;
    let ziv = true;
    let t = 0;
    const korak = () => {
      if (!ziv) return;
      void napuniBazen(ulazIz(() => ziv)).finally(() => {
        if (!ziv) return;
        t = window.setTimeout(korak, 8000);
      });
    };
    korak();
    return () => {
      ziv = false;
      window.clearTimeout(t);
    };
  }, [ziva, ai, broj]);

  const o = ziva ? objekti[0] : null;
  if (!o) return null;

  const pokupi = () => {
    if (radi.current) return;
    const uzet = pokupiPrvi();
    if (!uzet) return;
    radi.current = true;
    try {
      const st = useGameStore.getState();
      st.primiNagradu(uzet.nagrada);
      useGameStore.setState((stanje) => ({
        metci: stanje.metci + (uzet.metci || 0),
        aiPosljednji: [...(stanje.aiPosljednji ?? []), { tip: uzet.tip, naziv: uzet.naziv }].slice(-5),
      }));
      useGameStore.getState().spremi();
      playSfx("collect");
    } finally {
      radi.current = false;
    }
  };

  return (
    <button
      type="button"
      className="ai-oznaka"
      data-testid="ai-objekt"
      data-tip={o.tip}
      style={{ left: o.x, top: o.y }}
      aria-label={`${o.naziv}. ${o.opis}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        pokupi();
      }}
    >
      <i />
      <span>{o.naziv}</span>
    </button>
  );
}

export function AiPovratak() {
  const linija = usePovratak();
  if (!linija) return null;
  if (typeof document === "undefined") return null;
  return createPortal(
    <button
      type="button"
      className="ai-povratak"
      data-testid="dok-te-nije-bilo"
      aria-live="polite"
      onClick={() => zatvoriPovratak()}
    >
      {linija.tekst}
    </button>,
    portalKorijen(),
  );
}
