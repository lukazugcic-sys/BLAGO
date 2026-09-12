import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { ZGRADA_ART } from "@/lib/game/art";
import { playSfx, vibrate } from "@/lib/game/audio";
import { FARO_MIN, FARO_ULOG } from "@/lib/game/tuning";
import {
  bjIshod,
  bjIsplata,
  bjRec,
  dealerVuče,
  jeBlackjack,
  kartaBod,
  kartaCrvena,
  kartaZnak,
  novaKarta,
  rukaBod,
  type BjIshod,
  type BjKarta,
} from "@/lib/game/blackjack";
import { UlogTraka } from "./UtrkaStaza";
import { cn } from "@/lib/utils";
import { jeSideOtkljucan, SIDE_GATE_REC } from "@/lib/game/sideGate";

type Faza = "ulog" | "igra" | "banka" | "kraj";

function Karta({ k, otvorena, delay }: { k?: BjKarta; otvorena: boolean; delay?: number }) {
  return (
    <div
      className={cn("faro-karta bj-karta", otvorena && "faro-otvorena")}
      style={{ animationDelay: `${delay ?? 0}ms` }}
    >
      <span className="faro-unutra">
        <span className="faro-ledja">
          <span className="faro-ledja-uzorak" />
        </span>
        <span className="faro-lice" style={{ color: k && kartaCrvena(k) ? "#8a2030" : "#1a120c" }}>
          {k ? kartaZnak(k) : ""}
        </span>
      </span>
    </div>
  );
}

export function IgraBlackjack() {
  const zlato = useGameStore((s) => Math.floor(s.zlato));
  const salun = useGameStore((s) => s.gradevine.salun || 0);
  const karteLv = useGameStore((s) => s.gradevine.karte || 0);
  const [ulogRaw, setUlogRaw] = useState(FARO_ULOG);
  const [faza, setFaza] = useState<Faza>("ulog");
  const [ulog, setUlog] = useState(FARO_ULOG);
  const [igrac, setIgrac] = useState<BjKarta[]>([]);
  const [dealer, setDealer] = useState<BjKarta[]>([]);
  const [ishod, setIshod] = useState<BjIshod | null>(null);
  const [duplo, setDuplo] = useState(false);
  const timer = useRef(0);
  const maxUlog = Math.max(0, zlato);
  const ulogSad = Math.min(maxUlog, Math.max(faza === "ulog" ? FARO_MIN : 0, ulogRaw));
  const otvorenDealer = faza === "kraj" || faza === "banka";
  const igracN = rukaBod(igrac);
  const dealerN = rukaBod(dealer);
  const mozeDuplo = faza === "igra" && igrac.length === 2 && !duplo && zlato >= ulog;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const plati = (karteI: BjKarta[], karteD: BjKarta[], u: number) => {
    const i = bjIshod(karteI, karteD);
    const nagrada = bjIsplata(u, i, karteLv);
    setIshod(i);
    setDealer(karteD);
    setIgrac(karteI);
    setFaza("kraj");
    if (i === "poraz") {
      playSfx("skull");
      useGameStore.setState({ poruka: bjRec(i, rukaBod(karteI), rukaBod(karteD)) });
      return;
    }
    playSfx(i === "push" ? "button" : "win");
    if (i !== "push") vibrate(24);
    useGameStore.setState((s) => ({
      zlato: s.zlato + nagrada,
      poruka: bjRec(i, rukaBod(karteI), rukaBod(karteD)),
    }));
    if (nagrada > u) useGameStore.getState().azurirajMisiju("zlato", nagrada - u);
  };

  const otkrijBanku = (karteI: BjKarta[], startD: BjKarta[], u: number) => {
    window.clearTimeout(timer.current);
    const finalD = dealerVuče(startD);
    setDealer(startD);
    setIgrac(karteI);
    setFaza("banka");
    let i = startD.length;
    const tick = () => {
      if (i >= finalD.length) {
        plati(karteI, finalD, u);
        return;
      }
      setDealer(finalD.slice(0, i + 1));
      playSfx("button");
      i += 1;
      timer.current = window.setTimeout(tick, 300);
    };
    timer.current = window.setTimeout(tick, 260);
  };

  const dijeli = () => {
    if (faza !== "ulog") return;
    if (!jeSideOtkljucan(useGameStore.getState().gradevine)) {
      useGameStore.getState().setPoruka(SIDE_GATE_REC);
      return;
    }
    if (salun < 1) {
      useGameStore.getState().setPoruka("PRVO SALUN");
      return;
    }
    const u = Math.min(Math.floor(useGameStore.getState().zlato), Math.max(FARO_MIN, Math.floor(ulogRaw)));
    if (u < FARO_MIN) {
      useGameStore.getState().setPoruka("NEDOVOLJNO ZLATA");
      playSfx("skull");
      return;
    }
    useGameStore.setState((s) => ({ zlato: s.zlato - u, poruka: "Karte idu." }));
    useGameStore.getState().azurirajMisiju("dvadesetjedan");
    const ja = [novaKarta(), novaKarta()];
    const on = [novaKarta(), novaKarta()];
    setUlog(u);
    setUlogRaw(u);
    setIgrac(ja);
    setDealer(on);
    setIshod(null);
    setDuplo(false);
    playSfx("spin");
    if (jeBlackjack(ja) || jeBlackjack(on)) {
      window.setTimeout(() => plati(ja, on, u), 420);
      return;
    }
    setFaza("igra");
  };

  const vuci = () => {
    if (faza !== "igra") return;
    const ja = [...igrac, novaKarta()];
    setIgrac(ja);
    playSfx("button");
    if (rukaBod(ja) > 21) {
      plati(ja, dealer, ulog);
    } else if (rukaBod(ja) === 21) {
      otkrijBanku(ja, dealer, ulog);
    }
  };

  const stoji = () => {
    if (faza !== "igra") return;
    otkrijBanku(igrac, dealer, ulog);
  };

  const naDuplo = () => {
    if (!mozeDuplo) return;
    const s = useGameStore.getState();
    if (s.zlato < ulog) {
      s.setPoruka("NEDOVOLJNO ZLATA");
      return;
    }
    useGameStore.setState({ zlato: s.zlato - ulog, poruka: "Duplo. Jedna karta." });
    const u = ulog * 2;
    setUlog(u);
    setDuplo(true);
    const ja = [...igrac, novaKarta()];
    setIgrac(ja);
    playSfx("spin");
    otkrijBanku(ja, dealer, u);
  };

  const opet = () => {
    if (faza === "banka") return;
    window.clearTimeout(timer.current);
    setFaza("ulog");
    setIgrac([]);
    setDealer([]);
    setIshod(null);
    setDuplo(false);
    playSfx("button");
  };

  return (
    <article className="mb-2.5 overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="relative h-16 overflow-hidden" aria-hidden>
        <img src={ZGRADA_ART.salun} alt="" className="size-full object-cover object-[center_40%]" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
      </div>
      <div className="p-4 pt-2">
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold tracking-widest text-gold uppercase">Blackjack</h3>
            <p className="mt-0.5 text-xs font-semibold text-dim">
              {salun < 1
                ? "Otvori salun pa igraj."
                : faza === "igra"
                  ? `Ti ${igracN}. Vuči ili stoji.`
                  : faza === "banka"
                    ? "Banka vuče."
                    : faza === "kraj" && ishod
                      ? bjRec(ishod, igracN, dealerN)
                      : `Bliže 21. Ulog ${ulogSad}. As i lice — banka plaća više.`}
            </p>
          </div>
          {faza === "kraj" && (
            <button type="button" onClick={opet} className="min-h-9 rounded-full bg-gold px-3 text-[11px] font-bold text-void">
              OPET
            </button>
          )}
        </div>

        {(faza === "igra" || faza === "banka" || faza === "kraj") && (
          <div className="bj-stol mb-3">
            <div className="bj-ruka">
              <p className="bj-natpis">Banka {otvorenDealer ? dealerN : kartaBod(dealer[0]?.r ?? 0)}</p>
              <div className="bj-red">
                {dealer.map((k, i) => (
                  <Karta key={`d-${i}`} k={k} otvorena={otvorenDealer || i === 0} delay={i * 70} />
                ))}
              </div>
            </div>
            <div className="bj-ruka">
              <p className="bj-natpis">Ti {igracN}</p>
              <div className="bj-red">
                {igrac.map((k, i) => (
                  <Karta key={`i-${i}`} k={k} otvorena delay={80 + i * 70} />
                ))}
              </div>
            </div>
          </div>
        )}

        {faza === "ulog" && salun >= 1 && (
          <div className="mb-3">
            <UlogTraka ulog={ulogSad} max={maxUlog} onUlog={setUlogRaw} />
          </div>
        )}

        {faza === "ulog" && (
          <button
            type="button"
            disabled={salun < 1 || ulogSad < FARO_MIN}
            onClick={dijeli}
            className="min-h-11 w-full rounded-xl bg-gold text-xs font-bold tracking-widest text-void uppercase disabled:bg-panel-2 disabled:text-dim"
          >
            Dijeli · {ulogSad}g
          </button>
        )}

        {faza === "igra" && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={vuci}
              className="min-h-11 flex-1 rounded-xl bg-gold text-xs font-bold tracking-widest text-void uppercase"
            >
              Vuči
            </button>
            <button
              type="button"
              onClick={stoji}
              className="min-h-11 flex-1 rounded-xl border border-line bg-panel-2 text-xs font-bold tracking-widest text-ink uppercase"
            >
              Stoji
            </button>
            <button
              type="button"
              disabled={!mozeDuplo}
              onClick={naDuplo}
              className="min-h-11 flex-1 rounded-xl border border-line bg-panel-2 text-xs font-bold tracking-widest text-ink uppercase disabled:text-dim"
            >
              Duplo
            </button>
          </div>
        )}

        {faza === "kraj" && ishod === "bj" && <p className="faro-pobjeda mt-3 text-center text-sm font-bold text-xp">Blackjack.</p>}
        {faza === "kraj" && ishod === "pobjeda" && <p className="faro-pobjeda mt-3 text-center text-sm font-bold text-xp">Tvoje.</p>}
        {faza === "kraj" && ishod === "push" && <p className="faro-pobjeda mt-3 text-center text-sm font-bold text-gold">Ulog stoji.</p>}
        {faza === "kraj" && ishod === "poraz" && <p className="faro-pobjeda mt-3 text-center text-sm font-bold text-ruby">Banka uzima.</p>}
      </div>
    </article>
  );
}
