import { Crown } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { BuildingCard } from "./BuildingCard";
import { ZGRADE, ZGRADE_SKINOVI } from "@/lib/game/constants";
import { ART, SYMBOL_ART } from "@/lib/game/art";
import { stavOd } from "@/lib/game/kronika";
import { MrezaSela } from "./MrezaSela";
import { IconBadge } from "./IconBadge";
import { VideoLoop } from "./VideoLoop";

export function VillageScreen() {
  const gradevine = useGameStore((s) => s.gradevine);
  const ostecenja = useGameStore((s) => s.ostecenja);
  const izvrsiPrestige = useGameStore((s) => s.izvrsiPrestige);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
  const kronika = useGameStore((s) => s.kronika);
  const stavSela = useGameStore((s) => s.stavSela);
  const aktivniSkin = useGameStore((s) => s.aktivniSkin);
  const stav = stavOd(stavSela);
  const skin = ZGRADE_SKINOVI.find((s) => s.id === aktivniSkin) ?? ZGRADE_SKINOVI[0]!;
  const spremanZaPrestige =
    gradevine.pilana === ZGRADE[0]!.maxLv &&
    gradevine.kamenolom === ZGRADE[1]!.maxLv &&
    gradevine.rudnik === ZGRADE[2]!.maxLv;
  const gori = ostecenja.pilana || ostecenja.kamenolom || ostecenja.rudnik;

  return (
    <div className="mx-auto w-full max-w-lg px-3 pb-8 pt-2">
      <section
        className="kauba-hero relative mb-3 min-h-[12.5rem] overflow-hidden rounded-2xl border"
        style={{ borderColor: `${skin.boja}66` }}
      >
        <VideoLoop src={ART.seloVideo} poster={ART.cabin} style={{ filter: skin.nijansa }} />
        <VideoLoop
          src={ART.vatra}
          className="pointer-events-none absolute inset-0 opacity-45 mix-blend-screen"
          style={{ filter: skin.nijansa }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: skin.boja, mixBlendMode: "color", opacity: skin.koprena }}
        />
        <div className="kauba-hero-veil" />
        <div className="relative z-[1] flex h-full min-h-[12.5rem] items-end gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-[0.28em] uppercase" style={{ color: skin.boja }}>
              {skin.naziv}
            </p>
            <p className="text-lg font-bold leading-tight text-ink">Brončani tabor</p>
            {stav && (
              <p className="mt-1 truncate text-xs font-bold text-dim">
                {stav.naziv} · {stav.moto}
              </p>
            )}
          </div>
          {gori && (
            <button
              type="button"
              onClick={() => setRaidAktivan(true)}
              className="min-h-11 shrink-0 rounded-xl bg-ruby px-3 text-xs font-bold tracking-widest text-ink"
            >
              POHOD
            </button>
          )}
        </div>
      </section>
      <MrezaSela />
      {ZGRADE.map((z) => (
        <BuildingCard key={z.id} zgrada={z} />
      ))}
      {kronika.length > 0 && (
        <article className="mt-2.5 rounded-2xl border border-line bg-panel p-4">
          <h3 className="mb-3 text-xs font-bold tracking-widest text-dim uppercase">Kronika kaube</h3>
          <ul className="flex flex-col gap-2.5">
            {kronika.map((z) => {
              const s = stavOd(z.stav);
              return (
                <li key={z.id} className="flex gap-2.5">
                  <IconBadge
                    src={SYMBOL_ART[s?.art ?? (z.pobjeda ? "skull" : "shield")]}
                    size="sm"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold tracking-wide text-dim uppercase">
                      {z.pobjeda ? "Pohod" : "Obrana"} · {s?.naziv}
                    </span>
                    <span className="block text-sm leading-snug text-ink">{z.recap}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </article>
      )}
      {spremanZaPrestige && (
        <article
          className="relative mt-2.5 overflow-hidden rounded-2xl border border-prestige p-5"
          style={{
            backgroundImage: `linear-gradient(180deg, color-mix(in oklab, var(--color-void) 35%, transparent), color-mix(in oklab, var(--color-void) 82%, #0e2a28)), url(${ART.snow})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="mb-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full border border-prestige bg-prestige/20">
              <Crown className="size-6 text-prestige" />
            </div>
            <div>
              <h3 className="text-base font-bold text-prestige">KRUNIDBA</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-dim">
                Resetiraj bazu i vrati se na razinu 1, ali zadrži trajni ×1,5 množitelj na sve
                nagrade i proizvodnju. Pilana ostaje stojeća.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={izvrsiPrestige}
            className="min-h-11 w-full rounded-lg bg-prestige py-3 text-sm font-bold text-void transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            IZVRŠI KRUNIDBU
          </button>
        </article>
      )}
    </div>
  );
}
