import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { izgradiMrezu, vezeZa, type MrezaCvor } from "@/lib/game/mreza";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

function krivulja(x1: number, y1: number, x2: number, y2: number, predznak: 1 | -1) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const k = predznak * 0.16;
  return `M ${x1} ${y1} Q ${mx - dy * k} ${my + dx * k} ${x2} ${y2}`;
}

function KvalitetnaTraka({ n }: { n: number }) {
  return (
    <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-void">
      <span
        className={cn("block h-full rounded-full", n >= 50 ? "bg-volt" : n >= 25 ? "bg-gold" : "bg-ruby")}
        style={{ width: `${n}%` }}
      />
    </span>
  );
}

export function MrezaSela() {
  const imeIgraca = useGameStore((s) => s.imeIgraca);
  const gradevine = useGameStore((s) => s.gradevine);
  const ostecenja = useGameStore((s) => s.ostecenja);
  const stitovi = useGameStore((s) => s.stitovi);
  const oklop = useGameStore((s) => s.razine.oklop);
  const klan = useGameStore((s) => s.klan);
  const stavSela = useGameStore((s) => s.stavSela);
  const kronika = useGameStore((s) => s.kronika);
  const igracRazina = useGameStore((s) => s.igracRazina);
  const prestigeRazina = useGameStore((s) => s.prestigeRazina);
  const protokPuls = useGameStore((s) => s.protokPuls);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);

  const { cvorovi, veze } = useMemo(
    () =>
      izgradiMrezu({
        imeIgraca,
        gradevine,
        ostecenja,
        stitovi,
        oklop,
        klan,
        stavSela,
        kronika,
        igracRazina,
        prestigeRazina,
      }),
    [imeIgraca, gradevine, ostecenja, stitovi, oklop, klan, stavSela, kronika, igracRazina, prestigeRazina],
  );

  const [fokus, setFokus] = useState("selo");
  const [smijeTok, setSmijeTok] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSmijeTok(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!cvorovi.some((c) => c.id === fokus)) setFokus("selo");
  }, [cvorovi, fokus]);
  const aktivni = cvorovi.find((c) => c.id === fokus) ?? cvorovi[0]!;
  const { ulaz, izlaz } = vezeZa(aktivni.id, veze);
  const povezani = useMemo(() => {
    const s = new Set<string>([aktivni.id]);
    for (const v of veze) {
      if (v.od === aktivni.id) s.add(v.do);
      if (v.do === aktivni.id) s.add(v.od);
    }
    return s;
  }, [aktivni.id, veze]);

  const odaberi = (c: MrezaCvor) => {
    playSfx("button");
    setFokus(c.id);
    if (c.zgradaId) {
      document.getElementById(`zgrada-${c.zgradaId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const pulsIds = protokPuls?.ids ?? [];

  return (
    <section className="mb-3.5 overflow-hidden rounded-2xl border border-line bg-panel">
      <header className="flex items-center justify-between gap-3 px-3 pt-2.5">
        <h2 className="text-xs font-bold tracking-widest text-dim uppercase">Mreža</h2>
        <p className="text-xs font-bold tabular-nums text-gold">
          {aktivni.naziv}
          <span className="ml-1.5 text-dim">{aktivni.kvaliteta}</span>
        </p>
      </header>

      <div className="flex gap-1 overflow-x-auto px-3 pb-1 pt-2 [scrollbar-width:none]">
        {cvorovi.map((c) => (
          <button
            key={`chip-${c.id}`}
            type="button"
            onClick={() => odaberi(c)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold",
              fokus === c.id ? "border-gold bg-gold/15 text-ink" : "border-line bg-panel-2 text-dim",
            )}
          >
            <img src={c.art} alt="" className="mreza-glyph size-5" draggable={false} />
            {c.naziv}
          </button>
        ))}
      </div>

      <div
        className="relative mx-1 mb-2 aspect-[4/3] overflow-hidden rounded-xl bg-void"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <marker id="mreza-pos" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0 0 L8 4 L0 8 z" className="fill-volt" />
            </marker>
            <marker id="mreza-neg" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0 0 L8 4 L0 8 z" className="fill-ruby" />
            </marker>
          </defs>
          {veze.map((v) => {
            const a = cvorovi.find((c) => c.id === v.od);
            const b = cvorovi.find((c) => c.id === v.do);
            if (!a || !b) return null;
            const ziva = povezani.has(v.od) && povezani.has(v.do);
            const puls = pulsIds.includes(v.id);
            const d = krivulja(a.x, a.y, b.x, b.y, v.predznak);
            return (
              <g key={v.id}>
                <path
                  d={d}
                  className={cn(
                    "mreza-veza",
                    v.predznak > 0 ? "stroke-volt" : "stroke-ruby",
                    ziva && smijeTok && "mreza-veza-tok",
                    puls && smijeTok && "mreza-veza-puls",
                  )}
                  strokeWidth={0.45 + Math.min(1, Math.abs(v.doprinos) / 40) * 1.6}
                  markerEnd={v.predznak > 0 ? "url(#mreza-pos)" : "url(#mreza-neg)"}
                  opacity={ziva ? 0.95 : 0.14}
                />
                {puls && smijeTok && (
                  <circle r="1.2" className={v.predznak > 0 ? "fill-volt" : "fill-ruby"}>
                    <animateMotion dur="0.9s" repeatCount="1" path={d} />
                  </circle>
                )}
              </g>
            );
          })}
          {cvorovi.map((c) => {
            const circ = 2 * Math.PI * 7.2;
            const dash = (c.kvaliteta / 100) * circ;
            const kriza = c.vrsta === "kriza";
            return (
              <circle
                key={`ring-${c.id}`}
                cx={c.x}
                cy={c.y}
                r="7.2"
                fill="none"
                className={
                  kriza
                    ? "stroke-ruby"
                    : c.kvaliteta >= 50
                      ? "stroke-volt"
                      : c.kvaliteta >= 25
                        ? "stroke-gold"
                        : "stroke-ruby"
                }
                strokeWidth="1.3"
                style={{
                  strokeDasharray: `${dash} ${circ}`,
                  transition: "stroke-dasharray 400ms ease, opacity 200ms ease",
                }}
                transform={`rotate(-90 ${c.x} ${c.y})`}
                opacity={povezani.has(c.id) ? 1 : 0.2}
              />
            );
          })}
        </svg>
        {cvorovi.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={fokus === c.id}
            aria-label={`${c.naziv}, kvaliteta ${c.kvaliteta}`}
            onClick={() => odaberi(c)}
            className={cn(
              "mreza-cvor absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-panel-2",
              fokus === c.id && "mreza-cvor-fokus z-10 border-gold",
              fokus !== c.id && "border-line",
              c.vrsta === "kriza" && "mreza-cvor-kriza border-ruby",
            )}
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              opacity: povezani.has(c.id) ? 1 : 0.28,
            }}
          >
            <img src={c.art} alt="" className="mreza-glyph size-6" draggable={false} />
          </button>
        ))}
      </div>

      <div className="border-t border-line px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-ink">{aktivni.naziv}</p>
          <p className="text-xs font-bold tabular-nums text-dim">{aktivni.kvaliteta}</p>
        </div>
        <KvalitetnaTraka n={aktivni.kvaliteta} />
        <ul key={aktivni.id} className="mreza-ispis mt-3 flex flex-col gap-1.5">
          {aktivni.id === "selo" && (
            <li className="flex items-start gap-2 text-xs leading-snug">
              <span className="mt-0.5 w-8 shrink-0 font-bold tabular-nums text-dim">+20</span>
              <span className="text-dim">baza sela</span>
            </li>
          )}
          {izlaz.map((v) => {
            const cilj = cvorovi.find((c) => c.id === v.do);
            const n = Math.round(v.doprinos);
            return (
              <li key={v.id} className="flex items-start gap-2 text-xs leading-snug">
                <span className={cn("mt-0.5 w-8 shrink-0 font-bold tabular-nums", n >= 0 ? "text-volt" : "text-ruby")}>
                  {n >= 0 ? `+${n}` : `${n}`}
                </span>
                <span className="text-dim">
                  <span className="font-bold text-ink">{cilj?.naziv}</span>
                  {" · "}
                  {v.opis}
                </span>
              </li>
            );
          })}
          {ulaz.map((v) => {
            const iz = cvorovi.find((c) => c.id === v.od);
            const n = Math.round(v.doprinos);
            return (
              <li key={v.id} className="flex items-start gap-2 text-xs leading-snug">
                <span className={cn("mt-0.5 w-8 shrink-0 font-bold tabular-nums", n >= 0 ? "text-volt" : "text-ruby")}>
                  {n >= 0 ? `+${n}` : `${n}`}
                </span>
                <span className="text-dim">
                  od <span className="font-bold text-ink">{iz?.naziv}</span>
                  {" · "}
                  {v.opis}
                </span>
              </li>
            );
          })}
          {izlaz.length === 0 && ulaz.length === 0 && (
            <li className="text-xs text-dim">Nema veza. Dodirni drugi čvor.</li>
          )}
        </ul>
        {aktivni.akcija === "napad" && (
          <button
            type="button"
            onClick={() => {
              playSfx("button");
              setRaidAktivan(true);
            }}
            className="mt-3 min-h-11 w-full rounded-xl bg-ruby text-sm font-bold tracking-widest text-ink transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            POHOD
          </button>
        )}
      </div>
    </section>
  );
}
