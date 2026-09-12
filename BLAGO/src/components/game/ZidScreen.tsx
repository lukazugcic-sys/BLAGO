import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/lib/stores/gameStore";
import { albumBroj, POTJERNICE, RIJETKOST_REC, SETOVI, potjernicaPoId } from "@/lib/game/potjernice";
import { DOSTIGNUCA, napredakDostignuca, sljedecaZvijezda, snapshotDostignuca } from "@/lib/game/dostignuca";
import { SYMBOL_ART } from "@/lib/game/art";
import { playSfx } from "@/lib/game/audio";
import { IconBadge } from "./IconBadge";
import { NagradaPikseli } from "./NagradaPikseli";
import { cn } from "@/lib/utils";

export function ZidScreen() {
  const album = useGameStore((s) => s.potjernice);
  const setovi = useGameStore((s) => s.potjerniceSetovi);
  const nova = useGameStore((s) => s.novaPotjernica);
  const done = useGameStore((s) => s.dostignucaDone);
  const ulaz = useGameStore(useShallow(snapshotDostignuca));
  const [odabran, setOdabran] = useState<string | null>(nova);
  const [zvijezdaId, setZvijezdaId] = useState<string | null>(null);
  useEffect(() => {
    if (nova) setOdabran(nova);
  }, [nova]);
  const n = albumBroj(album);
  const ukupno = POTJERNICE.length;
  const p = odabran ? potjernicaPoId(odabran) : null;
  const imaOdabran = p ? (album[p.id] ?? 0) > 0 : false;
  const zvijezde = useMemo(() => DOSTIGNUCA.reduce((a, d) => a + (done[d.id] ? 1 : 0), 0), [done]);
  const odabrana = zvijezdaId ? DOSTIGNUCA.find((d) => d.id === zvijezdaId) ?? null : null;
  const sljedeca = sljedecaZvijezda(ulaz, done);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <p className="text-[11px] font-bold tracking-widest text-gold uppercase">Zid šerifa</p>
        <p className="text-[11px] font-bold tabular-nums text-dim">
          {n}/{ukupno} plakata · {zvijezde}/{DOSTIGNUCA.length} zvijezda
        </p>
      </div>

      {p && (
        <article
          className={cn("zid-plakat rounded-2xl border p-3", imaOdabran ? "border-gold/50 bg-gold/10" : "border-line bg-panel")}
        >
          <div className="flex gap-3">
            <span
              className={cn("potjernica-list shrink-0", !imaOdabran && "potjernica-min-prazna")}
              style={imaOdabran ? { background: `linear-gradient(#e8d2a0, ${p.boja})` } : undefined}
            >
              <span className="potjernica-stem">TRAŽI SE</span>
              <span className="potjernica-ime">{imaOdabran ? p.ime : "???"}</span>
              <span className="potjernica-cijena">{imaOdabran ? `$${p.cijena}` : RIJETKOST_REC[p.rijetkost]}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-widest text-dim uppercase">
                {SETOVI.find((s) => s.id === p.set)?.naziv} · {RIJETKOST_REC[p.rijetkost]}
              </p>
              <h3 className="text-sm font-bold text-ink">{imaOdabran ? p.ime : "Lice se ne vidi."}</h3>
              <p className="mt-1 text-xs leading-snug text-dim">{imaOdabran ? p.rec : "Vrti. Boro lijepi kad padne."}</p>
              {imaOdabran && (album[p.id] ?? 0) > 1 && (
                <p className="mt-1 text-[11px] font-bold text-gold">Duplikat ×{album[p.id]}. Boro slaže kopije.</p>
              )}
            </div>
          </div>
        </article>
      )}

      {SETOVI.map((set) => {
        const clanovi = POTJERNICE.filter((x) => x.set === set.id);
        const ima = clanovi.filter((x) => (album[x.id] ?? 0) > 0).length;
        const gotov = setovi.includes(set.id);
        return (
          <article key={set.id} className="rounded-2xl border border-line bg-panel p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold tracking-widest text-ink uppercase">{set.naziv}</h3>
              <span className={cn("text-[10px] font-bold uppercase", gotov ? "text-quest" : "text-dim")}>
                {gotov ? "Skupljeno" : `${ima}/${clanovi.length} · +${set.nagrada.zlato}g`}
              </span>
            </div>
            <span className="zid-traka mb-2 block h-1 overflow-hidden rounded-full bg-void">
              <span
                className="block h-full rounded-full bg-gold"
                style={{ width: `${Math.round((ima / clanovi.length) * 100)}%` }}
              />
            </span>
            <ul className="grid grid-cols-4 gap-1.5">
              {clanovi.map((x) => {
                const k = album[x.id] ?? 0;
                const imaGa = k > 0;
                const aktivan = odabran === x.id;
                return (
                  <li key={x.id}>
                    <button
                      type="button"
                      onClick={() => {
                        playSfx("button");
                        setZvijezdaId(null);
                        setOdabran((id) => (id === x.id ? null : x.id));
                      }}
                      className={cn(
                        "potjernica-min w-full",
                        !imaGa && "potjernica-min-prazna",
                        aktivan && "potjernica-min-aktivan",
                        nova === x.id && "potjernica-min-nova",
                      )}
                      style={imaGa ? { background: `linear-gradient(#e8d2a0, ${x.boja})` } : undefined}
                      aria-label={imaGa ? x.ime : "Prazan plakat"}
                    >
                      <span className="potjernica-stem">TRAŽI SE</span>
                      <span className="potjernica-ime">{imaGa ? x.ime : "???"}</span>
                      <span className="potjernica-cijena">{imaGa ? `$${x.cijena}` : RIJETKOST_REC[x.rijetkost]}</span>
                      {k > 1 && <span className="potjernica-n">×{k}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}

      <article className="rounded-2xl border border-gold/35 bg-panel p-3">
        <div className="mb-2 flex items-end justify-between">
          <h3 className="text-xs font-bold tracking-widest text-gold uppercase">Zvijezde kaube</h3>
          <span className="text-[10px] font-bold tabular-nums text-dim">
            {zvijezde}/{DOSTIGNUCA.length}
          </span>
        </div>
        {odabrana && (
          <div className="mb-2 rounded-xl border border-gold/35 bg-gold/10 p-2.5">
            <div className="flex items-center gap-2">
              <IconBadge src={SYMBOL_ART[odabrana.art]} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-gold">{odabrana.naziv}</span>
                <span className="block text-[11px] leading-snug text-dim">
                  {done[odabrana.id] ? odabrana.opis : "Još nije. Boro čeka."}
                </span>
              </span>
              {done[odabrana.id] ? (
                <NagradaPikseli nagrada={odabrana.nagrada} compact />
              ) : (
                <span className="shrink-0 text-[10px] font-bold tabular-nums text-dim">
                  {Math.min(napredakDostignuca(ulaz, odabrana).trenutno, odabrana.cilj)}/{odabrana.cilj}
                </span>
              )}
            </div>
            {!done[odabrana.id] && (
              <span className="zid-traka mt-2 block h-1 overflow-hidden rounded-full bg-void">
                <span
                  className="block h-full rounded-full bg-gold"
                  style={{
                    width: `${Math.min(100, Math.round((napredakDostignuca(ulaz, odabrana).trenutno / Math.max(1, odabrana.cilj)) * 100))}%`,
                  }}
                />
              </span>
            )}
          </div>
        )}
        {!odabrana && sljedeca && (
          <p className="mb-2 text-[11px] font-bold leading-snug text-dim">
            Sljedeća: {sljedeca.naziv} · {Math.min(napredakDostignuca(ulaz, sljedeca).trenutno, sljedeca.cilj)}/
            {sljedeca.cilj}
          </p>
        )}
        <ul className="grid grid-cols-5 gap-1.5">
          {DOSTIGNUCA.map((d) => {
            const otk = !!done[d.id];
            const aktivan = zvijezdaId === d.id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => {
                    playSfx("button");
                    setOdabran(null);
                    setZvijezdaId((id) => (id === d.id ? null : d.id));
                  }}
                  className={cn(
                    "zvijezda-plaketa w-full",
                    otk ? "zvijezda-plaketa-stoji" : "zvijezda-plaketa-prazna",
                    aktivan && "zvijezda-plaketa-aktivna",
                  )}
                  aria-label={d.naziv}
                >
                  <IconBadge src={SYMBOL_ART[d.art]} size="sm" />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11px] font-bold leading-relaxed text-dim">
          Vrti. Na dobitku ponekad padne plakat. Zvijezdu Boro zabije kad stigne.
        </p>
      </article>
    </div>
  );
}
