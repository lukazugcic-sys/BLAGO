import { AlertTriangle } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { PrikazCijene } from "./PrikazCijene";
import { ZGRADE_SKINOVI } from "@/lib/game/constants";
import { RESURS_ART, ZGRADA_ART, artSrc } from "@/lib/game/art";
import { izracunajPasivniMnozitelj, izracunajTokMnozitelj, izracunajSalunZlato, zgradaUvjet, POKRICE, RESOURCE_TICK_MS, popravakCijena, bankaKap } from "@/lib/game/economy";
import { BUNAR_ENERGIJA, MLIN_ENERGIJA } from "@/lib/game/tuning";
import type { Zgrada } from "@/lib/game/types";
import { ljudiUZgradi, slobodanGraditelj, kaubaOd } from "@/lib/game/ljudi";
import { LikAvatar } from "./LikAvatar";
import { GradnjaScena } from "./GradnjaScena";
import { cn } from "@/lib/utils";

export const BuildingCard = memo(function BuildingCard({ zgrada, compact }: { zgrada: Zgrada; compact?: boolean }) {
  const zlato = useGameStore((s) => s.zlato);
  const resursi = useGameStore((s) => s.resursi);
  const gradevine = useGameStore((s) => s.gradevine);
  const ostecenja = useGameStore((s) => s.ostecenja);
  const igracRazina = useGameStore((s) => s.igracRazina);
  const prestigeRazina = useGameStore((s) => s.prestigeRazina);
  const kvalitetaSela = useGameStore((s) => s.kvalitetaSela);
  const aktivniSkin = useGameStore((s) => s.aktivniSkin);
  const nadogradiZgradu = useGameStore((s) => s.nadogradiZgradu);
  const popraviZgradu = useGameStore((s) => s.popraviZgradu);
  const gradnje = useGameStore((s) => s.gradnje);
  const segrti = useGameStore((s) => s.segrti);
  const zamjenici = useGameStore((s) => s.zamjenici);
  const karavana = useGameStore((s) => s.karavana);
  const [sad, setSad] = useState(() => Date.now());
  const [slavlje, setSlavlje] = useState(false);
  const posao = gradnje.find((g) => g.zgrada === zgrada.id) ?? null;
  const lvRef = useRef(gradevine[zgrada.id] || 0);

  useEffect(() => {
    if (!posao) return;
    setSad(Date.now());
    const t = window.setInterval(() => setSad(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [posao]);

  const stanovnici = useGameStore((s) => s.stanovnici);
  const ljudi = useGameStore((s) => s.ljudi);
  const konjiBroj = useGameStore((s) => s.konjiBroj);
  const konjiDuznost = useGameStore((s) => s.konjiDuznost);
  const govedaBroj = useGameStore((s) => s.govedaBroj);
  const govedaDuznost = useGameStore((s) => s.govedaDuznost);
  const sijenoDo = useGameStore((s) => s.sijenoDo);
  const kisaDo = useGameStore((s) => s.kisaDo);
  const pasivniMnozitelj =
    izracunajPasivniMnozitelj(igracRazina, prestigeRazina) * izracunajTokMnozitelj(kvalitetaSela);
  const lv = gradevine[zgrada.id] || 0;
  const unutra = ljudiUZgradi(
    ljudi.concat(segrti).concat(zamjenici),
    zgrada.id,
    gradevine,
    gradnje,
    ostecenja,
    undefined,
    karavana,
  );
  const jeOstecena = ostecenja[zgrada.id];
  const zakljucan = zgradaUvjet(zgrada.id, gradevine);
  const c = zgrada.cijena(lv + 1);
  const jeMax = lv >= zgrada.maxLv;
  const radiOvdje = !!posao;
  const slobodan = !!slobodanGraditelj(ljudi, segrti, gradnje);
  const zauzet = !radiOvdje && !slobodan;
  const trajeMs = posao ? Math.max(0, posao.kraj - posao.start) : 1;
  const ostaloMs = posao ? Math.max(0, posao.kraj - sad) : 0;
  const pct = radiOvdje ? Math.min(100, Math.round(((trajeMs - ostaloMs) / trajeMs) * 100)) : 0;
  const ostaloSec = Math.ceil(ostaloMs / 1000);
  const skin = ZGRADE_SKINOVI.find((s) => s.id === aktivniSkin) ?? ZGRADE_SKINOVI[0]!;
  useEffect(() => {
    if (lv > lvRef.current) {
      setSlavlje(true);
      const t = window.setTimeout(() => setSlavlje(false), 1200);
      lvRef.current = lv;
      return () => window.clearTimeout(t);
    }
    lvRef.current = lv;
  }, [lv]);
  const skinBoja = skin.boja;
  const tickSec = RESOURCE_TICK_MS / 1000;

  const mozeKupiti =
    zlato >= c.zlato &&
    resursi.drvo >= (c.drvo || 0) &&
    resursi.kamen >= (c.kamen || 0) &&
    resursi.zeljezo >= (c.zeljezo || 0);

  const cPopravak = popravakCijena(lv);
  const mozePopraviti = zlato >= cPopravak.zlato && resursi.drvo >= cPopravak.drvo;
  const kauba = kaubaOd({ gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo, kisaDo, govedaBroj, govedaDuznost });
  const radE = kauba.rad * kauba.efikasnost;
  const trenutnaProizvodnja = (lv * zgrada.bazaProizvodnja * pasivniMnozitelj * radE).toFixed(1);
  const ljudiN = Math.max(0, Math.floor(kauba.ljudi));
  const efekt =
    zgrada.id === "kuca"
      ? `${ljudiN}/${kauba.kapacitet} kreveta${kauba.tok > 0 && kauba.ljudi < kauba.kapacitet ? " · dolaze" : kauba.kapacitet > ljudiN && kauba.tok === 0 ? " · prazni" : ""}`
      : zgrada.id === "blok"
        ? zakljucan
          ? zakljucan
          : lv > 0
            ? `Stanovi ${lv * POKRICE.blok} kreveta · ${ljudiN}/${kauba.kapacitet}`
            : `${POKRICE.blok} kreveta po katu`
        : zgrada.id === "salun"
          ? lv > 0
            ? `Gosti ${Math.min(ljudiN, lv * POKRICE.salun)}/${lv * POKRICE.salun} · +${(izracunajSalunZlato(gradevine, kauba.ljudi) * pasivniMnozitelj).toFixed(1)} zlata / ${tickSec}s`
            : `Zabava za ${POKRICE.salun} ljudi`
          : zgrada.id === "karte"
            ? zakljucan
              ? zakljucan
              : lv > 0
                ? `Stol za asove · zabava ${lv * POKRICE.karte}`
                : "Stol za pogađanje karata"
            : zgrada.id === "bunar"
              ? lv > 0
                ? `Voda ${Math.min(ljudiN, lv * POKRICE.bunar)}/${lv * POKRICE.bunar} · +${(lv * BUNAR_ENERGIJA).toFixed(1)} energije / ${tickSec}s`
                : `Voda za ${POKRICE.bunar} ljudi`
              : zgrada.id === "mlin"
                ? zakljucan
                  ? zakljucan
                  : lv > 0
                    ? `Voda ${lv * POKRICE.mlin} · kolo +${(lv * MLIN_ENERGIJA).toFixed(1)} energije / ${tickSec}s`
                    : `Voda za ${POKRICE.mlin} ljudi · kolo`
              : zgrada.id === "cisterna"
                ? zakljucan
                  ? zakljucan
                  : lv > 0
                    ? `Kiša ${lv * POKRICE.cisterna} · krov hvata`
                    : `Kiša za ${POKRICE.cisterna} ljudi. Bez krova prazna.`
              : zgrada.id === "lov" || zgrada.id === "mesnica" || zgrada.id === "pekara"
                ? zakljucan
                  ? zakljucan
                  : lv > 0
                    ? `Hrana ${lv * POKRICE[zgrada.id]}`
                    : `Hrana za ${POKRICE[zgrada.id]} ljudi`
                : zgrada.id === "ured"
                  ? lv > 0
                    ? `Red ${Math.min(ljudiN, lv * POKRICE.ured)}/${ljudiN || 0} · šerif čuva ulicu`
                    : `Red za ${POKRICE.ured} ljudi`
                : zgrada.id === "staja"
                  ? zakljucan
                    ? zakljucan
                    : lv > 0
                      ? `Konji ${kauba.konjiBroj}/${kauba.konjiKap} · staja ${lv * POKRICE.staja}`
                      : `Staja za ${POKRICE.staja} konja. Pravi kauboji jašu.`
                : zgrada.id === "korali"
                  ? zakljucan
                    ? zakljucan
                    : lv > 0
                      ? `Korali ${lv * POKRICE.korali} · ${kauba.konjiBroj}/${kauba.konjiKap} konja`
                      : `Korali za ${POKRICE.korali} konja. Ograda uz staju.`
                : zgrada.id === "staza"
                  ? zakljucan
                    ? zakljucan
                    : lv > 0
                      ? `Staza ${lv * POKRICE.staza} · ${kauba.konjiBroj}/${kauba.konjiKap} konja`
                      : `Staza za ${POKRICE.staza} konja. Prašina i ulog.`
                : zgrada.id === "farma"
                  ? zakljucan
                    ? zakljucan
                    : lv > 0
                      ? `Hrana ${lv * POKRICE.farma} · žito pije iz bunara`
                      : `Hrana za ${POKRICE.farma} ljudi. Bez bunara žito vene.`
                : zgrada.id === "tor"
                  ? zakljucan
                    ? zakljucan
                    : lv > 0
                      ? `Krdo ${kauba.govedaBroj}/${kauba.govedaKap} · firma u toru`
                      : `Tor za ${POKRICE.tor} grla. Prvo farma. Koža je tijesna.`
                : zgrada.id === "ordinacija"
                  ? zakljucan
                    ? zakljucan
                    : lv > 0
                      ? `Liječi ${Math.min(ljudiN, lv * POKRICE.ordinacija)}/${ljudiN || 0}${ljudiN < 10 ? " · tabor još diše" : ""}`
                      : `Ordinacija za ${POKRICE.ordinacija} ljudi. Rana ne čeka.`
                : zgrada.id === "travar"
                  ? zakljucan
                    ? zakljucan
                    : lv > 0
                      ? `Trava ${lv * POKRICE.travar} · raste uz žito`
                      : `Trava za ${POKRICE.travar} ljudi. Bez farme vene.`
                : zgrada.id === "banja"
                  ? zakljucan
                    ? zakljucan
                    : lv > 0
                      ? `Kupelj ${lv * POKRICE.banja} · pije bunar`
                      : `Kupelj za ${POKRICE.banja} ljudi. Prvo bunar ili cisternu.`
                : zgrada.id === "trgovina"
                  ? zakljucan
                    ? zakljucan
                    : lv > 0
                      ? `Posao ${lv * POKRICE.posao} · Šime prodaje zalihu`
                      : `Posao za ${POKRICE.posao} ljudi. Trgovina u kaubi.`
                : zgrada.id === "banka"
                  ? zakljucan
                    ? zakljucan
                    : lv > 0
                      ? `Sef ${bankaKap(lv)} · kamata. Pohod ne dira sef.`
                      : "Sef za zlato. Šerif čuva banku."
                : lv > 0
                  ? `+${trenutnaProizvodnja} / ${tickSec}s · ${kauba.zaposleni}/${kauba.poslovi} rade`
                  : "Nema posla dok ne sagradiš";

  return (
    <article
      id={`zgrada-${zgrada.id}`}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-panel shadow-panel",
        !compact && "mb-2.5 scroll-mt-4",
        compact && "mb-2 pl-16 scroll-mt-4",
        jeOstecena && "border-ruby/50",
        slavlje && "zgrada-slavlje",
      )}
      style={
        jeOstecena
          ? undefined
          : {
              borderColor: `${skinBoja}55`,
              boxShadow: jeMax ? `0 0 0 1px ${skinBoja}66` : undefined,
            }
      }
    >
      {compact ? (
        <div className="absolute left-0 top-0 h-full w-16 overflow-hidden" aria-hidden>
          <img
            src={artSrc(ZGRADA_ART[zgrada.id] ?? ZGRADA_ART.pilana)}
            alt=""
            draggable={false}
            decoding="async"
            loading="lazy"
            className="size-full object-cover object-center"
            style={{ filter: skin.id === "default" ? undefined : skin.nijansa }}
            onError={(e) => {
              const el = e.currentTarget;
              const src = ZGRADA_ART[zgrada.id] ?? ZGRADA_ART.pilana;
              const bare = src.split("?")[0];
              if (!el.dataset.retried) {
                el.dataset.retried = "1";
                el.src = bare;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-panel" />
        </div>
      ) : (
      <div className="relative h-24 overflow-hidden" aria-hidden>
        <img
          src={artSrc(ZGRADA_ART[zgrada.id] ?? ZGRADA_ART.pilana)}
          alt=""
          draggable={false}
          decoding="async"
          loading="lazy"
          className="size-full object-cover object-center"
          style={{ filter: skin.id === "default" ? undefined : skin.nijansa }}
          onError={(e) => {
            const el = e.currentTarget;
            const src = ZGRADA_ART[zgrada.id] ?? ZGRADA_ART.pilana;
            const bare = src.split("?")[0];
            if (!el.dataset.retried) {
              el.dataset.retried = "1";
              el.src = bare;
            }
          }}
        />
        {skin.id !== "default" ? (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: skinBoja, mixBlendMode: "color", opacity: skin.koprena }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
        {slavlje && <span className="zgrada-slavlje-veil" />}
        {radiOvdje && posao && (
          <GradnjaScena
            kompaktna
            majstor={ljudi.concat(segrti).find((p) => p.id === posao.majstorId) ?? null}
            segrti={segrti.filter((p) => !p.spreman)}
            start={posao.start}
            kraj={posao.kraj}
            rec={`${posao.majstorIme} diže`}
          />
        )}
      </div>
      )}
      <div className="relative p-4 pt-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className={cn("text-base font-bold", jeOstecena ? "text-ruby" : "text-ink")}>
            {zgrada.naziv}
            {jeOstecena ? " · gori" : ""}
          </h3>
          <span className="rounded-sm bg-ink/5 px-2.5 py-1 text-[11px] font-bold tabular-nums text-dim">
            LVL {lv}/{zgrada.maxLv}
          </span>
        </div>
        {unutra.length > 0 && (
          <div className="mb-2 flex items-center gap-1.5">
            <ul className="flex -space-x-1.5">
              {unutra.slice(0, 5).map((p) => (
                <li key={p.id} className="kauba-chip-avatar size-8 ring-1 ring-panel" title={p.ime}>
                  <LikAvatar p={p} mood="mir" />
                </li>
              ))}
            </ul>
            <p className="min-w-0 text-[11px] font-bold text-dim">
              {unutra.length === 1
                ? `${unutra[0]!.ime} unutra`
                : unutra.length <= 5
                  ? `${unutra.map((p) => p.ime).join(", ")} unutra`
                  : `${unutra.slice(0, 2).map((p) => p.ime).join(", ")} i još ${unutra.length - 2} unutra`}
            </p>
          </div>
        )}
        <p className={cn("mb-3 text-xs font-semibold", jeOstecena ? "text-ruby" : "text-xp")}>
          {jeOstecena
            ? "U PLAMENU. Stalo."
            : radiOvdje
              ? `${posao?.majstorIme} diže razinu ${posao?.ciljLv}.`
              : efekt}
        </p>
        {radiOvdje && (
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-void">
            <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
          {jeOstecena ? (
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-sm bg-ruby px-1.5 py-1 text-[10px] font-bold text-ink">
                <AlertTriangle className="size-3.5" />
                POPRAVAK
              </span>
              <PrikazCijene src={RESURS_ART.zlato} iznos={cPopravak.zlato} trenutno={zlato} />
              <PrikazCijene src={RESURS_ART.drvo} iznos={cPopravak.drvo} trenutno={resursi.drvo} />
            </div>
          ) : !jeMax ? (
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <PrikazCijene src={RESURS_ART.zlato} iznos={c.zlato} trenutno={zlato} />
              <PrikazCijene src={RESURS_ART.drvo} iznos={c.drvo} trenutno={resursi.drvo} />
              <PrikazCijene src={RESURS_ART.kamen} iznos={c.kamen} trenutno={resursi.kamen} />
              <PrikazCijene src={RESURS_ART.zeljezo} iznos={c.zeljezo} trenutno={resursi.zeljezo} />
            </div>
          ) : (
            <p className="text-xs font-bold tracking-wide text-gold">MAKSIMALNA RAZINA</p>
          )}

          {jeOstecena ? (
            <button
              type="button"
              onClick={() => popraviZgradu(zgrada)}
              className={cn(
                "min-h-11 rounded-lg px-5 py-3 text-xs font-bold tracking-wide transition-transform duration-150 ease-out active:scale-[0.96]",
                mozePopraviti ? "bg-ruby text-ink" : "bg-panel-2 text-dim",
              )}
            >
              POPRAVI
            </button>
          ) : zakljucan ? (
            <button type="button" disabled className="min-h-11 rounded-lg bg-panel-2 px-5 py-3 text-xs font-bold text-dim">
              ZAKLJUČANO
            </button>
          ) : (
            !jeMax && (
              <button
                type="button"
                disabled={zauzet || radiOvdje}
                onClick={() => nadogradiZgradu(zgrada)}
                className="min-h-11 rounded-lg px-5 py-3 text-xs font-bold tracking-wide text-void transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-60"
                style={{
                  backgroundColor: radiOvdje || zauzet ? "var(--color-panel-2)" : mozeKupiti ? skinBoja : "var(--color-panel-2)",
                  color: radiOvdje || zauzet || !mozeKupiti ? "var(--color-dim)" : "#000",
                }}
              >
                {radiOvdje
                  ? `${ostaloSec}s`
                  : zauzet
                    ? "Svi grade"
                    : lv === 0
                      ? "IZGRADI"
                      : "NADOGRADI"}
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
});
