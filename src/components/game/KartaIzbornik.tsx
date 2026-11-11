import { useEffect, useRef, useState } from "react";
import { Iznos, TekstResursa } from "@/components/game/Iznos";
import { ZGRADE } from "@/lib/game/constants";
import { POTREBE_META, cijenaZgrade, hubZaZgradu, zgradaUvjet } from "@/lib/game/economy";
import { nagradaZaNadogradnju } from "@/lib/game/sljedeciCilj";
import { playSfx } from "@/lib/game/audio";
import type { LikHub } from "@/lib/game/ljudi";
import { useGameStore } from "@/lib/stores/gameStore";
import type { Gradevine } from "@/lib/game/types";

function recCijene(c: { zlato: number; drvo: number; kamen: number; zeljezo: number }) {
  const d: string[] = [];
  if (c.zlato) d.push(`${Math.ceil(c.zlato)} zlata`);
  if (c.drvo) d.push(`${Math.ceil(c.drvo)} drva`);
  if (c.kamen) d.push(`${Math.ceil(c.kamen)} kamena`);
  if (c.zeljezo) d.push(`${Math.ceil(c.zeljezo)} željeza`);
  return d.join(" · ") || "besplatno";
}

export function KartaIzbornik({
  id,
  onZatvori,
  onSve,
}: {
  id: keyof Gradevine;
  onZatvori: () => void;
  onSve: (id: keyof Gradevine) => void;
}) {
  const z = ZGRADE.find((x) => x.id === id);
  const lv = useGameStore((s) => s.gradevine[id] || 0);
  const gradevine = useGameStore((s) => s.gradevine);
  const prestige = useGameStore((s) => s.prestigeRazina);
  const nadogradi = useGameStore((s) => s.nadogradiZgradu);
  const ljudi = useGameStore((s) => s.ljudi);
  const segrti = useGameStore((s) => s.segrti);
  const zamjenici = useGameStore((s) => s.zamjenici);
  const premjesti = useGameStore((s) => s.premjestiLika);
  const [info, setInfo] = useState(false);
  const [razlog, setRazlog] = useState<string | null>(null);
  const [ljudiOtvoreno, setLjudiOtvoreno] = useState(false);
  const [tko, setTko] = useState<string | null>(null);
  const rodjen = useRef(0);
  const zadnji = useRef(0);
  useEffect(() => {
    rodjen.current = performance.now();
    setRazlog(null);
  }, [id]);
  if (!z) return null;
  const hub = hubZaZgradu(id);
  const stanari = [...ljudi, ...segrti, ...zamjenici].filter((p) => hub && p.hub === hub);
  const uvjet = lv === 0 ? zgradaUvjet(id, gradevine) : null;
  const sljedeci = Math.min(z.maxLv, lv + 1);
  const cijena = cijenaZgrade(z, sljedeci, prestige);
  const cijenaRec = recCijene(cijena);
  const strop = lv >= z.maxLv;

  const zatvori = () => {
    playSfx("button");
    onZatvori();
  };

  const jasno = (poruka: string) => {
    if (uvjet) return uvjet;
    if (poruka === "NEDOSTAJU RESURSI") return "Nema dovoljno zlata ili robe.";
    return poruka || "Ne može se graditi.";
  };

  const gradi = (e: { preventDefault: () => void; stopPropagation: () => void; button?: number; pointerType?: string }) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    e.stopPropagation();
    if (uvjet) {
      setRazlog(uvjet);
      playSfx("button");
      return;
    }
    const sad = performance.now();
    if (sad - rodjen.current < 420) return;
    if (sad - zadnji.current < 400) return;
    zadnji.current = sad;
    const prije = useGameStore.getState().gradnje.some((g) => g.zgrada === z.id);
    nadogradi(z);
    const poslije = useGameStore.getState();
    if (!prije && poslije.gradnje.some((g) => g.zgrada === z.id)) {
      onZatvori();
      return;
    }
    setRazlog(jasno(poslije.poruka));
  };

  return (
    <div
      className="karta-izbornik"
      role="menu"
      data-testid="karta-izbornik"
      aria-label={z.naziv}
      data-lock-pan
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="karta-izbornik-naslov">
        {z.naziv}
        {lv > 0 ? ` · raz. ${lv}` : ""}
      </p>
      {razlog || uvjet ? (
        <p className="karta-izbornik-info" role="status">
          {razlog || uvjet}
        </p>
      ) : null}
      {info && (
        <p className="karta-izbornik-info">
          {lv > 0 ? nagradaZaNadogradnju(z, lv) : uvjet ? uvjet : nagradaZaNadogradnju(z, 1)}
        </p>
      )}
      {tko ? (
        <>
          {POTREBE_META.filter((h) => h.id !== hub).map((h) => (
            <button
              key={h.id}
              type="button"
              role="menuitem"
              onClick={() => {
                playSfx("button");
                premjesti(tko, h.id as LikHub);
                setTko(null);
                onZatvori();
              }}
            >
              Na {h.naziv.toLowerCase()}
            </button>
          ))}
          <button type="button" role="menuitem" onClick={() => { playSfx("button"); setTko(null); }}>
            Natrag
          </button>
        </>
      ) : ljudiOtvoreno ? (
        <>
          {stanari.length === 0 ? (
            <p className="karta-izbornik-info">Nitko tu ne stanuje.</p>
          ) : (
            stanari.map((p) => (
              <p key={p.id} className="karta-izbornik-info">
                {p.ime}
              </p>
            ))
          )}
          <button type="button" role="menuitem" onClick={() => { playSfx("button"); setLjudiOtvoreno(false); }}>
            Natrag
          </button>
        </>
      ) : lv > 0 ? (
        <>
          <button
            type="button"
            role="menuitem"
            disabled={strop}
            onClick={() => {
              playSfx("build");
              nadogradi(z);
              onZatvori();
            }}
          >
            {strop ? "Strop" : <TekstResursa tekst={`Nadogradi · ${cijenaRec}`} />}
          </button>
          <button type="button" role="menuitem" onClick={() => { playSfx("button"); setInfo((v) => !v); }}>
            Info
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              playSfx("button");
              setInfo(false);
              setLjudiOtvoreno(true);
            }}
          >
            Kauboji{stanari.length ? ` · ${stanari.length}` : ""}
          </button>
          {stanari.map((p) => (
            <button key={p.id} type="button" role="menuitem" onClick={() => { playSfx("button"); setTko(p.id); }}>
              Premjesti {p.ime}
            </button>
          ))}
        </>
      ) : (
        <button
          type="button"
          role="menuitem"
          data-lock-pan
          onPointerUp={gradi}
          onClick={gradi}
        >
          <span>Gradi</span>
          <small>{uvjet ? uvjet : <TekstResursa tekst={`${z.naziv} · ${cijenaRec}`} />}</small>
        </button>
      )}
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          playSfx("button");
          onSve(id);
          onZatvori();
        }}
      >
        Sve zgrade
      </button>
      <button type="button" role="menuitem" onClick={zatvori}>
        Zatvori
      </button>
    </div>
  );
}
