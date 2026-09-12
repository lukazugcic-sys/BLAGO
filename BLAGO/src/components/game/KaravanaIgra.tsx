import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import {
  SUSJEDI,
  karavanaCilj,
  karavanaIsplata,
  KARAVANA_PUTOVI,
  karavanaPut,
} from "@/lib/game/susjedi";
import { tjedanSad } from "@/lib/game/tjedan";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import { ART } from "@/lib/game/art";
import type { KaravanaPutId } from "@/lib/game/types";
import { SideGateKartica } from "./SideGateKartica";
import { jeSideOtkljucan } from "@/lib/game/sideGate";

const RES_REC: Record<"drvo" | "kamen" | "zeljezo", string> = {
  drvo: "drvo",
  kamen: "kamen",
  zeljezo: "željezo",
};

export function KaravanaIgra() {
  const otkljucan = useGameStore((s) => jeSideOtkljucan(s.gradevine));
  const karavana = useGameStore((s) => s.karavana);
  const resursi = useGameStore((s) => s.resursi);
  const posalji = useGameStore((s) => s.posaljiKaravanu);
  const rijesi = useGameStore((s) => s.rijesiKaravanaCin);
  const [cilj, setCilj] = useState(SUSJEDI[0]!.uid);
  const [res, setRes] = useState<"drvo" | "kamen" | "zeljezo">("drvo");
  const [lot, setLot] = useState(10);
  const [put, setPut] = useState<KaravanaPutId>("staza");
  const [sad, setSad] = useState(() => Date.now());

  useEffect(() => {
    if (!karavana) return;
    setSad(Date.now());
    const t = window.setInterval(() => setSad(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [karavana]);

  if (karavana) {
    const traje = Math.max(1, karavana.kraj - karavana.start);
    const pct = Math.min(100, Math.max(0, ((sad - karavana.start) / traje) * 100));
    const ostalo = Math.max(0, Math.ceil((karavana.kraj - sad) / 1000));
    const putMeta = karavanaPut(karavana.put);
    return (
      <article className="karavana-okvir mb-2 overflow-hidden">
        <div className="karavana-staza">
          <img
            src={ART.kola}
            alt=""
            draggable={false}
            className="karavana-kola-slika"
            style={{ left: `${pct}%` }}
          />
          <PutTraka pct={pct} cin={!!karavana.cin} od="Tabor" do={karavana.ciljIme} />
        </div>
        <div className="p-3">
          <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Karavana</p>
          <p className="mt-1 text-sm font-bold text-ink">
            {karavana.vozacIme} vozi {putMeta.naziv.toLowerCase()} do {karavana.ciljIme}.
          </p>
          {karavana.cin && !karavana.cinRijesen ? (
            <div className="karavana-cin mt-3 rounded-xl border border-ruby/50 bg-ruby/10 p-3">
              <p className="text-[11px] font-bold tracking-widest text-ruby uppercase">Na putu</p>
              <p className="mt-1 text-sm font-bold text-ink">{karavana.cin.rec}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {karavana.cin.opcije.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => rijesi(o.id)}
                    className="min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold text-void"
                  >
                    {o.rec}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[12px] font-bold text-ink/80">
              {ostalo > 0 ? `Još ${ostalo}s. Točak huči.` : "Ulaze u kaubu…"}
            </p>
          )}
        </div>
      </article>
    );
  }

  if (!otkljucan) {
    return <SideGateKartica naslov="Karavana" />;
  }

  const ima = Math.floor(resursi[res]);
  const ponuda = karavanaCilj(cilj);
  const susjed = SUSJEDI.find((s) => s.uid === cilj);
  const sajam = tjedanSad().vrsta === "sajam";
  const pregled = karavanaIsplata({ drvo: 0, kamen: 0, zeljezo: 0, [res]: lot }, sajam, cilj, put);
  const putMeta = karavanaPut(put);
  const hoceOvo = ponuda.hoce === res;

  return (
    <article className="karavana-okvir mb-2 overflow-hidden">
      <div className="karavana-staza">
        <img
          src={ART.kola}
          alt=""
          draggable={false}
          className="karavana-kola-slika"
          style={{ left: "12%" }}
        />
        <PutTraka pct={12} cin={false} od="Tabor" do={susjed?.kauba ?? "Kaubu"} />
      </div>
      <div className="p-3">
        <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Karavana</p>
        <p className="mt-1 text-[12px] font-bold text-ink/80">{ponuda.rec}</p>
        <p className="mt-1 text-[11px] font-bold text-gold">
          Hoće {RES_REC[ponuda.hoce]}. Plaća zlato, vraća teret.
        </p>

        <p className="mt-3 text-[10px] font-bold tracking-widest text-dim uppercase">Kamo</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {SUSJEDI.map((s) => (
            <button
              key={s.uid}
              type="button"
              onClick={() => {
                playSfx("button");
                setCilj(s.uid);
              }}
              className={cn(
                "min-h-8 rounded-full px-2.5 text-[10px] font-bold uppercase",
                cilj === s.uid ? "bg-gold text-void" : "border border-line bg-panel-2 text-dim",
              )}
            >
              {s.kauba}
            </button>
          ))}
        </div>

        <p className="mt-3 text-[10px] font-bold tracking-widest text-dim uppercase">Put</p>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {KARAVANA_PUTOVI.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                playSfx("button");
                setPut(p.id);
              }}
              className={cn(
                "min-h-16 rounded-xl px-2 py-1.5 text-left",
                put === p.id ? "bg-gold text-void" : "border border-line bg-panel-2 text-dim",
              )}
            >
              <span className="block text-[11px] font-bold uppercase">{p.naziv}</span>
              <span className={cn("mt-0.5 block text-[10px] font-bold leading-tight", put === p.id ? "text-void/80" : "text-dim")}>
                {p.rec}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] font-bold text-ink/60">
          {putMeta.naziv}: {putMeta.vrijeme < 1 ? "brže" : putMeta.vrijeme > 1 ? "duže" : "obično"} · plaća ×{putMeta.plata.toFixed(2)} · rizik {Math.round(putMeta.rizik * 100)}%
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {(["drvo", "kamen", "zeljezo"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                playSfx("button");
                setRes(id);
              }}
              className={cn(
                "min-h-8 rounded-full px-2.5 text-[10px] font-bold uppercase",
                res === id ? "bg-gold text-void" : "border border-line bg-panel-2 text-dim",
                ponuda.hoce === id && res !== id && "ring-1 ring-gold/50",
              )}
            >
              {RES_REC[id]}
              {ponuda.hoce === id ? " · hoće" : ""}
            </button>
          ))}
          {[10, 30, 50].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                playSfx("button");
                setLot(n);
              }}
              className={cn(
                "min-h-8 rounded-full px-2.5 text-[10px] font-bold",
                lot === n ? "bg-ink text-gold" : "border border-line text-dim",
              )}
            >
              ×{n}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={ima < lot}
          onClick={() => posalji(cilj, { drvo: 0, kamen: 0, zeljezo: 0, [res]: lot }, put)}
          className="mt-2 min-h-12 w-full rounded-xl bg-gold px-3 text-[13px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
        >
          Pošalji · +{pregled.zlato} zlata
          {pregled.drvo ? ` · +${pregled.drvo} drva` : ""}
          {pregled.kamen ? ` · +${pregled.kamen} kamena` : ""}
          {pregled.zeljezo ? ` · +${pregled.zeljezo} željeza` : ""}
        </button>
        {hoceOvo ? (
          <p className="mt-1 text-[11px] font-bold text-quest">Ovo hoće. Dobit je veća od burze.</p>
        ) : (
          <p className="mt-1 text-[11px] font-bold text-dim">Pošalji {RES_REC[ponuda.hoce]} pa bolje plaća.</p>
        )}
      </div>
    </article>
  );
}

function PutTraka({ pct, cin, od, do: dest }: { pct: number; cin: boolean; od: string; do: string }) {
  return (
    <div className="karavana-put px-3 pb-2">
      <span className="karavana-put-tijelo">
        <span className="karavana-put-punjenje" style={{ width: `${pct}%` }} />
        <span className={cn("karavana-kola-točka", cin && "karavana-kola-cin")} style={{ left: `${pct}%` }} />
      </span>
      <div className="mt-1 flex justify-between text-[9px] font-bold tracking-widest text-gold uppercase">
        <span>{od}</span>
        <span>{dest}</span>
      </div>
    </div>
  );
}
