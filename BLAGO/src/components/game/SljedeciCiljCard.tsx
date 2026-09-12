import { memo, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { odaberiSljedeciCilj, otvoriCiljZgradu, type CiljCijena } from "@/lib/game/sljedeciCilj";
import { kaubaOd } from "@/lib/game/ljudi";
import { RESURS_ART, ZGRADA_ART, artSrc } from "@/lib/game/art";
import { formatHud } from "@/lib/game/helpers";
import { IconBadge } from "./IconBadge";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

const RES_REDOSLED: Array<{ key: keyof CiljCijena; src: string; label: string }> = [
  { key: "zlato", src: RESURS_ART.zlato, label: "zlato" },
  { key: "drvo", src: RESURS_ART.drvo, label: "drvo" },
  { key: "kamen", src: RESURS_ART.kamen, label: "kamen" },
  { key: "zeljezo", src: RESURS_ART.zeljezo, label: "željezo" },
];

function zbroj(c: CiljCijena) {
  return (c.zlato || 0) + (c.drvo || 0) + (c.kamen || 0) + (c.zeljezo || 0);
}

function CijenaChip({
  src,
  treba,
  ima,
  nedostaje,
}: {
  src: string;
  treba: number;
  ima: number;
  nedostaje: number;
}) {
  if (!treba || treba <= 0) return null;
  const short = nedostaje > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5",
        short ? "bg-ruby/12" : "bg-quest/12",
      )}
      title={short ? `Imaš ${formatHud(ima)}, treba ${formatHud(treba)}` : "Imate dovoljno"}
    >
      <IconBadge src={src} size="xs" />
      <span
        className={cn(
          "text-[10px] font-bold tabular-nums leading-none",
          short ? "text-ruby" : "text-ink",
        )}
      >
        {formatHud(treba)}
      </span>
      {short ? (
        <span className="text-[8px] font-bold leading-none tracking-wide text-ruby/90 uppercase">
          −{formatHud(nedostaje)}
        </span>
      ) : (
        <span className="text-[8px] font-bold leading-none tracking-wide text-quest uppercase">ok</span>
      )}
    </span>
  );
}

export const SljedeciCiljCard = memo(function SljedeciCiljCard({
  kompaktna,
}: {
  kompaktna?: boolean;
}) {
  const gradevine = useGameStore((s) => s.gradevine);
  const zlato = useGameStore((s) => s.zlato);
  const resursi = useGameStore((s) => s.resursi);
  const gradnje = useGameStore((s) => s.gradnje);
  const stanovnici = useGameStore((s) => s.stanovnici);
  const zamjenici = useGameStore((s) => s.zamjenici);
  const konjiBroj = useGameStore((s) => s.konjiBroj);
  const konjiDuznost = useGameStore((s) => s.konjiDuznost);
  const govedaBroj = useGameStore((s) => s.govedaBroj);
  const govedaDuznost = useGameStore((s) => s.govedaDuznost);
  const sijenoDo = useGameStore((s) => s.sijenoDo);
  const kisaDo = useGameStore((s) => s.kisaDo);

  const cilj = useMemo(() => {
    const kauba = kaubaOd({
      gradevine,
      stanovnici,
      zamjenici,
      konjiBroj,
      konjiDuznost,
      sijenoDo,
      kisaDo,
      govedaBroj,
      govedaDuznost,
    });
    return odaberiSljedeciCilj({
      gradevine,
      zlato,
      resursi,
      gradnje,
      usko: kauba.usko,
    });
  }, [
    gradevine,
    zlato,
    resursi,
    gradnje,
    stanovnici,
    zamjenici,
    konjiBroj,
    konjiDuznost,
    govedaBroj,
    govedaDuznost,
    sijenoDo,
    kisaDo,
  ]);

  if (!cilj) return null;

  const z = cilj.zgrada;
  const thumb = ZGRADA_ART[z.id] ?? ZGRADA_ART.pilana;
  const total = Math.max(1, zbroj(cilj.cijena));
  const miss = zbroj(cilj.nedostaje);
  const pct = cilj.uGradnji ? 100 : Math.round(Math.min(100, ((total - miss) / total) * 100));
  const cta = cilj.uGradnji ? "Vidi" : cilj.mozeKupiti ? "Kauba" : "Skupi";

  return (
    <article
      className={cn(
        "cilj-kartica relative overflow-hidden rounded-2xl border border-gold/40 bg-panel shadow-panel",
        kompaktna ? "mb-1" : "mb-2.5",
      )}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent"
        aria-hidden
      />
      <button
        type="button"
        onClick={() => {
          playSfx("button");
          otvoriCiljZgradu(z.id);
        }}
        className={cn(
          "flex w-full items-stretch gap-2.5 text-left transition-transform duration-150 ease-out active:scale-[0.99]",
          kompaktna ? "px-2.5 pt-2 pb-1.5" : "px-3 pt-2.5 pb-2",
        )}
        aria-label={`Sljedeći cilj: ${z.naziv}`}
      >
        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-line/80 bg-void shadow-[inset_0_0_0_1px_rgb(0_0_0_/_0.25)]">
          <img
            src={artSrc(thumb)}
            alt=""
            draggable={false}
            decoding="async"
            className="size-full object-cover"
            onError={(e) => {
              const el = e.currentTarget;
              const bare = thumb.split("?")[0];
              if (!el.dataset.retried) {
                el.dataset.retried = "1";
                el.src = bare;
              }
            }}
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold tracking-[0.24em] text-gold/90 uppercase">
              Sljedeći cilj
            </span>
            <span className="rounded-md bg-void/35 px-1.5 py-0.5 text-[9px] font-bold tabular-nums tracking-wide text-dim">
              LVL {cilj.lv}/{z.maxLv}
            </span>
          </span>
          <span className="mt-0.5 block truncate font-display text-[15px] leading-tight tracking-wide text-ink">
            {z.naziv}
            <span className="font-sans text-[11px] font-bold text-dim">
              {" "}
              · {cilj.akcija === "GRADI SE" ? "gradi se" : `→ ${cilj.ciljLv}`}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[10px] font-semibold text-xp/90">
            Dobiješ: {cilj.nagrada}
          </span>
        </span>

        <span
          className={cn(
            "cilj-cta flex shrink-0 items-center gap-0.5 self-center rounded-xl px-2.5 py-2 text-[10px] font-bold tracking-wide uppercase",
            cilj.uGradnji
              ? "bg-panel-2 text-dim"
              : cilj.mozeKupiti
                ? "bg-gold text-void shadow-[0_0_14px_color-mix(in_oklab,var(--color-gold)_35%,transparent)]"
                : "border border-gold/35 bg-gold/12 text-gold",
          )}
        >
          {cta}
          <ChevronRight className="size-3.5 opacity-80" strokeWidth={2.6} aria-hidden />
        </span>
      </button>

      <div className={cn("px-2.5", kompaktna ? "pb-2" : "pb-2.5")}>
        <div
          className="cilj-traka mb-1.5 h-1 overflow-hidden rounded-full bg-void/55"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Napredak cilja ${pct}%`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300 ease-out",
              cilj.mozeKupiti || cilj.uGradnji ? "bg-gold" : "bg-energy",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {RES_REDOSLED.map((r) => (
            <CijenaChip
              key={r.key}
              src={r.src}
              treba={cilj.cijena[r.key]}
              ima={cilj.ima[r.key]}
              nedostaje={cilj.nedostaje[r.key]}
            />
          ))}
        </div>
      </div>
    </article>
  );
});
