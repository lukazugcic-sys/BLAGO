import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { ART, HUB_ART } from "@/lib/game/art";
import { playSfx } from "@/lib/game/audio";
import { smanjenPokret } from "@/lib/game/feel";
import { kaubaOd } from "@/lib/game/ljudi";
import {
  OBRUC,
  bojaKvalitete,
  brojZgrada,
  debljinaDoprinos,
  debljinaJacine,
  huboviIz,
  imaUtjecaj,
  krivulja,
  najjaciUtjecaji,
  sloziTok,
  spojiUtjecaje,
  stisniPomak,
  stisniZum,
  vezaPulsira,
  type HubPrikaz,
} from "@/lib/game/mrezaPrikaz";
import type { KaubaUsko } from "@/lib/game/economy";
import { POTREBE_META } from "@/lib/game/economy";
import type { Gradevine } from "@/lib/game/types";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { cn } from "@/lib/utils";

type Fokus = { vrsta: "selo" } | { vrsta: "hub"; id: KaubaUsko } | { vrsta: "dodatak"; id: string };

const PRAZNO: string[] = [];

function imeHuba(id: string) {
  return POTREBE_META.find((p) => p.id === id)?.naziv ?? id;
}

export function MrezaSela({
  onZatvori,
  onZgrada,
}: {
  onZatvori: () => void;
  onZgrada: (id: keyof Gradevine) => void;
}) {
  const ulaz = useGameStore(
    useShallow((s) => ({
      imeIgraca: s.imeIgraca,
      gradevine: s.gradevine,
      ostecenja: s.ostecenja,
      stitovi: s.stitovi,
      oklop: s.razine?.oklop ?? 0,
      klan: s.klan,
      stavSela: s.stavSela,
      kronika: s.kronika,
      igracRazina: s.igracRazina,
      prestigeRazina: s.prestigeRazina,
      stanovnici: s.stanovnici,
      zamjenici: s.zamjenici,
      konjiBroj: s.konjiBroj,
      konjiDuznost: s.konjiDuznost,
      sijenoDo: s.sijenoDo,
      kisaDo: s.kisaDo,
      govedaBroj: s.govedaBroj,
      govedaDuznost: s.govedaDuznost,
      ljudi: s.ljudi,
      segrti: s.segrti,
    })),
  );
  const pulsIds = useGameStore((s) => {
    const ids = (s as { protokPuls?: { ids?: string[] } | null }).protokPuls?.ids;
    return ids?.length ? ids : PRAZNO;
  });
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
  const tok = useMemo(() => {
    try {
      return sloziTok(ulaz);
    } catch {
      return sloziTok(null);
    }
  }, [ulaz]);
  const utjecaji = useMemo(() => {
    try {
      return spojiUtjecaje(
        kaubaOd({
          gradevine: ulaz.gradevine,
          stanovnici: ulaz.stanovnici ?? 0,
          zamjenici: ulaz.zamjenici,
          konjiBroj: ulaz.konjiBroj,
          konjiDuznost: ulaz.konjiDuznost,
          sijenoDo: ulaz.sijenoDo,
          kisaDo: ulaz.kisaDo,
          govedaBroj: ulaz.govedaBroj,
          govedaDuznost: ulaz.govedaDuznost,
          ljudi: ulaz.ljudi,
          segrti: ulaz.segrti,
        }).utjecaji ?? [],
      );
    } catch {
      return [];
    }
  }, [ulaz]);
  const [fokus, setFokus] = useState<Fokus>({ vrsta: "selo" });
  const [zum, setZum] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const gesta = useRef({
    prsti: new Map<number, { x: number; y: number }>(),
    zum0: 1,
    razmak0: 0,
    pan0: { x: 0, y: 0 },
    zadnji: 0,
    pomak: 0,
  });
  const mirno = smanjenPokret();
  const hub = fokus.vrsta === "hub" ? tok.hubovi.find((h) => h.id === fokus.id) : null;
  const dodatak = fokus.vrsta === "dodatak" ? tok.dodaci.find((c) => c.id === fokus.id) : null;
  const naslov = fokus.vrsta === "selo" ? tok.selo.naziv : hub?.naziv ?? dodatak?.naziv ?? tok.selo.naziv;

  const odaberi = (f: Fokus) => {
    playSfx("button");
    setFokus(f);
  };

  const naDolje = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const st = gesta.current;
    st.prsti.set(e.pointerId, { x: e.clientX, y: e.clientY });
    st.pomak = 0;
    if (st.prsti.size === 2) {
      const [a, b] = [...st.prsti.values()];
      st.razmak0 = Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1;
      st.zum0 = zum;
      st.pan0 = pan;
    }
  };
  const naPomak = (e: ReactPointerEvent<HTMLDivElement>) => {
    const st = gesta.current;
    const prije = st.prsti.get(e.pointerId);
    if (!prije) return;
    st.pomak += Math.hypot(e.clientX - prije.x, e.clientY - prije.y);
    st.prsti.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (st.prsti.size >= 2) {
      const [a, b] = [...st.prsti.values()];
      const razmak = Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1;
      const sljedeci = stisniZum(st.zum0 * (razmak / st.razmak0));
      setZum(sljedeci);
      setPan(stisniPomak(sljedeci, st.pan0.x, st.pan0.y));
      return;
    }
    if (zum <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - prije.x) / Math.max(1, rect.width)) * 100;
    const dy = ((e.clientY - prije.y) / Math.max(1, rect.height)) * 100;
    setPan((cur) => stisniPomak(zum, cur.x + dx, cur.y + dy));
  };
  const naGore = (e: ReactPointerEvent<HTMLDivElement>) => {
    const st = gesta.current;
    const bio = st.prsti.size;
    st.prsti.delete(e.pointerId);
    if (bio === 1 && st.pomak < 8) {
      const sad = performance.now();
      if (sad - st.zadnji < 280 && !(e.target as HTMLElement).closest("button")) {
        setZum(1);
        setPan({ x: 0, y: 0 });
        st.zadnji = 0;
      } else st.zadnji = sad;
    }
  };

  const vezaDoSela = (h: HubPrikaz) => {
    const pred = h.doprinos < 0 ? -1 : 1;
    const odabran = fokus.vrsta === "selo" || (fokus.vrsta === "hub" && fokus.id === h.id);
    const puls = !mirno && h.zgrade.some((z) => vezaPulsira(pulsIds, z.id));
    return (
      <path
        key={h.id}
        className={cn("mreza-veza", !mirno && "mreza-veza-tok", puls && "mreza-veza-puls")}
        d={krivulja(h, tok.selo, 0.14, pred)}
        stroke={pred < 0 ? "#c44848" : "#3d8f4a"}
        strokeWidth={debljinaDoprinos(h.doprinos)}
        opacity={odabran ? 0.95 : 0.38}
        markerEnd={pred < 0 ? "url(#mreza-strelica-ne)" : "url(#mreza-strelica-da)"}
      />
    );
  };

  return (
    <section className="mreza-rub" data-lock-pan onPointerDown={(e) => e.stopPropagation()}>
      <header className="mreza-glava">
        <div>
          <h2 className="mreza-glava-naslov">Tok kaube</h2>
          <button type="button" className="mreza-natrag" onClick={onZatvori} aria-label="Natrag na kartu">
            Karta
          </button>
        </div>
        <p className="mreza-glava-rec">{naslov}</p>
      </header>
      <div
        className="mreza-platno"
        data-testid="mreza-platno"
        onPointerDown={naDolje}
        onPointerMove={naPomak}
        onPointerUp={naGore}
        onPointerCancel={naGore}
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(20,12,8,.28), rgba(20,12,8,.62)), url(${ART.seloPoster})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mreza-zum-platno" style={{ transform: `translate(${pan.x}%, ${pan.y}%) scale(${zum})` }}>
          <svg className="mreza-crte" viewBox="0 0 100 100" aria-hidden>
            <defs>
              <marker id="mreza-strelica-da" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="3.2" markerHeight="3.2" orient="auto">
                <path d="M0 0 L8 4 L0 8 Z" fill="#3d8f4a" />
              </marker>
              <marker id="mreza-strelica-ne" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="3.2" markerHeight="3.2" orient="auto">
                <path d="M0 0 L8 4 L0 8 Z" fill="#c44848" />
              </marker>
            </defs>
            {OBRUC.map(([a, b]) => {
              if (imaUtjecaj(utjecaji, a, b)) return null;
              const pa = tok.hubovi.find((h) => h.id === a);
              const pb = tok.hubovi.find((h) => h.id === b);
              if (!pa || !pb) return null;
              return <path key={`${a}-${b}`} className="mreza-veza" d={krivulja(pa, pb, 0.14, 1)} stroke="#e7c48a" strokeWidth={0.45} opacity={0.28} />;
            })}
            {utjecaji.map((u) => {
              const a = tok.hubovi.find((h) => h.id === u.od);
              const b = tok.hubovi.find((h) => h.id === u.do);
              if (!a || !b) return null;
              const odabran = fokus.vrsta === "selo" || (fokus.vrsta === "hub" && (fokus.id === u.od || fokus.id === u.do));
              return (
                <path
                  key={`${u.od}>${u.do}:${u.predznak}`}
                  className={cn("mreza-veza", "mreza-veza-utjecaj", !mirno && "mreza-veza-tok")}
                  d={krivulja(a, b, 0.14, u.predznak)}
                  stroke={u.predznak < 0 ? "#c44848" : "#3d8f4a"}
                  strokeWidth={debljinaJacine(u.jacina)}
                  opacity={odabran ? 0.95 : 0.38}
                  markerEnd={u.predznak < 0 ? "url(#mreza-strelica-ne)" : "url(#mreza-strelica-da)"}
                />
              );
            })}
            {tok.hubovi.map(vezaDoSela)}
          </svg>
          <button
            type="button"
            className={cn("mreza-cvor", "mreza-selo")}
            style={{ left: `${tok.selo.x}%`, top: `${tok.selo.y}%` }}
            aria-label={`${tok.selo.naziv}, kvaliteta ${tok.selo.kvaliteta}`}
            aria-pressed={fokus.vrsta === "selo"}
            onClick={() => odaberi({ vrsta: "selo" })}
          >
            <img src={HUB_ART.selo} alt="" />
            <span className="mreza-ime mreza-ime-unutra">{tok.selo.naziv}</span>
          </button>
          {tok.hubovi.map((h) => (
            <button
              key={h.id}
              type="button"
              className={cn("mreza-cvor", "mreza-hub-cvor", h.mutan && "is-mutan")}
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
              aria-label={`${h.naziv}, kvaliteta ${h.kvaliteta}`}
              aria-pressed={fokus.vrsta === "hub" && fokus.id === h.id}
              onClick={() => odaberi({ vrsta: "hub", id: h.id })}
            >
              <img src={HUB_ART[h.id] ?? HUB_ART.selo} alt="" />
              <span className="mreza-ime mreza-ime-unutra">{h.naziv}</span>
            </button>
          ))}
        </div>
        {zum > 1 ? <p className="mreza-zum-rec">Zum ×{zum.toFixed(1)} · dvaput za nulu</p> : null}
      </div>
      {tok.dodaci.length > 0 ? (
        <div className="mreza-cipovi">
          {tok.dodaci.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cn("mreza-extra", c.vrsta === "kriza" && "kriza")}
              aria-pressed={fokus.vrsta === "dodatak" && fokus.id === c.id}
              aria-label={`${c.naziv}, kvaliteta ${c.kvaliteta}`}
              onClick={() => odaberi({ vrsta: "dodatak", id: c.id })}
            >
              <img src={c.art} alt="" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="mreza-ploca">
        {fokus.vrsta === "selo" ? (
          <SeloPloca tok={tok} utjecaji={utjecaji} />
        ) : hub ? (
          <HubPloca hub={hub} utjecaji={utjecaji} onZgrada={onZgrada} />
        ) : dodatak ? (
          <DodatakPloca
            naziv={dodatak.naziv}
            id={dodatak.id}
            veze={tok.veze}
            pohod={dodatak.akcija === "napad"}
            onPohod={() => {
              playSfx("button");
              setRaidAktivan(true);
            }}
          />
        ) : null}
        <ul className="mreza-okomito">
          {tok.hubovi.map((h) => (
            <li key={h.id}>
              <button type="button" className={cn("mreza-ok-red", fokus.vrsta === "hub" && fokus.id === h.id && "mreza-ok-red-on")} onClick={() => odaberi({ vrsta: "hub", id: h.id })}>
                <span>{h.naziv}</span>
                <small>{brojZgrada(h.zgrade.length)} · kvaliteta {h.kvaliteta}</small>
                <i className="mreza-traka"><b style={{ width: `${h.kvaliteta}%`, background: bojaKvalitete(h.kvaliteta) }} /></i>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Traka({ n }: { n: number }) {
  return (
    <span className="mreza-traka" aria-hidden>
      <b style={{ width: `${Math.max(0, Math.min(100, n))}%`, background: bojaKvalitete(n) }} />
    </span>
  );
}

function SeloPloca({
  tok,
  utjecaji,
}: {
  tok: ReturnType<typeof sloziTok>;
  utjecaji: ReturnType<typeof spojiUtjecaje>;
}) {
  const dodaci = tok.veze.filter((v) => tok.dodaci.some((c) => c.id === v.od || c.id === v.do));
  return (
    <>
      <p className="mreza-kv">Kvaliteta {tok.selo.kvaliteta}</p>
      <Traka n={tok.selo.kvaliteta} />
      <p className="mreza-red">+{tok.baza} tabor stoji</p>
      {tok.hubovi.filter((h) => !h.mutan).map((h) => (
        <p key={h.id} className="mreza-red">
          {h.naziv} {h.doprinos >= 0 ? "+" : ""}{h.doprinos.toFixed(1)} · {h.zgrade.filter((z) => z.kvaliteta > 0).map((z) => z.naziv).join(", ")}
        </p>
      ))}
      {dodaci.map((v) => (
        <p key={v.id} className="mreza-red">{v.opis}</p>
      ))}
      {najjaciUtjecaji(utjecaji).map((u) => (
        <p key={`${u.od}-${u.do}-${u.predznak}`} className="mreza-red">
          {imeHuba(u.od)} → {imeHuba(u.do)} · {u.rec}
        </p>
      ))}
    </>
  );
}

function HubPloca({
  hub,
  utjecaji,
  onZgrada,
}: {
  hub: HubPrikaz;
  utjecaji: ReturnType<typeof spojiUtjecaje>;
  onZgrada: (id: keyof Gradevine) => void;
}) {
  const svoje = utjecaji.filter((u) => u.od === hub.id || u.do === hub.id);
  return (
    <>
      <p className="mreza-kv">Kvaliteta {hub.kvaliteta}</p>
      <Traka n={hub.kvaliteta} />
      {hub.zgrade.map((z) => (
        <button key={z.id} type="button" className="mreza-zgrada" onClick={() => onZgrada(z.id)}>
          {z.kvaliteta > 0 ? `${z.kvaliteta} · ${z.naziv} · drži kaubu` : `· ${z.naziv} · još pusto`}
        </button>
      ))}
      {svoje.map((u) => (
        <p key={`${u.od}-${u.do}-${u.predznak}`} className="mreza-red">
          {imeHuba(u.od)} → {imeHuba(u.do)} · {u.rec}
        </p>
      ))}
    </>
  );
}

function DodatakPloca({
  naziv,
  id,
  veze,
  pohod,
  onPohod,
}: {
  naziv: string;
  id: string;
  veze: ReturnType<typeof sloziTok>["veze"];
  pohod: boolean;
  onPohod: () => void;
}) {
  const ulaz = veze.filter((v) => v.do === id);
  const izlaz = veze.filter((v) => v.od === id);
  return (
    <>
      <p className="mreza-kv">{naziv}</p>
      {ulaz.map((v) => (
        <p key={`u-${v.id}`} className="mreza-red">Ulaz {v.doprinos.toFixed(1)} · {v.opis}</p>
      ))}
      {izlaz.map((v) => (
        <p key={`i-${v.id}`} className="mreza-red">Izlaz {v.doprinos.toFixed(1)} · {v.opis}</p>
      ))}
      {ulaz.length + izlaz.length === 0 ? <p className="mreza-red">Nema veza.</p> : null}
      {pohod ? (
        <button type="button" className="mreza-pohod" onClick={onPohod}>Pohod</button>
      ) : null}
    </>
  );
}
