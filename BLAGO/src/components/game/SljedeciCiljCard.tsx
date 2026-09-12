import { memo, useMemo } from "react";
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
        "inline-flex flex-col items-start gap-0.5 rounded-lg px-2 py-1",
        short ? "bg-ruby/15" : "bg-ink/5",
      )}
      title={short ? `Imaš ${formatHud(ima)}, treba ${formatHud(treba)}` : "Imate dovoljno"}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-bold tabular-nums",
          short ? "text-ruby" : "text-ink",
        )}
      >
        <IconBadge src={src} size="xs" />
        {formatHud(treba)}
      </span>
      {short ? (
        <span className="text-[9px] font-bold leading-none tracking-wide text-ruby uppercase">
          nedostaje {formatHud(nedostaje)}
        </span>
      ) : (
        <span className="text-[9px] font-bold leading-none tracking-wide text-quest uppercase">ima</span>
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

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gold/45 bg-panel shadow-panel",
        kompaktna ? "mb-1.5" : "mb-2.5",
      )}
    >
      <button
        type="button"
        onClick={() => {
          playSfx("button");
          otvoriCiljZgradu(z.id);
        }}
        className={cn(
          "flex w-full items-stretch gap-2.5 text-left transition-transform duration-150 ease-out active:scale-[0.99]",
          kompaktna ? "p-2.5" : "p-3",
        )}
        aria-label={`Sljedeći cilj: ${z.naziv}`}
      >
        <span className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-line bg-void">
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
            <span className="text-[10px] font-bold tracking-[0.22em] text-gold uppercase">
              Sljedeći cilj
            </span>
            <span className="rounded-sm bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-dim">
              LVL {cilj.lv}/{z.maxLv}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-sm font-bold text-ink">
            {z.naziv}
            <span className="text-dim"> · {cilj.akcija === "GRADI SE" ? "gradi se" : `→ ${cilj.ciljLv}`}</span>
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-semibold text-xp">
            Dobiješ: {cilj.nagrada}
          </span>
        </span>

        <span
          className={cn(
            "flex shrink-0 items-center self-center rounded-lg px-2.5 py-2 text-[10px] font-bold tracking-wide uppercase",
            cilj.uGradnji
              ? "bg-panel-2 text-dim"
              : cilj.mozeKupiti
                ? "bg-gold text-void"
                : "bg-panel-2 text-gold",
          )}
        >
          {cilj.uGradnji ? "Vidi" : cilj.mozeKupiti ? "Kauba" : "Skupi"}
        </span>
      </button>

      <div className={cn("flex flex-wrap gap-1.5 border-t border-line px-2.5", kompaktna ? "pb-2 pt-1.5" : "pb-2.5 pt-2")}>
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
    </article>
  );
});
