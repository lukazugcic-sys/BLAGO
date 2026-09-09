import { useMemo, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { kadJe, kronikaArt, kronikaNaslov, stavOd } from "@/lib/game/kronika";
import { SYMBOL_ART } from "@/lib/game/art";
import { playSfx } from "@/lib/game/audio";
import { IconBadge } from "./IconBadge";
import { cn } from "@/lib/utils";
import type { KronikaZapis } from "@/lib/game/types";

const FILTERI: Array<{ id: "sve" | "pohod" | "gradnja" | "ljudi" | "ulica" | "zvijezda"; label: string }> = [
  { id: "sve", label: "Sve" },
  { id: "pohod", label: "Pohod" },
  { id: "gradnja", label: "Gradnja" },
  { id: "ljudi", label: "Ljudi" },
  { id: "ulica", label: "Ulica" },
  { id: "zvijezda", label: "Zvijezda" },
];

function prolazi(z: KronikaZapis, f: (typeof FILTERI)[number]["id"]) {
  if (f === "sve") return true;
  const v = z.vrsta ?? (z.pobjeda ? "pohod" : "obrana");
  if (f === "pohod") return v === "pohod" || v === "obrana";
  if (f === "gradnja") return v === "gradnja";
  if (f === "ljudi") return v === "selidba";
  if (f === "zvijezda") return v === "dostignuce";
  return v === "dogadaj";
}

function redKlasa(z: KronikaZapis) {
  const v = z.vrsta ?? (z.pobjeda ? "pohod" : "obrana");
  if (v === "dostignuce") return "kronika-red-zvijezda";
  if (v === "pohod" && z.pobjeda) return "kronika-red-pobjeda";
  if (v === "obrana" && !z.pobjeda) return "kronika-red-poraz";
  return "";
}

export function KronikaLista() {
  const kronika = useGameStore((s) => s.kronika);
  const [filter, setFilter] = useState<(typeof FILTERI)[number]["id"]>("sve");
  const red = useMemo(() => kronika.filter((z) => prolazi(z, filter)), [kronika, filter]);
  const skupine = useMemo(() => {
    const map = new Map<string, KronikaZapis[]>();
    for (const z of red) {
      const k = kadJe(z.t);
      const arr = map.get(k);
      if (arr) arr.push(z);
      else map.set(k, [z]);
    }
    return [...map.entries()];
  }, [red]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <h3 className="text-xs font-bold tracking-widest text-gold uppercase">Kronika kaube</h3>
        <p className="text-[10px] font-bold tabular-nums text-dim">{red.length} zapisa</p>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {FILTERI.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              playSfx("button");
              setFilter(f.id);
            }}
            className={cn(
              "min-h-9 shrink-0 rounded-full px-3 text-[11px] font-bold tracking-wide uppercase transition-transform duration-150 ease-out active:scale-[0.96]",
              filter === f.id ? "bg-gold text-void" : "border border-line bg-panel text-dim",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {red.length === 0 ? (
        <article className="rounded-2xl border border-line bg-panel p-4">
          <p className="text-sm font-semibold text-dim">
            {kronika.length === 0
              ? "Još nema zapisa. Ivo diže krov. Kata čeka."
              : "Nema zapisa u ovom redu. Prašina je drugdje."}
          </p>
        </article>
      ) : (
        skupine.map(([kad, zapisi]) => (
          <article key={kad} className="rounded-2xl border border-line bg-panel p-3.5">
            <p className="mb-2 text-[10px] font-bold tracking-widest text-dim uppercase">{kad}</p>
            <ul className="flex flex-col gap-2.5">
              {zapisi.map((z, i) => {
                const s = stavOd(z.stav);
                return (
                  <li
                    key={z.id}
                    className={cn("kronika-red flex gap-2.5", redKlasa(z))}
                    style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
                  >
                    <IconBadge src={SYMBOL_ART[kronikaArt(z)]} size="sm" />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold tracking-wide text-dim uppercase">
                        {kronikaNaslov(z)}
                        {z.metaIme ? ` · ${z.metaIme}` : s?.naziv ? ` · ${s.naziv}` : ""}
                      </span>
                      <span className="block text-sm leading-snug text-ink">{z.recap}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </article>
        ))
      )}
    </div>
  );
}
