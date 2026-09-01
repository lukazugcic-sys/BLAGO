import { AlertTriangle } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { PrikazCijene } from "./PrikazCijene";
import { ZGRADE_SKINOVI } from "@/lib/game/constants";
import { MREZA_ART, RESURS_ART, ZGRADA_ART } from "@/lib/game/art";
import { izracunajPasivniMnozitelj, izracunajTokMnozitelj, RESOURCE_TICK_MS } from "@/lib/game/economy";
import type { Zgrada } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function BuildingCard({ zgrada, compact }: { zgrada: Zgrada; compact?: boolean }) {
  const zlato = useGameStore((s) => s.zlato);
  const resursi = useGameStore((s) => s.resursi);
  const gradevine = useGameStore((s) => s.gradevine);
  const ostecenja = useGameStore((s) => s.ostecenja);
  const igracRazina = useGameStore((s) => s.igracRazina);
  const prestigeRazina = useGameStore((s) => s.prestigeRazina);
  const kvalitetaSela = useGameStore((s) => s.kvalitetaSela);
  const aktivniSkin = useGameStore((s) => s.aktivniSkin);
  const nadogradiZgradu = useGameStore((s) => s.nadogradiZgradu);
  const popraviZgradu = useGameStore((s) => s.popraviZgradu);

  const pasivniMnozitelj =
    izracunajPasivniMnozitelj(igracRazina, prestigeRazina) * izracunajTokMnozitelj(kvalitetaSela);
  const lv = gradevine[zgrada.id] || 0;
  const jeOstecena = ostecenja[zgrada.id];
  const c = zgrada.cijena(lv + 1);
  const jeMax = lv >= zgrada.maxLv;
  const skin = ZGRADE_SKINOVI.find((s) => s.id === aktivniSkin) ?? ZGRADE_SKINOVI[0]!;
  const skinBoja = skin.boja;
  const SkinIcon = skin.ikona;
  const tickSec = RESOURCE_TICK_MS / 1000;

  const mozeKupiti =
    zlato >= c.zlato &&
    resursi.drvo >= (c.drvo || 0) &&
    resursi.kamen >= (c.kamen || 0) &&
    resursi.zeljezo >= (c.zeljezo || 0);

  const cPopravakZlato = lv * 50;
  const cPopravakDrvo = lv * 20;
  const mozePopraviti = zlato >= cPopravakZlato && resursi.drvo >= cPopravakDrvo;
  const trenutnaProizvodnja = (lv * zgrada.bazaProizvodnja * pasivniMnozitelj).toFixed(1);

  return (
    <article
      id={`zgrada-${zgrada.id}`}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-panel shadow-panel",
        !compact && "mb-2.5 scroll-mt-4",
        jeOstecena && "border-ruby/50",
      )}
      style={
        jeOstecena
          ? undefined
          : {
              borderColor: `${skinBoja}55`,
              boxShadow: jeMax ? `0 0 0 1px ${skinBoja}66` : undefined,
            }
      }
    >
      {compact ? null : (
      <div className="relative h-24 overflow-hidden" aria-hidden>
        <img
          src={ZGRADA_ART[zgrada.id] ?? ZGRADA_ART.pilana}
          alt=""
          draggable={false}
          className="size-full object-cover object-center"
          style={{ filter: skin.nijansa }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: skinBoja, mixBlendMode: "color", opacity: skin.koprena }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
      </div>
      )}
      <div className="relative p-4 pt-3">
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border",
              jeOstecena ? "border-ruby bg-ruby/20" : "border-line",
            )}
            style={
              jeOstecena
                ? undefined
                : { backgroundColor: `${skinBoja}22`, borderColor: `${skinBoja}66` }
            }
          >
            {jeOstecena ? (
              <img src={MREZA_ART.pozar} alt="" className="mreza-glyph size-7" draggable={false} />
            ) : skin.id !== "default" ? (
              <SkinIcon className="size-6" style={{ color: skinBoja }} />
            ) : (
              <img
                src={RESURS_ART[zgrada.id === "pilana" ? "drvo" : zgrada.id === "kamenolom" ? "kamen" : "zeljezo"]}
                alt=""
                className="village-pixel size-7"
                draggable={false}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className={cn("text-base font-bold", jeOstecena ? "text-ruby" : "text-ink")}>
                {zgrada.naziv}
              </h3>
              <span className="rounded-sm bg-ink/5 px-2.5 py-1 text-[11px] font-bold tabular-nums text-dim">
                LVL {lv}/{zgrada.maxLv}
              </span>
            </div>
            <p className={cn("mt-1.5 text-xs font-semibold", jeOstecena ? "text-ruby" : "text-xp")}>
              {jeOstecena
                ? "U PLAMENU. Proizvodnja stala."
                : lv > 0
                  ? `Proizvodi: +${trenutnaProizvodnja} / ${tickSec}s`
                  : "Zgrada nije izgrađena"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
          {jeOstecena ? (
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-sm bg-ruby px-1.5 py-1 text-[10px] font-bold text-ink">
                <AlertTriangle className="size-3.5" />
                POPRAVAK
              </span>
              <PrikazCijene src={RESURS_ART.zlato} iznos={cPopravakZlato} trenutno={zlato} />
              <PrikazCijene src={RESURS_ART.drvo} iznos={cPopravakDrvo} trenutno={resursi.drvo} />
            </div>
          ) : !jeMax ? (
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <PrikazCijene src={RESURS_ART.zlato} iznos={c.zlato} trenutno={zlato} />
              <PrikazCijene src={RESURS_ART.drvo} iznos={c.drvo} trenutno={resursi.drvo} />
              <PrikazCijene src={RESURS_ART.kamen} iznos={c.kamen} trenutno={resursi.kamen} />
              <PrikazCijene src={RESURS_ART.zeljezo} iznos={c.zeljezo} trenutno={resursi.zeljezo} />
            </div>
          ) : (
            <p className="text-xs font-bold tracking-wide text-gold">MAKSIMALNA RAZINA</p>
          )}

          {jeOstecena ? (
            <button
              type="button"
              onClick={() => popraviZgradu(zgrada)}
              className={cn(
                "min-h-11 rounded-lg px-5 py-3 text-xs font-bold tracking-wide transition-transform duration-150 ease-out active:scale-[0.96]",
                mozePopraviti ? "bg-ruby text-ink" : "bg-panel-2 text-dim",
              )}
            >
              POPRAVI
            </button>
          ) : (
            !jeMax && (
              <button
                type="button"
                onClick={() => nadogradiZgradu(zgrada)}
                className="min-h-11 rounded-lg px-5 py-3 text-xs font-bold tracking-wide text-void transition-transform duration-150 ease-out active:scale-[0.96]"
                style={{
                  backgroundColor: mozeKupiti ? skinBoja : "var(--color-panel-2)",
                  color: mozeKupiti ? "#000" : "var(--color-dim)",
                }}
              >
                {lv === 0 ? "IZGRADI" : "NADOGRADI"}
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
}
