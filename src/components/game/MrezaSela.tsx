import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { izgradiMrezu, vezeZa, type MrezaCvor } from "@/lib/game/mreza";
import { ART, HUB_ART } from "@/lib/game/art";
import { POTREBE_META, type KaubaUsko, type KaubaUtjecaj } from "@/lib/game/economy";
import { kaubaOd } from "@/lib/game/ljudi";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import type { Gradevine } from "@/lib/game/types";

const HUB_XY: Record<KaubaUsko, { x: number; y: number }> = {
  red: { x: 50, y: 16 },
  krov: { x: 18, y: 32 },
  jelo: { x: 18, y: 62 },
  zabava: { x: 50, y: 84 },
  posao: { x: 82, y: 62 },
  voda: { x: 82, y: 32 },
  konji: { x: 82, y: 84 },
  zdravlje: { x: 18, y: 84 },
};

const HUB_LABEL: Record<KaubaUsko, string> = {
  red: "top",
  krov: "left",
  jelo: "left",
  zabava: "bottom",
  posao: "right",
  voda: "right",
  konji: "right",
  zdravlje: "left",
};

function krivulja(x1: number, y1: number, x2: number, y2: number, predznak: 1 | -1) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const k = predznak * 0.16;
  return `M ${x1} ${y1} Q ${mx - dy * k} ${my + dx * k} ${x2} ${y2}`;
}

function spojiUtjecaje(lista: KaubaUtjecaj[]) {
  const map = new Map<string, KaubaUtjecaj>();
  for (const u of lista) {
    if (u.od === u.do) continue;
    const k = `${u.od}>${u.do}:${u.predznak}`;
    const ima = map.get(k);
    if (!ima || u.jacina > ima.jacina) map.set(k, u);
  }
  return [...map.values()].sort((a, b) => b.jacina - a.jacina);
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

type PregledId = "selo" | KaubaUsko | string;

export function MrezaSela({
  fokusHub,
  onHub,
  onZgrada,
  velika,
}: {
  fokusHub?: KaubaUsko;
  onHub?: (id: KaubaUsko) => void;
  onZgrada?: (id: keyof Gradevine) => void;
  velika?: boolean;
}) {
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
  const stanovnici = useGameStore((s) => s.stanovnici);
  const zamjenici = useGameStore((s) => s.zamjenici);
  const konjiBroj = useGameStore((s) => s.konjiBroj);
  const konjiDuznost = useGameStore((s) => s.konjiDuznost);
  const sijenoDo = useGameStore((s) => s.sijenoDo);
  const kauba = useMemo(
    () => kaubaOd({ gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo }),
    [gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo],
  );
  const utjecaji = useMemo(() => spojiUtjecaje(kauba.utjecaji), [kauba.utjecaji]);

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

  const [fokus, setFokus] = useState<PregledId>(fokusHub ?? "selo");
  const [smijeTok, setSmijeTok] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSmijeTok(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (fokusHub) setFokus(fokusHub);
  }, [fokusHub]);

  const selo = cvorovi.find((c) => c.id === "selo");
  const extra = cvorovi.filter((c) => c.vrsta === "obrana" || c.vrsta === "stav" || c.vrsta === "kriza");

  const hubovi = useMemo(() => {
    return POTREBE_META.map((h) => {
      const zgrade = h.zgrade
        .map((id) => cvorovi.find((c) => c.zgradaId === id))
        .filter((c): c is MrezaCvor => !!c);
      const kv =
        zgrade.length === 0
          ? 0
          : Math.round(zgrade.reduce((a, c) => a + c.kvaliteta, 0) / zgrade.length);
      const doprinos = veze
        .filter((v) => v.do === "selo" && zgrade.some((c) => c.id === v.od))
        .reduce((a, v) => a + v.doprinos, 0);
      return { ...h, zgrade, kvaliteta: kv, doprinos };
    });
  }, [cvorovi, veze]);

  const aktivniHub = hubovi.find((h) => h.id === fokus);
  const aktivniExtra = extra.find((c) => c.id === fokus);
  const aktivniSelo = fokus === "selo";
  const { ulaz, izlaz } = vezeZa(aktivniSelo ? "selo" : aktivniExtra?.id ?? "selo", veze);
  const pulsIds = protokPuls?.ids ?? [];

  const odaberiHub = (id: KaubaUsko) => {
    playSfx("button");
    setFokus(id);
    onHub?.(id);
  };

  const odaberiSelo = () => {
    playSfx("button");
    setFokus("selo");
  };

  const odaberiExtra = (c: MrezaCvor) => {
    playSfx("button");
    setFokus(c.id);
  };

  if (!selo) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-panel">
      <header className="flex items-center justify-between gap-3 px-3 pt-2.5">
        <h2 className="text-xs font-bold tracking-widest text-dim uppercase">Tok kaube</h2>
        <p className="text-xs font-bold tabular-nums text-gold">
          {aktivniSelo ? selo.naziv : aktivniHub?.naziv ?? aktivniExtra?.naziv}
        </p>
      </header>
      <div
        className={cn("mreza-platno relative overflow-hidden", velika && "mreza-hero")}
        data-lock-pan
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          backgroundImage: `linear-gradient(180deg, color-mix(in oklab, var(--color-void) 42%, transparent), color-mix(in oklab, var(--color-void) 70%, #0e2a28)), url(${ART.seloPoster})`,
          backgroundSize: "cover",
          backgroundPosition: "center 58%",
        }}
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
          {hubovi.map((h) => {
            const xy = HUB_XY[h.id];
            const puls = h.zgrade.some((z) => pulsIds.includes(`${z.id}>selo`));
            const ziva = aktivniSelo || fokus === h.id;
            const d = krivulja(xy.x, xy.y, 50, 50, h.doprinos >= 0 ? 1 : -1);
            return (
              <path
                key={`veza-${h.id}`}
                d={d}
                className={cn(
                  "mreza-veza",
                  h.doprinos >= 0 ? "stroke-volt" : "stroke-ruby",
                  ziva && smijeTok && "mreza-veza-tok",
                  puls && smijeTok && "mreza-veza-puls",
                )}
                strokeWidth={0.7 + Math.min(1.4, Math.abs(h.doprinos) / 28)}
                markerEnd={h.doprinos >= 0 ? "url(#mreza-pos)" : "url(#mreza-neg)"}
                opacity={ziva ? 0.95 : 0.28}
              />
            );
          })}
          {utjecaji.map((u) => {
            const a = HUB_XY[u.od];
            const b = HUB_XY[u.do];
            if (!a || !b) return null;
            const ziva = aktivniSelo || fokus === u.od || fokus === u.do;
            return (
              <path
                key={`utjecaj-${u.od}-${u.do}-${u.predznak}`}
                d={krivulja(a.x, a.y, b.x, b.y, u.predznak)}
                className={cn(
                  "mreza-veza mreza-veza-utjecaj",
                  u.predznak > 0 ? "stroke-volt" : "stroke-ruby",
                  ziva && smijeTok && "mreza-veza-tok",
                )}
                strokeWidth={0.55 + Math.min(1.1, u.jacina)}
                markerEnd={u.predznak > 0 ? "url(#mreza-pos)" : "url(#mreza-neg)"}
                opacity={ziva ? 0.9 : 0.18}
              />
            );
          })}
        </svg>

        <button
          type="button"
          aria-pressed={aktivniSelo}
          aria-label={`${selo.naziv}, kvaliteta ${selo.kvaliteta}`}
          onClick={odaberiSelo}
          className={cn(
            "mreza-cvor mreza-selo absolute z-[2] size-14 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 bg-panel-2",
            aktivniSelo ? "mreza-cvor-fokus border-gold" : "border-line",
          )}
          style={{ left: "50%", top: "50%" }}
        >
          <img src={HUB_ART.selo} alt="" className="size-full object-cover" draggable={false} />
        </button>

        {hubovi.map((h) => {
          const xy = HUB_XY[h.id];
          const odabran = fokus === h.id;
          const prazno = h.zgrade.every((z) => z.kvaliteta === 0);
          const strana = HUB_LABEL[h.id];
          return (
            <button
              key={h.id}
              type="button"
              aria-pressed={odabran}
              aria-label={h.naziv}
              onClick={() => odaberiHub(h.id)}
              className="mreza-cvor absolute z-[2] size-11 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${xy.x}%`, top: `${xy.y}%` }}
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center overflow-hidden rounded-full border bg-void/80",
                  odabran && "mreza-cvor-fokus border-gold",
                  !odabran && "border-line",
                  prazno && "opacity-70",
                )}
              >
                <img src={HUB_ART[h.id]} alt="" className="size-full object-cover" draggable={false} />
              </span>
              <span
                className={cn(
                  "mreza-ime",
                  `mreza-ime-${strana}`,
                  odabran ? "bg-gold text-void" : "bg-void/80 text-ink",
                )}
              >
                {h.naziv}
              </span>
            </button>
          );
        })}
      </div>

      {extra.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-3 py-2">
          {extra.map((c) => {
            const odabran = fokus === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={odabran}
                aria-label={c.naziv}
                onClick={() => odaberiExtra(c)}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold",
                  odabran ? "border-gold bg-gold/15 text-ink" : "border-line bg-panel-2 text-dim",
                  c.vrsta === "kriza" && "border-ruby text-ruby",
                )}
              >
                <img src={c.art} alt="" className="mreza-glyph size-4" draggable={false} />
                {c.naziv}
              </button>
            );
          })}
        </div>
      )}

      <div className="border-t border-line px-4 py-3">
        {aktivniSelo && (
          <>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">{selo.naziv}</p>
              <p className="text-xs font-bold tabular-nums text-dim">{selo.kvaliteta}</p>
            </div>
            <KvalitetnaTraka n={selo.kvaliteta} />
            <ul className="mreza-ispis mt-3 flex flex-col gap-1.5">
              <li className="flex items-start gap-2 text-xs leading-snug">
                <span className="mt-0.5 w-8 shrink-0 font-bold tabular-nums text-dim">+20</span>
                <span className="text-dim">tabor stoji</span>
              </li>
              {hubovi.map((h) => {
                const n = Math.round(h.doprinos);
                if (n === 0 && h.zgrade.every((z) => z.kvaliteta === 0)) return null;
                return (
                  <li key={h.id} className="flex items-start gap-2 text-xs leading-snug">
                    <span className={cn("mt-0.5 w-8 shrink-0 font-bold tabular-nums", n >= 0 ? "text-volt" : "text-ruby")}>
                      {n >= 0 ? `+${n}` : `${n}`}
                    </span>
                    <span className="text-dim">
                      <span className="font-bold text-ink">{h.naziv}</span>
                      {" · "}
                      {h.zgrade.map((z) => z.naziv).join(", ")}
                    </span>
                  </li>
                );
              })}
              {extra.map((c) => {
                const v = veze.find((e) => e.od === c.id && e.do === "selo");
                if (!v) return null;
                const n = Math.round(v.doprinos);
                return (
                  <li key={c.id} className="flex items-start gap-2 text-xs leading-snug">
                    <span className={cn("mt-0.5 w-8 shrink-0 font-bold tabular-nums", n >= 0 ? "text-volt" : "text-ruby")}>
                      {n >= 0 ? `+${n}` : `${n}`}
                    </span>
                    <span className="text-dim">
                      <span className="font-bold text-ink">{c.naziv}</span>
                      {" · "}
                      {v.opis}
                    </span>
                  </li>
                );
              })}
              {utjecaji.slice(0, 5).map((u) => (
                <li key={`u-${u.od}-${u.do}-${u.predznak}`} className="flex items-start gap-2 text-xs leading-snug">
                  <span className={cn("mt-0.5 w-8 shrink-0 font-bold tabular-nums", u.predznak > 0 ? "text-volt" : "text-ruby")}>
                    {u.predznak > 0 ? "+" : "−"}
                  </span>
                  <span className="text-dim">
                    <span className="font-bold text-ink">{POTREBE_META.find((p) => p.id === u.od)?.naziv}</span>
                    {" → "}
                    <span className="font-bold text-ink">{POTREBE_META.find((p) => p.id === u.do)?.naziv}</span>
                    {" · "}
                    {u.rec}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        {aktivniHub && (
          <>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">{aktivniHub.naziv}</p>
              <p className="text-xs font-bold tabular-nums text-dim">{aktivniHub.kvaliteta}</p>
            </div>
            <KvalitetnaTraka n={aktivniHub.kvaliteta} />
            <ul className="mreza-ispis mt-3 flex flex-col gap-1.5">
              {aktivniHub.zgrade.map((z) => (
                <li key={z.id}>
                  <button
                    type="button"
                    onClick={() => z.zgradaId && onZgrada?.(z.zgradaId)}
                    className="flex w-full items-start gap-2 text-left text-xs leading-snug"
                  >
                    <span className="mt-0.5 w-8 shrink-0 font-bold tabular-nums text-gold">{z.kvaliteta}</span>
                    <span className="text-dim">
                      <span className="font-bold text-ink">{z.naziv}</span>
                      {z.kvaliteta === 0 ? " · još pusto" : " · drži kaubu"}
                    </span>
                  </button>
                </li>
              ))}
              {utjecaji
                .filter((u) => u.od === aktivniHub.id || u.do === aktivniHub.id)
                .map((u) => (
                  <li key={`h-${u.od}-${u.do}-${u.predznak}`} className="flex items-start gap-2 text-xs leading-snug">
                    <span className={cn("mt-0.5 w-8 shrink-0 font-bold tabular-nums", u.predznak > 0 ? "text-volt" : "text-ruby")}>
                      {u.predznak > 0 ? "+" : "−"}
                    </span>
                    <span className="text-dim">
                      <span className="font-bold text-ink">{POTREBE_META.find((p) => p.id === u.od)?.naziv}</span>
                      {" → "}
                      <span className="font-bold text-ink">{POTREBE_META.find((p) => p.id === u.do)?.naziv}</span>
                      {" · "}
                      {u.rec}
                    </span>
                  </li>
                ))}
            </ul>
          </>
        )}
        {aktivniExtra && (
          <>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">{aktivniExtra.naziv}</p>
              <p className="text-xs font-bold tabular-nums text-dim">{aktivniExtra.kvaliteta}</p>
            </div>
            <KvalitetnaTraka n={aktivniExtra.kvaliteta} />
            <ul className="mreza-ispis mt-3 flex flex-col gap-1.5">
              {izlaz.concat(ulaz).map((v) => {
                const drugi = cvorovi.find((c) => c.id === (v.od === aktivniExtra.id ? v.do : v.od));
                const n = Math.round(v.doprinos);
                return (
                  <li key={v.id} className="flex items-start gap-2 text-xs leading-snug">
                    <span className={cn("mt-0.5 w-8 shrink-0 font-bold tabular-nums", n >= 0 ? "text-volt" : "text-ruby")}>
                      {n >= 0 ? `+${n}` : `${n}`}
                    </span>
                    <span className="text-dim">
                      <span className="font-bold text-ink">{drugi?.naziv ?? "Selo"}</span>
                      {" · "}
                      {v.opis}
                    </span>
                  </li>
                );
              })}
            </ul>
            {aktivniExtra.akcija === "napad" && (
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
          </>
        )}
      </div>
    </section>
  );
}
