import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { POTREBA_BOJA, POTREBE_META, raspolozenjeKaube, type KaubaStanje, type KaubaUsko } from "@/lib/game/economy";
import { playSfx } from "@/lib/game/audio";
import { portalKorijen } from "@/lib/game/portal";
import { cn } from "@/lib/utils";

export function AlmanahSloj({
  kauba,
  imeNaselja,
  onZatvori,
  onHub,
}: {
  kauba: KaubaStanje;
  imeNaselja: string;
  onZatvori: () => void;
  onHub: (id: KaubaUsko) => void;
}) {
  if (typeof document === "undefined") return null;
  const mood = raspolozenjeKaube(kauba);
  const veze = [...kauba.utjecaji].sort((a, b) => Math.abs(b.jacina) - Math.abs(a.jacina));
  const ime = imeNaselja.trim() || "Kauba";

  return createPortal(
    <div className="almanah-sloj modal-pozadina" data-testid="almanah-sloj" role="dialog" aria-label="Almanah">
      <button type="button" className="almanah-poz" aria-label="Zatvori almanah" onClick={onZatvori} />
      <article className="almanah-listak modal-ulaz">
        <header className="almanah-glava">
          <div>
            <p className="almanah-natpis">{ime}</p>
            <h2 className="almanah-naslov">Almanah</h2>
            <p className="almanah-rec">{mood.rec}</p>
          </div>
          <button
            type="button"
            className="almanah-x"
            data-testid="almanah-zatvori"
            aria-label="Zatvori"
            onClick={() => {
              playSfx("button");
              onZatvori();
            }}
          >
            <X className="size-4" strokeWidth={2.4} />
          </button>
        </header>

        <p className="almanah-uvod">Tko vuče koga. Uzrok i posljedica u kaubi.</p>

        <ul className="almanah-potrebe">
          {POTREBE_META.map((p) => {
            const v = kauba.potrebe[p.id];
            const pct = Math.round(Math.max(0, Math.min(1, v)) * 100);
            const usko = kauba.usko === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={cn("almanah-potreba", usko && "is-usko")}
                  data-testid={`almanah-potreba-${p.id}`}
                  style={{ ["--potreba" as string]: POTREBA_BOJA[p.id] }}
                  onClick={() => {
                    playSfx("button");
                    onHub(p.id);
                  }}
                >
                  <span className="almanah-potreba-ime">
                    {p.naziv}
                    {usko ? " · usko" : ""}
                  </span>
                  <span className="almanah-potreba-broj">{pct}</span>
                  <span className="almanah-potreba-traka" aria-hidden>
                    <span style={{ width: `${pct}%` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <h3 className="almanah-podnaslov">Veze</h3>
        {veze.length === 0 ? (
          <p className="almanah-prazno">Još nema veza. Diži zgrade pa se list napuni.</p>
        ) : (
          <ul className="almanah-veze">
            {veze.map((v, i) => {
              const od = POTREBE_META.find((p) => p.id === v.od)?.naziv ?? v.od;
              const dest = POTREBE_META.find((p) => p.id === v.do)?.naziv ?? v.do;
              return (
                <li
                  key={`${v.od}-${v.do}-${i}`}
                  className={cn("almanah-veza", v.predznak < 0 && "is-minus")}
                  data-testid="almanah-veza"
                >
                  <p className="almanah-veza-put">
                    {od} {v.predznak < 0 ? "vuče" : "hrani"} {dest}
                  </p>
                  <p className="almanah-veza-rec">{v.rec}</p>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </div>,
    portalKorijen(),
  );
}
