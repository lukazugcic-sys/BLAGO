import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { albumBroj, POTJERNICE, RIJETKOST_REC, SETOVI, potjernicaPoId } from "@/lib/game/potjernice";
import { DOSTIGNUCA, napredakDostignuca, sljedecaZvijezda, snapshotDostignuca } from "@/lib/game/dostignuca";
import { jeSideOtkljucan } from "@/lib/game/sideGate";
import { SYMBOL_ART } from "@/lib/game/art";
import { playSfx } from "@/lib/game/audio";
import { IconBadge } from "./IconBadge";
import { NagradaPikseli } from "./NagradaPikseli";
import { JutroPopis } from "./JutroSheet";
import { LiveTicker } from "./LiveTicker";
import { PotjernicaToast } from "./PotjernicaToast";
import { SljedeciCiljCard } from "./SljedeciCiljCard";
import { SideGateKartica } from "./SideGateKartica";
import { KronikaLista } from "./KronikaLista";
import { cn } from "@/lib/utils";
import { raspolozenjeKaube, POTREBE_META, hubZaZgradu, type KaubaUsko } from "@/lib/game/economy";
import { kaubaOd } from "@/lib/game/ljudi";
import { serifPlakati } from "@/lib/game/dijalozi";
import { CILJ_EVENT } from "@/lib/game/sljedeciCilj";
import { jeSerifovaPoruka } from "./ObavijestSloj";
import { EventKartica } from "./EventKartica";
import { ZGRADE, type TabId } from "@/lib/game/constants";
import { TokRadial } from "./TokRadial";
import { idi, tokMeniEkran, tokMeniZaPlakat, TOK_HOLD_PX, IDI_EVENT, type IdiDetail, type TokMeniStavka } from "@/lib/game/tokMeni";
import { HOLD_KADAR_MS, holdDosta, osjeti } from "@/lib/game/feel";
import { TjedanTraka } from "./TjedanTraka";
import { EventBanner } from "./EventBanner";
import { useSeasonalEvent } from "@/lib/hooks/useSeasonalEvent";
import type { Gradevine, SimbolId } from "@/lib/game/types";
import type { PotjernicaSet, Rijetkost } from "@/lib/game/potjernice";

function Vidljivo({ children, min = 240 }: { children: ReactNode; min?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vidi, setVidi] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVidi(true);
      return;
    }
    const io = new IntersectionObserver(
      (ents) => {
        if (ents.some((e) => e.isIntersecting)) {
          setVidi(true);
          io.disconnect();
        }
      },
      { rootMargin: "280px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={vidi ? undefined : { minHeight: min }}>
      {vidi ? children : null}
    </div>
  );
}

const PlakatMin = memo(function PlakatMin({
  id,
  ime,
  cijena,
  boja,
  rijetkost,
  k,
  aktivan,
  nova,
  onOdabir,
}: {
  id: string;
  ime: string;
  cijena: number;
  boja: string;
  rijetkost: Rijetkost;
  k: number;
  aktivan: boolean;
  nova: boolean;
  onOdabir: (id: string) => void;
}) {
  const imaGa = k > 0;
  return (
    <button
      type="button"
      onClick={() => onOdabir(id)}
      className={cn(
        "potjernica-min w-full",
        !imaGa && "potjernica-min-prazna",
        aktivan && "potjernica-min-aktivan",
        nova && "potjernica-min-nova",
      )}
      style={imaGa ? { background: `linear-gradient(#e8d2a0, ${boja})` } : undefined}
      aria-label={imaGa ? ime : "Prazan plakat"}
    >
      <span className="potjernica-stem">TRAŽI SE</span>
      <span className="potjernica-ime">{imaGa ? ime : "???"}</span>
      <span className="potjernica-cijena">{imaGa ? `$${cijena}` : RIJETKOST_REC[rijetkost]}</span>
      {k > 1 && <span className="potjernica-n">×{k}</span>}
    </button>
  );
});

const SetKartica = memo(function SetKartica({
  setId,
  naziv,
  nagradaZlato,
  gotov,
  album,
  odabran,
  nova,
  onOdabir,
}: {
  setId: PotjernicaSet;
  naziv: string;
  nagradaZlato: number;
  gotov: boolean;
  album: Record<string, number>;
  odabran: string | null;
  nova: string | null;
  onOdabir: (id: string) => void;
}) {
  const clanovi = POTJERNICE.filter((x) => x.set === setId);
  const ima = clanovi.filter((x) => (album[x.id] ?? 0) > 0).length;
  return (
    <article className="rounded-2xl border border-line bg-panel p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold tracking-widest text-ink uppercase">{naziv}</h3>
        <span className={cn("text-[10px] font-bold uppercase", gotov ? "text-quest" : "text-dim")}>
          {gotov ? "Skupljeno" : `${ima}/${clanovi.length} · +${nagradaZlato}g`}
        </span>
      </div>
      <span className="zid-traka mb-2 block h-1 overflow-hidden rounded-full bg-void">
        <span className="block h-full rounded-full bg-gold" style={{ width: `${Math.round((ima / clanovi.length) * 100)}%` }} />
      </span>
      <ul className="grid grid-cols-4 gap-1.5">
        {clanovi.map((x) => (
          <li key={x.id}>
            <PlakatMin
              id={x.id}
              ime={x.ime}
              cijena={x.cijena}
              boja={x.boja}
              rijetkost={x.rijetkost}
              k={album[x.id] ?? 0}
              aktivan={odabran === x.id}
              nova={nova === x.id}
              onOdabir={onOdabir}
            />
          </li>
        ))}
      </ul>
    </article>
  );
});

const ZvijezdaGumb = memo(function ZvijezdaGumb({
  id,
  naziv,
  art,
  otk,
  aktivan,
  onOdabir,
}: {
  id: string;
  naziv: string;
  art: SimbolId;
  otk: boolean;
  aktivan: boolean;
  onOdabir: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOdabir(id)}
      className={cn(
        "zvijezda-plaketa w-full",
        otk ? "zvijezda-plaketa-stoji" : "zvijezda-plaketa-prazna",
        aktivan && "zvijezda-plaketa-aktivna",
      )}
      aria-label={naziv}
    >
      <IconBadge src={SYMBOL_ART[art]} size="sm" />
    </button>
  );
});

function SerifLista({
  stavke,
  onOtvori,
}: {
  stavke: Array<{ id: string; stem: string; rec: string; alarm?: boolean }>;
  onOtvori: (stem: string, x: number, y: number) => void;
}) {
  const hold = useRef<{ id: string; x: number; y: number; timer: number; opened: boolean; start: number } | null>(null);
  const [drziId, setDrziId] = useState<string | null>(null);
  if (stavke.length === 0) return null;
  return (
    <ul className="serif-zid-lista">
      {stavke.map((p) => (
        <li
          key={p.id}
          className={cn("serif-plakat", p.alarm && "serif-plakat-alarm", drziId === p.id && "chip-drzi")}
          onPointerDown={(e) => {
            if (hold.current?.timer) window.clearTimeout(hold.current.timer);
            setDrziId(p.id);
            hold.current = {
              id: p.id,
              x: e.clientX,
              y: e.clientY,
              opened: false,
              start: Date.now(),
              timer: window.setTimeout(() => {
                const h = hold.current;
                if (!h || h.id !== p.id) return;
                h.opened = true;
                setDrziId(null);
                onOtvori(p.stem, h.x, h.y);
              }, HOLD_KADAR_MS),
            };
          }}
          onPointerMove={(e) => {
            const h = hold.current;
            if (!h || h.opened || h.id !== p.id) return;
            if (Math.hypot(e.clientX - h.x, e.clientY - h.y) > TOK_HOLD_PX) {
              window.clearTimeout(h.timer);
              hold.current = null;
              setDrziId(null);
            }
          }}
          onPointerUp={() => {
            const h = hold.current;
            if (!h || h.id !== p.id) return;
            window.clearTimeout(h.timer);
            const opened = h.opened || holdDosta(h.start, HOLD_KADAR_MS);
            if (opened && !h.opened) onOtvori(p.stem, h.x, h.y);
            hold.current = null;
            setDrziId(null);
          }}
          onPointerCancel={() => {
            const h = hold.current;
            if (h?.timer) window.clearTimeout(h.timer);
            hold.current = null;
            setDrziId(null);
          }}
        >
          <span className="serif-plakat-stem">{p.stem}</span>
          <span className="serif-plakat-rec">{p.rec}</span>
        </li>
      ))}
    </ul>
  );
}

export function ZidScreen({ naTab }: { naTab?: (id: TabId) => void }) {
  const album = useGameStore((s) => s.potjernice);
  const setovi = useGameStore((s) => s.potjerniceSetovi);
  const nova = useGameStore((s) => s.novaPotjernica);
  const done = useGameStore((s) => s.dostignucaDone);
  const ulaz = useGameStore(useShallow(snapshotDostignuca));
  const sideOtkljucan = useGameStore((s) => jeSideOtkljucan(s.gradevine));
  const ostecenja = useGameStore((s) => s.ostecenja);
  const moodKljuc = useGameStore((s) => {
    const m = raspolozenjeKaube(
      kaubaOd({
        gradevine: s.gradevine,
        stanovnici: s.stanovnici,
        zamjenici: s.zamjenici,
        konjiBroj: s.konjiBroj,
        konjiDuznost: s.konjiDuznost,
        sijenoDo: s.sijenoDo,
        kisaDo: s.kisaDo,
        govedaBroj: s.govedaBroj,
        govedaDuznost: s.govedaDuznost,
        celijaBroj: s.celijaBroj,
      }),
    );
    return `${m.id}\u0000${m.usko ?? ""}\u0000${m.rec}`;
  });
  const [odabran, setOdabran] = useState<string | null>(nova);
  const [zvijezdaId, setZvijezdaId] = useState<string | null>(null);
  const poruka = useGameStore((s) => s.poruka);
  const dogadaj = useGameStore((s) => s.dogadaj);
  const rijesiDogadaj = useGameStore((s) => s.rijesiDogadaj);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
  const zidRef = useRef<HTMLDivElement>(null);
  const [meni, setMeni] = useState<{ stem: string; x: number; y: number; w: number; h: number } | null>(null);
  useEffect(() => {
    if (nova) setOdabran(nova);
  }, [nova]);
  useEffect(() => {
    const on = (e: Event) => {
      const kamo = (e as CustomEvent<IdiDetail>).detail?.zid;
      if (!kamo) return;
      const el = document.getElementById(kamo === "kronika" ? "zid-kronika" : "zid-cilj");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener(IDI_EVENT, on);
    return () => window.removeEventListener(IDI_EVENT, on);
  }, []);
  const n = albumBroj(album);
  const ukupno = POTJERNICE.length;
  const p = odabran ? potjernicaPoId(odabran) : null;
  const imaOdabran = p ? (album[p.id] ?? 0) > 0 : false;
  const zvijezde = useMemo(() => DOSTIGNUCA.reduce((a, d) => a + (done[d.id] ? 1 : 0), 0), [done]);
  const odabrana = zvijezdaId ? DOSTIGNUCA.find((d) => d.id === zvijezdaId) ?? null : null;
  const sljedeca = sljedecaZvijezda(ulaz, done);
  const [moodId, moodUsko, moodRec] = moodKljuc.split("\u0000");
  const aktivniDogadaj = useSeasonalEvent();
  const gorece = ZGRADE.filter((z) => ostecenja[z.id]);
  const obavijesti = serifPlakati({
    poruka,
    serifova: !!poruka && jeSerifovaPoruka(poruka),
    mood: moodId ?? "mir",
    usko: moodUsko ? (moodUsko as KaubaUsko) : null,
    danKey: new Date().toISOString().slice(0, 10),
  });

  const odaberiPlakat = useCallback((id: string) => {
    playSfx("button");
    setZvijezdaId(null);
    setOdabran((cur) => (cur === id ? null : id));
  }, []);
  const odaberiZvijezdu = useCallback((id: string) => {
    playSfx("button");
    setOdabran(null);
    setZvijezdaId((cur) => (cur === id ? null : id));
  }, []);

  const idiNaZgradu = (id: keyof Gradevine) => {
    playSfx("button");
    naTab?.("selo");
    const hub = hubZaZgradu(id);
    if (hub) idi({ tab: "selo", hub });
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(CILJ_EVENT + ":scroll", { detail: { id } }));
    }, 80);
  };

  const idiNaHub = (usko: KaubaUsko | null) => {
    playSfx("button");
    naTab?.("selo");
    if (!usko) return;
    const z = POTREBE_META.find((x) => x.id === usko)?.zgrade[0];
    if (!z) return;
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(CILJ_EVENT + ":scroll", { detail: { id: z } }));
    }, 80);
  };

  const otvoriPlakat = (stem: string, x: number, y: number) => {
    playSfx("button");
    osjeti("hold");
    const ekran = tokMeniEkran(x, y);
    setMeni({
      stem,
      x: ekran.x,
      y: ekran.y,
      w: ekran.w,
      h: ekran.h,
    });
  };

  const naPlakat = (s: TokMeniStavka) => {
    setMeni(null);
    const a = s.akcija;
    if (a.vrsta === "info") return;
    if (a.vrsta === "tab") {
      if (a.tab === "zid") return;
      idi({ tab: a.tab });
    } else if (a.vrsta === "hub") idi({ tab: "selo", hub: a.hub });
    else if (a.vrsta === "pohod") setRaidAktivan(true);
    else if (a.vrsta === "trg") idi({ tab: "selo", trg: true });
  };

  return (
    <div ref={zidRef} className="relative flex flex-col gap-3 px-3 pb-8 pt-1">
      <div id="zid-cilj">
        <SljedeciCiljCard />
      </div>
      <button
        type="button"
        className="zid-mood w-full rounded-2xl border border-gold/40 bg-gold/10 px-3 py-2.5 text-left"
        onClick={() => idiNaHub(moodUsko ? (moodUsko as KaubaUsko) : null)}
      >
        <p className="text-[10px] font-bold tracking-[0.22em] text-gold uppercase">Kauba</p>
        <p className="mt-0.5 text-sm font-bold leading-snug text-ink">{moodRec}</p>
        {moodUsko ? (
          <p className="mt-1 text-[11px] font-bold text-dim">Dodirni — idi tamo.</p>
        ) : (
          <p className="mt-1 text-[11px] font-bold text-dim">Sve stoji kako treba.</p>
        )}
      </button>

      <TjedanTraka
        ceker
        onOtvori={() => {
          playSfx("button");
          naTab?.("trznica");
        }}
      />
      <EventBanner dogadaj={aktivniDogadaj} />

      {gorece.length > 0 && (
        <div className="flex flex-col gap-1.5" data-testid="zid-gori">
          {gorece.map((z) => (
            <button
              key={z.id}
              type="button"
              className="zid-gori"
              onClick={() => idiNaZgradu(z.id)}
            >
              <span className="zid-gori-stem">Požar</span>
              <span className="zid-gori-rec">{z.naziv} gori.</span>
              <span className="zid-gori-put">Dodirni — idi do zgrade.</span>
            </button>
          ))}
        </div>
      )}

      <section className="serif-zid" data-testid="serif-zid">
        <p className="serif-zid-naslov">Obavijesti šerifa</p>
        <div className="serif-zid-zivo">
          <LiveTicker />
          <PotjernicaToast />
        </div>
        {dogadaj && (
          <div className="serif-zid-cin" data-testid="serif-zid-cin">
            <EventKartica d={dogadaj} onOpcija={rijesiDogadaj} />
          </div>
        )}
        <SerifLista stavke={obavijesti.slice(0, 4)} onOtvori={otvoriPlakat} />
        {obavijesti.length > 4 ? (
          <Vidljivo min={160}>
            <SerifLista stavke={obavijesti.slice(4)} onOtvori={otvoriPlakat} />
          </Vidljivo>
        ) : null}
      </section>
      {meni && (
        <TokRadial
          x={meni.x}
          y={meni.y}
          sirina={meni.w}
          visina={meni.h}
          stavke={tokMeniZaPlakat(meni.stem)}
          polukrug
          onOdabir={naPlakat}
          onZatvori={() => setMeni(null)}
        />
      )}

      <Vidljivo min={220}>
        <JutroPopis naTab={naTab} />
      </Vidljivo>

      {!sideOtkljucan ? (
        <SideGateKartica naslov="Zid · potjernice" />
      ) : (
        <>
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

      {SETOVI.map((set, i) => {
        const kartica = (
          <SetKartica
            key={set.id}
            setId={set.id}
            naziv={set.naziv}
            nagradaZlato={set.nagrada.zlato}
            gotov={setovi.includes(set.id)}
            album={album}
            odabran={odabran}
            nova={nova}
            onOdabir={odaberiPlakat}
          />
        );
        return i === 0 ? kartica : (
          <Vidljivo key={set.id} min={210}>
            {kartica}
          </Vidljivo>
        );
      })}

      <Vidljivo min={280}>
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
          {DOSTIGNUCA.map((d) => (
            <li key={d.id}>
              <ZvijezdaGumb
                id={d.id}
                naziv={d.naziv}
                art={d.art}
                otk={!!done[d.id]}
                aktivan={zvijezdaId === d.id}
                onOdabir={odaberiZvijezdu}
              />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] font-bold leading-relaxed text-dim">
          Vrti. Na dobitku ponekad padne plakat. Zvijezdu Boro zabije kad stigne.
        </p>
      </article>
      </Vidljivo>
        </>
      )}
      {sideOtkljucan ? (
        <Vidljivo min={320}>
          <div id="zid-kronika" className="mt-1">
            <KronikaLista />
          </div>
        </Vidljivo>
      ) : null}
    </div>
  );
}
