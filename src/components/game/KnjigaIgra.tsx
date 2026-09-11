import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { useSlotMachine } from "@/lib/hooks/useSlotMachine";
import { BLAGO } from "@/lib/game/constants";
import { ART } from "@/lib/game/art";
import { EXPAND_ZNAKOVI, izaberiExpand } from "@/lib/game/knjiga";
import { NagradaPikseli } from "./NagradaPikseli";
import { SlotSymbol } from "./SlotSymbol";
import { playSfx, vibrate } from "@/lib/game/audio";
import { flash, hitstop, shake } from "@/lib/context/UIContext";
import { cn } from "@/lib/utils";
import type { SimbolId } from "@/lib/game/types";

const MOTE = [
  { x: "14%", y: "18%", d: "0s", s: 2 },
  { x: "78%", y: "14%", d: "0.5s", s: 3 },
  { x: "22%", y: "62%", d: "1.1s", s: 2 },
  { x: "86%", y: "48%", d: "0.2s", s: 2 },
  { x: "8%", y: "38%", d: "1.6s", s: 3 },
  { x: "68%", y: "72%", d: "0.8s", s: 2 },
  { x: "48%", y: "8%", d: "1.3s", s: 2 },
  { x: "92%", y: "28%", d: "1.9s", s: 3 },
  { x: "36%", y: "82%", d: "0.4s", s: 2 },
  { x: "58%", y: "36%", d: "2.1s", s: 2 },
] as const;

const BURST = [
  { dx: "-42px", dy: "-58px" },
  { dx: "38px", dy: "-52px" },
  { dx: "-58px", dy: "8px" },
  { dx: "62px", dy: "12px" },
  { dx: "-28px", dy: "48px" },
  { dx: "24px", dy: "54px" },
  { dx: "0px", dy: "-64px" },
  { dx: "48px", dy: "-18px" },
] as const;

export function KnjigaIgra() {
  const faza = useSlotStore((s) => s.knjigaFaza);
  const lonac = useSlotStore((s) => s.knjigaLonac);
  const pending = useSlotStore((s) => s.dobitakNaCekanju);
  const ostalo = useGameStore((s) => s.besplatneVrtnje);
  const expand = useGameStore((s) => s.besplatneExpand);
  const { kreniKnjigu, zatvoriKnjigu, zavrtiMasinu } = useSlotMachine();
  const [pokaz, setPokaz] = useState<SimbolId>("gold");
  const [pecat, setPecat] = useState(false);
  const [otvorena, setOtvorena] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    if (faza === "uvod") {
      setPecat(false);
      setOtvorena(false);
      lock.current = false;
      const open = window.setTimeout(() => setOtvorena(true), 70);
      const cilj = izaberiExpand();
      let i = 0;
      let ms = 90;
      let id = 0;
      const tick = () => {
        if (lock.current) return;
        i = (i + 1) % EXPAND_ZNAKOVI.length;
        setPokaz(EXPAND_ZNAKOVI[i] ?? "gold");
        if (ms < 200) ms += 10;
        id = window.setTimeout(tick, ms);
      };
      id = window.setTimeout(tick, 420);
      const pecati = window.setTimeout(() => {
        if (lock.current) return;
        lock.current = true;
        setPokaz(cilj);
        setPecat(true);
        playSfx("jackpot");
        vibrate(28);
        hitstop(80, "slot");
        flash("rgba(232, 176, 74, 0.32)", "slot");
        shake("soft", "slot");
        window.setTimeout(() => {
          kreniKnjigu(cilj);
          window.setTimeout(() => void zavrtiMasinu(), 90);
        }, 580);
      }, 1680);
      return () => {
        window.clearTimeout(open);
        window.clearTimeout(id);
        window.clearTimeout(pecati);
      };
    }
    if (faza === "kraj") {
      setOtvorena(true);
      setPecat(false);
    }
  }, [faza, kreniKnjigu, zavrtiMasinu]);

  if (!faza || faza === "igra") return null;
  if (faza === "uvod" && pending) return null;

  const znak: SimbolId = pecat ? (pokaz ?? "gold") : (expand ?? pokaz ?? "gold");
  const meta = BLAGO[znak];

  return (
    <div
      className={cn(
        "knjiga-ulaz",
        faza === "kraj" && "knjiga-ulaz-kraj",
        pecat && "knjiga-ulaz-pecat",
      )}
      role="dialog"
      aria-label="Knjiga"
    >
      <span className="knjiga-zrak" aria-hidden />
      <span className="knjiga-prasina" aria-hidden />
      {MOTE.map((m, i) => (
        <span
          key={i}
          className="knjiga-mota"
          aria-hidden
          style={{
            left: m.x,
            top: m.y,
            width: m.s,
            height: m.s,
            animationDelay: m.d,
          }}
        />
      ))}
      <div className="knjiga-scena">
        <div
          className={cn(
            "knjiga-tijelo",
            otvorena && "je-otvorena",
            pecat && "je-pecat",
            faza === "kraj" && "je-kraj",
          )}
        >
          <div className="knjiga-korice knjiga-korice-l" aria-hidden>
            <div
              className="knjiga-korice-van"
              style={{ backgroundImage: `url(${ART.knjigaKorice})` }}
            />
            <div className="knjiga-korice-nut" />
          </div>
          <div
            className="knjiga-stranica"
            style={{ backgroundImage: `url(${ART.knjigaList})` }}
          >
            <span className="knjiga-gutter" aria-hidden />
            {faza === "uvod" ? (
              <>
                <p className="knjiga-natpis knjiga-stagger" style={{ ["--i" as string]: 0 }}>
                  Pet znački u prašini
                </p>
                <h2 className="knjiga-naslov knjiga-stagger" style={{ ["--i" as string]: 1 }}>
                  ZNAK SE ŠIRI
                </h2>
                <div className="knjiga-heroj knjiga-stagger" style={{ ["--i" as string]: 2 }}>
                  <SlotSymbol id={znak} win={pecat} />
                  <span className="knjiga-heroj-sjaj" aria-hidden />
                  {pecat && (
                    <>
                      <span className="knjiga-pecat-prsten" aria-hidden />
                      {BURST.map((b, i) => (
                        <span
                          key={i}
                          className="knjiga-burst"
                          aria-hidden
                          style={{ ["--dx" as string]: b.dx, ["--dy" as string]: b.dy }}
                        />
                      ))}
                    </>
                  )}
                </div>
                <div className="knjiga-kotač knjiga-stagger" style={{ ["--i" as string]: 3 }}>
                  {EXPAND_ZNAKOVI.map((id) => (
                    <div
                      key={id}
                      className={cn(
                        "knjiga-znak",
                        znak === id && "knjiga-znak-sad",
                        pecat && znak === id && "knjiga-znak-pecat",
                      )}
                    >
                      <SlotSymbol id={id} win={pecat && znak === id} />
                    </div>
                  ))}
                </div>
                <p className="knjiga-rec knjiga-stagger" style={{ ["--i" as string]: 4 }}>
                  {pecat
                    ? `Znak se širi niz stup. ${ostalo} vrtnji.`
                    : `${ostalo} vrtnji. Znak pada sam.`}
                </p>
                <p className="knjiga-gumb knjiga-stagger opacity-80" style={{ ["--i" as string]: 5 }}>
                  {pecat ? "PEČAT" : "BIRA SE"}
                </p>
              </>
            ) : (
              <>
                <p className="knjiga-natpis knjiga-stagger" style={{ ["--i" as string]: 0 }}>
                  Knjiga se zatvara
                </p>
                <h2 className="knjiga-naslov knjiga-stagger" style={{ ["--i" as string]: 1 }}>
                  PLIJEN U TORBI
                </h2>
                {expand && (
                  <div className="knjiga-heroj knjiga-heroj-kraj knjiga-stagger" style={{ ["--i" as string]: 2 }}>
                    <SlotSymbol id={expand} win />
                  </div>
                )}
                <div className="knjiga-lonac knjiga-stagger" style={{ ["--i" as string]: 3 }}>
                  <NagradaPikseli nagrada={lonac} />
                </div>
                <p className="knjiga-rec knjiga-stagger" style={{ ["--i" as string]: 4 }}>
                  Prašina sjele. Kolo čeka.
                </p>
                <button
                  type="button"
                  className="knjiga-gumb knjiga-gumb-dalje knjiga-stagger"
                  style={{ ["--i" as string]: 5 }}
                  onClick={zatvoriKnjigu}
                >
                  DALJE
                </button>
              </>
            )}
            <p className="knjiga-stopa" style={{ color: meta.boja }}>
              {faza === "uvod" ? "Korice drže znak." : "Zatvori korice."}
            </p>
          </div>
          <div className="knjiga-korice knjiga-korice-d" aria-hidden>
            <div
              className="knjiga-korice-van"
              style={{ backgroundImage: `url(${ART.knjigaKorice})` }}
            />
            <div className="knjiga-korice-nut" />
          </div>
        </div>
      </div>
    </div>
  );
}
