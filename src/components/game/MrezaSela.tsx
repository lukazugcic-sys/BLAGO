import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
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
  krov: { x: 22, y: 32 },
  voda: { x: 78, y: 32 },
  jelo: { x: 22, y: 58 },
  posao: { x: 78, y: 58 },
  zdravlje: { x: 22, y: 82 },
  zabava: { x: 50, y: 82 },
  konji: { x: 78, y: 82 },
};

const OBRUC: Array<[KaubaUsko, KaubaUsko]> = [
  ["red", "krov"],
  ["red", "voda"],
  ["krov", "jelo"],
  ["voda", "posao"],
  ["jelo", "zdravlje"],
  ["posao", "konji"],
  ["zdravlje", "zabava"],
  ["zabava", "konji"],
  ["krov", "voda"],
  ["jelo", "posao"],
  ["red", "zabava"],
];

function krivulja(x1: number, y1: number, x2: number, y2: number, predznak: 1 | -1) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const k = predznak * 0.14;
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
  const govedaBroj = useGameStore((s) => s.govedaBroj);
  const govedaDuznost = useGameStore((s) => s.govedaDuznost);
  const sijenoDo = useGameStore((s) => s.sijenoDo);
  const kisaDo = useGameStore((s) => s.kisaDo);
  const kauba = useMemo(
    () => kaubaOd({ gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo, kisaDo, govedaBroj, govedaDuznost }),
    [gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo, kisaDo, govedaBroj, govedaDuznost],
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
  const [zum, setZum] = useState(1);
  const [ofs, setOfs] = useState({ x: 0, y: 0 });
  const geste = useRef({
    pointers: new Map<number, { x: number; y: number }>(),
    startDist: 0,
    startZum: 1,
    startOfs: { x: 0, y: 0 },
    last: { x: 0, y: 0 },
    tap: 0,
  });

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

  const resetZum = () => {
    setZum(1);
    setOfs({ x: 0, y: 0 });
  };

  const naPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const g = geste.current;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.pointers.size === 2) {
      const pts = [...g.pointers.values()];
      const dx = pts[0]!.x - pts[1]!.x;
      const dy = pts[0]!.y - pts[1]!.y;
      g.startDist = Math.hypot(dx, dy) || 1;
      g.startZum = zum;
      g.startOfs = { ...ofs };
    } else {
      g.last = { x: e.clientX, y: e.clientY };
      g.startOfs = { ...ofs };
      const sad = Date.now();
      if (sad - g.tap < 280) resetZum();
      g.tap = sad;
    }
  };

  const naPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = geste.current;
    if (!g.pointers.has(e.pointerId)) return;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.pointers.size >= 2) {
      const pts = [...g.pointers.values()];
      const dx = pts[0]!.x - pts[1]!.x;
      const dy = pts[0]!.y - pts[1]!.y;
      const dist = Math.hypot(dx, dy) || 1;
      const next = Math.max(1, Math.min(2.4, g.startZum * (dist / g.startDist)));
      setZum(next);
      if (next <= 1.02) setOfs({ x: 0, y: 0 });
    } else if (zum > 1.02 && g.pointers.size === 1) {
      const dx = e.clientX - g.last.x;
      const dy = e.clientY - g.last.y;
      g.last = { x: e.clientX, y: e.clientY };
      setOfs((o) => {
        const lim = 80 * (zum - 1);
        return {
          x: Math.max(-lim, Math.min(lim, o.x + dx)),
          y: Math.max(-lim, Math.min(lim, o.y + dy)),
        };
      });
    }
  };

  const naPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    geste.current.pointers.delete(e.pointerId);
  };

  if (!selo) return null;

  return (
    <section className={cn(velika ? "mreza-rub" : "overflow-hidden rounded-2xl border border-line bg-panel")}>
      <header className="flex items-center justify-between gap-3 px-3 pt-2.5">
        <h2 className="text-xs font-bold tracking-widest text-dim uppercase">Tok kaube</h2>
        <p className="text-xs font-bold tabular-nums text-gold">
          {aktivniSelo ? selo.naziv : aktivniHub?.naziv ?? aktivniExtra?.naziv}
        </p>
      </header>
      <div
        className={cn("mreza-platno relative overflow-hidden", velika && "mreza-hero")}
        data-lock-pan
        onPointerDown={naPointerDown}
        onPointerMove={naPointerMove}
        onPointerUp={naPointerUp}
        onPointerCancel={naPointerUp}
        style={{
          backgroundImage: `linear-gradient(180deg, color-mix(in oklab, var(--color-void) 42%, transparent), color-mix(in oklab, var(--color-void) 70%, #0e2a28)), url(${ART.seloPoster})`,
          backgroundSize: "cover",
          backgroundPosition: "center 58%",
        }}
      >
        {zum > 1.02 && (
          <p className="mreza-zum-rec">Zum ×{zum.toFixed(1)} · dvaput za nulu</p>
        )}
        <div
          className="mreza-zum-platno"
          style={{ transform: `translate(${ofs.x}px, ${ofs.y}px) scale(${zum})` }}
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
          {OBRUC.map(([od, dest]) => {
            const a = HUB_XY[od];
            const b = HUB_XY[dest];
            const ima = utjecaji.some((u) => (u.od === od && u.do === dest) || (u.od === dest && u.do === od));
            if (ima) return null;
            return (
              <path
                key={`obruc-${od}-${dest}`}
                d={krivulja(a.x, a.y, b.x, b.y, 1)}
                className="mreza-veza stroke-gold"
                strokeWidth={0.45}
                opacity={0.28}
              />
            );
          })}
          {hubovi.map((h) => {
            const xy = HUB_XY[h.id];
            const puls = h.zgrade.some((z) => pulsIds.includes(`${z.id}>selo`));
            const ziva = aktivniSelo || fokus === h.id;
            const plus = h.doprinos >= 0;
            const d = krivulja(xy.x, xy.y, 50, 50, plus ? 1 : -1);
            return (
              <path
                key={`veza-${h.id}`}
                d={d}
                className={cn(
                  "mreza-veza",
                  plus ? "stroke-volt" : "stroke-ruby",
                  ziva && smijeTok && "mreza-veza-tok",
                  puls && smijeTok && "mreza-veza-puls",
                )}
                strokeWidth={0.7 + Math.min(1.4, Math.abs(h.doprinos) / 28)}
                markerEnd={plus ? "url(#mreza-pos)" : "url(#mreza-neg)"}
                opacity={ziva ? 0.95 : 0.38}
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
                opacity={ziva ? 0.9 : 0.35}
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
            "mreza-cvor mreza-selo absolute z-[2] size-12 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 bg-panel-2",
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
          return (
            <button
              key={h.id}
              type="button"
              aria-pressed={odabran}
              aria-label={h.naziv}
              onClick={() => odaberiHub(h.id)}
              className="mreza-cvor absolute z-[2] size-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${xy.x}%`, top: `${xy.y}%` }}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center overflow-hidden rounded-full border bg-void/80",
                  odabran && "mreza-cvor-fokus border-gold",
                  !odabran && "border-line",
                  prazno && "opacity-70",
                )}
              >
                <img src={HUB_ART[h.id]} alt="" className="size-full object-cover" draggable={false} />
              </span>
              <span
                className={cn(
                  "mreza-ime mreza-ime-unutra",
                  odabran ? "bg-gold text-void" : "bg-void/85 text-ink",
                )}
              >
                {h.naziv}
              </span>
            </button>
          );
        })}
        </div>
      </div>

      {velika && (
        <ul className="mreza-okomito px-3 py-2">
          {hubovi.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => odaberiHub(h.id)}
                className={cn(
                  "mreza-ok-red",
                  fokus === h.id && "mreza-ok-red-on",
                )}
              >
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-[11px] font-bold tracking-wide text-gold uppercase">{h.naziv}</span>
                  <span className="block text-[10px] font-bold text-dim">
                    {h.zgrade.length === 1
                      ? "1 zgrada"
                      : h.zgrade.length >= 2 && h.zgrade.length <= 4
                        ? `${h.zgrade.length} zgrade`
                        : `${h.zgrade.length} zgrada`}{" "}
                    · {h.kvaliteta}
                  </span>
                </span>
                <span className="w-20 shrink-0">
                  <KvalitetnaTraka n={h.kvaliteta} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

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
