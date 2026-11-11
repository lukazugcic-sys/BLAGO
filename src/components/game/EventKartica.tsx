import type { KaubaDogadaj } from "@/lib/game/dogadaji";
import { TekstResursa } from "@/components/game/Iznos";
import { natpisOtjeraj } from "@/lib/game/akuzativ";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

export function EventKartica({
  d,
  onOpcija,
  oznaka,
  className,
}: {
  d: KaubaDogadaj;
  onOpcija: (id: string) => void;
  oznaka?: string;
  className?: string;
}) {
  const naslov =
    d.naslov ??
    (d.tip === "stranac"
      ? "Stranac"
      : d.tip === "dvoboj"
        ? "Dvoboj"
        : d.tip === "krdo"
          ? "Krdo"
          : d.tip === "konj"
            ? "Konj"
            : d.tip === "kisa"
              ? "Kiša"
              : d.tip === "trgovac"
                ? "Trgovac"
                : d.tip === "svadba"
                  ? "Svadba"
                  : d.tip === "posta"
                    ? "Pošta"
                    : d.tip === "cirkus"
                      ? "Cirkus"
                      : "Salun");
  return (
    <article
      className={cn("kauba-dogadaj kauba-dogadaj-veselo mb-2 overflow-hidden rounded-2xl border border-gold/80 bg-panel p-3", className)}
      data-vodic={oznaka}
    >
      <p className="text-[10px] font-bold tracking-[0.22em] text-gold uppercase">{naslov}</p>
      <p className="mt-1 text-sm font-bold leading-snug text-ink"><TekstResursa tekst={d.rec} /></p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {d.opcije.map((o, i) => (
          <button
            key={o.id}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              playSfx("button");
              onOpcija(o.id);
            }}
            className={cn(
              "min-h-10 rounded-full px-3 text-[11px] font-bold tracking-wide uppercase",
              i === 0 ? "bg-gold text-void" : i === 1 ? "bg-volt text-void" : "bg-xp text-void",
            )}
          >
            {o.id === "otjeraj" ? natpisOtjeraj(d.serifIme || "stranac") : <TekstResursa tekst={o.rec} />}
          </button>
        ))}
      </div>
    </article>
  );
}
