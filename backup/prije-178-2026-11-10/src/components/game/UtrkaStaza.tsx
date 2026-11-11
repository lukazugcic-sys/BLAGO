import { useMemo, useRef, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { ART } from "@/lib/game/art";
import { playSfx, vibrate } from "@/lib/game/audio";
import { FARO_MIN } from "@/lib/game/tuning";
import { trciUtrku, utrkaIsplata, utrkaMjesto, type UtrkaKonj } from "@/lib/game/utrka";
import { KonjSilueta } from "./KonjSilueta";
import { cn } from "@/lib/utils";

const CIP = [10, 25, 50, 100] as const;

const PRAZNI: UtrkaKonj[] = [
  { id: "tvoj", ime: "Tvoj", tvoj: true, boja: "#c4783a", brzina: 1 },
  { id: "crni", ime: "Crni", tvoj: false, boja: "#1c1410", brzina: 1 },
  { id: "ridi", ime: "Riđi", tvoj: false, boja: "#8a3a14", brzina: 1 },
  { id: "sivi", ime: "Sivi", tvoj: false, boja: "#6a5a48", brzina: 1 },
];

export function UtrkaStaza() {
  const staza = useGameStore((s) => s.gradevine.staza || 0);
  const gori = useGameStore((s) => s.ostecenja.staza);
  const konjiBroj = useGameStore((s) => s.konjiBroj);
  const jahanje = useGameStore((s) => s.konjiDuznost.jahanje);
  const sijenoDo = useGameStore((s) => s.sijenoDo);
  const zlato = useGameStore((s) => Math.floor(s.zlato));
  const [ulogRaw, setUlogRaw] = useState(10);
  const [faza, setFaza] = useState<"ulog" | "trci" | "kraj">("ulog");
  const [red, setRed] = useState<UtrkaKonj[] | null>(null);
  const [pobjednik, setPobjednik] = useState<UtrkaKonj | null>(null);
  const lock = useRef(false);
  const startni = useMemo(() => red ?? PRAZNI, [red]);
  const maxUlog = Math.max(0, zlato);
  const ulogSad = Math.min(maxUlog, Math.max(faza === "ulog" ? FARO_MIN : 0, ulogRaw));
  const sijeno = sijenoDo > Date.now();
  const dobit = utrkaIsplata(ulogSad, 1);
  const drugi = utrkaIsplata(ulogSad, 2);
  const maxB = pobjednik?.brzina ?? 1;

  if (staza < 1 || gori || konjiBroj < 1) return null;

  const kreni = () => {
    if (lock.current || faza !== "ulog") return;
    if (ulogSad < FARO_MIN || zlato < ulogSad) {
      useGameStore.getState().setPoruka("NEDOVOLJNO ZLATA");
      playSfx("skull");
      return;
    }
    lock.current = true;
    const u = ulogSad;
    useGameStore.setState((s) => ({
      zlato: s.zlato - u,
      poruka: "Kopita. Prašina. Staza.",
    }));
    useGameStore.getState().azurirajMisiju("utrka");
    const r = trciUtrku({ jahanje, sijeno, stazaLv: staza });
    setRed(r.red);
    setPobjednik(r.pobjednik);
    setFaza("trci");
    playSfx("attack");
    const maxMs = 2380;
    window.setTimeout(() => {
      const mjesto = utrkaMjesto(r.red);
      const nagrada = utrkaIsplata(u, mjesto);
      if (mjesto === 1) {
        playSfx("win");
        vibrate(28);
        useGameStore.setState((s) => ({
          zlato: s.zlato + nagrada,
          poruka: `Tvoj prvi. +${nagrada - u} zlata.`,
        }));
        useGameStore.getState().azurirajMisiju("zlato", nagrada - u);
      } else if (mjesto === 2) {
        playSfx("button");
        useGameStore.setState((s) => ({
          zlato: s.zlato + nagrada,
          poruka: `Drugi. Ulog se vratio.`,
        }));
      } else {
        playSfx("skull");
        useGameStore.setState({ poruka: `${r.pobjednik.ime} prvi. Tvoj jede prašinu.` });
      }
      setFaza("kraj");
      lock.current = false;
    }, maxMs + 180);
  };

  const opet = () => {
    if (lock.current) return;
    setFaza("ulog");
    setRed(null);
    setPobjednik(null);
    playSfx("button");
  };

  return (
    <article className="mb-2 overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="relative h-24 overflow-hidden" aria-hidden>
        <img src={ART.stazaUtrka} alt="" className="size-full object-cover object-[center_60%]" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
      </div>
      <div className="p-3 pt-1">
        <div className="mb-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Staza</p>
            <p className="text-[12px] font-bold text-ink/80">
              {faza === "trci"
                ? "Jašu. Prašina stoji."
                : faza === "kraj" && pobjednik
                  ? pobjednik.tvoj
                    ? "Tvoj prvi. Uzmi vreću."
                    : red && utrkaMjesto(red) === 2
                      ? "Drugi. Ulog stoji."
                      : `${pobjednik.ime} prvi.`
                  : `Četiri grla. Jahanje nosi, staza uči. Ulog ${ulogSad}. Prvi ${dobit}, drugi ${drugi}.`}
            </p>
          </div>
          {faza === "kraj" && (
            <button type="button" onClick={opet} className="min-h-9 rounded-full bg-gold px-3 text-[11px] font-bold text-void">
              OPET
            </button>
          )}
        </div>

        <div className="utrka-scena relative mb-3 overflow-hidden rounded-xl border border-line">
          <img src={ART.stazaUtrka} alt="" className="utrka-tlo" draggable={false} />
          <div className="utrka-prasina" aria-hidden />
          <ul className="utrka-trake">
            {startni.map((k) => {
              const udio = maxB > 0 ? k.brzina / maxB : 1;
              const ms = faza === "trci" || faza === "kraj" ? 2200 : 0;
              return (
                <li key={k.id} className="utrka-traka">
                  <span className="utrka-ime">{k.ime}</span>
                  <span
                    className={cn(
                      "utrka-konj",
                      (faza === "trci" || faza === "kraj") && "utrka-konj-trci",
                      faza === "kraj" && pobjednik?.id === k.id && "utrka-konj-prvi",
                    )}
                    style={{
                      color: k.boja,
                      animationDuration: ms ? `${ms}ms` : undefined,
                      ["--cilj" as string]: `${(udio * 11).toFixed(2)}rem`,
                    }}
                  >
                    <KonjSilueta boja={k.boja} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {faza === "ulog" && (
          <>
            <UlogTraka ulog={ulogSad} max={maxUlog} onUlog={setUlogRaw} />
            <button
              type="button"
              disabled={ulogSad < FARO_MIN || zlato < ulogSad}
              onClick={kreni}
              className="mt-2 min-h-11 w-full rounded-xl bg-gold text-xs font-bold tracking-widest text-void uppercase disabled:bg-panel-2 disabled:text-dim"
            >
              Jaši · {ulogSad}g
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export function UlogTraka({
  ulog,
  max,
  onUlog,
  disabled,
}: {
  ulog: number;
  max: number;
  onUlog: (n: number) => void;
  disabled?: boolean;
}) {
  const stavi = (n: number) => {
    playSfx("button");
    onUlog(Math.max(FARO_MIN, Math.min(max, Math.floor(n))));
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1">
        {CIP.map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled || max < n}
            onClick={() => stavi(n)}
            className={cn(
              "min-h-9 min-w-11 rounded-full px-2.5 text-[11px] font-bold tabular-nums",
              ulog === n ? "bg-gold text-void" : "border border-line bg-panel-2 text-dim",
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled || max < 2}
          onClick={() => stavi(Math.max(FARO_MIN, Math.floor(max / 2)))}
          className="min-h-9 rounded-full border border-line bg-panel-2 px-2.5 text-[11px] font-bold text-dim"
        >
          Pola
        </button>
        <button
          type="button"
          disabled={disabled || max < FARO_MIN}
          onClick={() => stavi(max)}
          className="min-h-9 rounded-full bg-ruby px-2.5 text-[11px] font-bold tracking-wide text-ink uppercase"
        >
          Sve
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || ulog <= FARO_MIN}
          onClick={() => stavi(ulog - 1)}
          className="min-h-9 min-w-9 rounded-full border border-line bg-panel-2 text-sm font-bold text-ink disabled:text-dim"
        >
          −
        </button>
        <span className="min-w-16 flex-1 text-center text-sm font-bold tabular-nums text-gold">{ulog}g</span>
        <button
          type="button"
          disabled={disabled || ulog >= max}
          onClick={() => stavi(ulog + 1)}
          className="min-h-9 min-w-9 rounded-full bg-gold text-sm font-bold text-void disabled:bg-panel-2 disabled:text-dim"
        >
          +
        </button>
      </div>
    </div>
  );
}
