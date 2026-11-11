import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Minus } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { IconBadge } from "./IconBadge";
import { ScreenTabs } from "./ScreenTabs";
import { SideGateKartica } from "./SideGateKartica";
import { jeSideOtkljucan, SIDE_GATE_REC } from "@/lib/game/sideGate";
import { UpgradesScreen } from "./UpgradesScreen";
import { KaravanaIgra } from "./KaravanaIgra";
import { LivePohod } from "./LivePohod";
import { ZGRADE_SKINOVI } from "@/lib/game/constants";
import { ART, RESURS_ART, SYMBOL_ART, ZGRADA_ART } from "@/lib/game/art";
import { ArtTraka } from "./ArtTraka";
import type { TrznicaId } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { playSfx, vibrate } from "@/lib/game/audio";
import { sajamCijena, tjedanSad } from "@/lib/game/tjedan";
import { IDI_EVENT, type IdiDetail } from "@/lib/game/tokMeni";

import { HOLD_AUTO_MS } from "@/lib/game/feel";

const MNOZ = [1, 10, 30, 50, 100] as const;
const HOLD_MS = HOLD_AUTO_MS;
const REPEAT_MS = 170;

const RESURSI: Array<{ id: TrznicaId; n: string; art: string }> = [
  { id: "drvo", n: "Drvo", art: RESURS_ART.drvo },
  { id: "kamen", n: "Kamen", art: RESURS_ART.kamen },
  { id: "zeljezo", n: "Željezo", art: RESURS_ART.zeljezo },
  { id: "dijamant", n: "Dijamant", art: RESURS_ART.dijamant },
];

const TABS = [
  { id: "burza", label: "Burza" },
  { id: "alati", label: "Alati" },
  { id: "izgled", label: "Izlog" },
  { id: "karavana", label: "Karavana" },
  { id: "uzivo", label: "Uživo" },
] as const;

function genitivZalihe(id: TrznicaId, n: number) {
  if (id === "dijamant") return n === 1 ? "dijamant" : n < 5 ? "dijamanta" : "dijamanata";
  if (id === "drvo") return "drva";
  if (id === "kamen") return n === 1 ? "kamen" : "kamena";
  return "željeza";
}

export function ShopScreen() {
  const [sekcija, setSekcija] = useState<(typeof TABS)[number]["id"]>("burza");
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<IdiDetail>).detail;
      const id = d?.trznica ?? (d?.zadaci === "karavana" || d?.zadaci === "uzivo" ? d.zadaci : undefined);
      if (id === "burza" || id === "alati" || id === "izgled" || id === "karavana" || id === "uzivo") {
        setSekcija(id);
      }
    };
    window.addEventListener(IDI_EVENT, on);
    return () => window.removeEventListener(IDI_EVENT, on);
  }, []);
  const [mnoz, setMnoz] = useState<(typeof MNOZ)[number]>(10);
  const [prodajPotvrda, setProdajPotvrda] = useState<string | null>(null);
  const tecaj = useGameStore((s) => s.tecaj);
  const trend = useGameStore((s) => s.trend);
  const dijamanti = useGameStore((s) => s.dijamanti);
  const zlato = useGameStore((s) => Math.floor(s.zlato));
  const drvo = useGameStore((s) => Math.floor(s.resursi.drvo));
  const kamen = useGameStore((s) => Math.floor(s.resursi.kamen));
  const zeljezo = useGameStore((s) => Math.floor(s.resursi.zeljezo));
  const metci = useGameStore((s) => s.metci);
  const aktivniSkin = useGameStore((s) => s.aktivniSkin);
  const skinovi = useGameStore((s) => s.skinovi);
  const kupiSkin = useGameStore((s) => s.kupiSkin);
  const otkljucan = useGameStore((s) => jeSideOtkljucan(s.gradevine));
  const setPoruka = useGameStore((s) => s.setPoruka);

  if (!otkljucan) {
    return (
      <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col px-3 pt-2">
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <ArtTraka src={ART.trznica} label="Tržnica" />
          <SideGateKartica naslov="Tržnica" />
        </div>
      </div>
    );
  }

  return (
    <div className="trznica mx-auto flex h-full min-h-0 w-full max-w-lg flex-col px-3 pt-2">
      <h2 className="px-1 text-sm font-bold tracking-widest text-ink uppercase">Tržnica</h2>
      <div className="trznica-tijelo min-h-0 flex-1 overflow-y-auto pb-2">
      {(sekcija === "burza" || sekcija === "alati" || sekcija === "izgled") && (
        <ArtTraka src={ART.trznica} label="Tržnica" />
      )}

      {sekcija === "karavana" && (otkljucan ? <KaravanaIgra /> : <SideGateKartica naslov="Karavana" />)}
      {sekcija === "uzivo" && (otkljucan ? <LivePohod /> : <SideGateKartica naslov="Uživo" />)}

      {sekcija === "alati" && <UpgradesScreen embedded />}

      {sekcija === "burza" && (
        <>
          <div className="mb-2 ml-1 flex items-end justify-between gap-2">
            <div>
            <h2 className="text-sm font-bold tracking-widest text-ink uppercase">Mjenjačnica</h2>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-dim">
              {zlato}
              <IconBadge src={SYMBOL_ART.gold} size="xs" />
            </p>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {MNOZ.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    playSfx("button");
                    setMnoz(n);
                  }}
                  className={cn(
                    "min-h-11 min-w-11 rounded-full px-2.5 text-[11px] font-bold tracking-wide",
                    mnoz === n ? "bg-gold text-void" : "border border-line bg-panel-2 text-ink",
                  )}
                >
                  ×{n}
                </button>
              ))}
            </div>
          </div>
          {RESURSI.map((r) => {
            const lot = mnoz;
            const sajam = tjedanSad().vrsta === "sajam";
            const cijenaKupi = sajamCijena("kupi", tecaj[r.id].kupi, sajam) * lot;
            const cijenaProdaj = sajamCijena("prodaj", tecaj[r.id].prodaj, sajam) * lot;
            const jedKupi = sajamCijena("kupi", tecaj[r.id].kupi, sajam);
            const jedProdaj = sajamCijena("prodaj", tecaj[r.id].prodaj, sajam);
            const tr = trend[r.id];
            const TrendIkona = tr === 1 ? ArrowUpRight : tr === -1 ? ArrowDown : Minus;
            const ima = r.id === "dijamant" ? dijamanti : r.id === "drvo" ? drvo : r.id === "kamen" ? kamen : zeljezo;
            const sveZa = Math.round(jedProdaj * ima);
            const sveIme = genitivZalihe(r.id, ima);
            const udioZalihe = 1;
            const trebaPotvrdu = r.id === "dijamant" || udioZalihe > 0.5;
            const trendRec = tr === 1 ? "Cijena raste" : tr === -1 ? "Cijena pada" : "Cijena miruje";
            return (
              <article key={r.id} className="trznica-red">
                <IconBadge src={r.art} size="md" className="trznica-iko" />
                <div className="min-w-0">
                  <h3 className="text-[13px] font-bold text-ink">{r.n}</h3>
                  <p className="text-[11px] font-semibold text-ink">Imaš {ima}</p>
                  <p className="text-[11px] font-bold text-ink">
                    Prodaj {jedProdaj} · Kupi {jedKupi}
                    {sajam ? " · sajam" : ""}
                  </p>
                </div>
                {tr !== 0 ? (
                <span className={cn("trznica-trend", tr === 1 && "is-gore", tr === -1 && "is-dolje")} title={trendRec}>
                  <TrendIkona className="size-4" strokeWidth={2.5} aria-label={trendRec} />
                </span>
                ) : <span className="trznica-trend" aria-hidden />}
                <div className="trznica-gumbi">
                  <HoldTradeButton
                    akcija="prodaj"
                    resurs={r.id}
                    lot={lot}
                    cijena={cijenaProdaj}
                    klasa="trznica-prodaj"
                    naslov="PRODAJ"
                    naslovBoja="text-void"
                    onemogucen={ima < lot}
                    oznaka={r.id === "drvo" ? "burza" : undefined}
                  />
                  {ima < lot && <p className="trznica-razlog">Imaš samo {ima}.</p>}
                  {ima > 0 && ima < lot && (
                    <button
                      type="button"
                      onClick={() => {
                        playSfx("button");
                        if (trebaPotvrdu && prodajPotvrda !== r.id) {
                          setProdajPotvrda(r.id);
                          return;
                        }
                        setProdajPotvrda(null);
                        useGameStore.getState().trgovina("prodaj", r.id, ima);
                      }}
                      className="trznica-sve"
                    >
                      {prodajPotvrda === r.id ? `Prodati ${ima} ${sveIme} za ${sveZa} zlata?` : `Prodaj sve (${ima})`}
                    </button>
                  )}
                  <HoldTradeButton
                    akcija="kupi"
                    resurs={r.id}
                    lot={lot}
                    cijena={cijenaKupi}
                    klasa="trznica-kupi"
                    naslov="KUPI"
                    naslovBoja="text-ink"
                    onemogucen={zlato < cijenaKupi}
                  />
                  {zlato < cijenaKupi && <p className="trznica-razlog">Imaš samo {zlato} zlata</p>}
                </div>
              </article>
            );
          })}
          <article className="mb-3.5 rounded-2xl border border-line bg-panel p-4 shadow-panel" data-testid="kupi-metke">
            <h3 className="text-base font-bold text-ink">Metci</h3>
            <p className="mt-0.5 text-[11px] font-semibold text-dim">imaš {metci} · 6 za 12 zlata</p>
            <button
              type="button"
              disabled={zlato < 12}
              onClick={() => {
                playSfx("button");
                useGameStore.getState().kupiMetke();
              }}
              className="mt-3 min-h-11 w-full rounded-xl bg-gold text-xs font-bold tracking-widest text-void uppercase disabled:bg-panel-2 disabled:text-dim"
            >
              Kupi 6
            </button>
          </article>
        </>
      )}

      {sekcija === "izgled" && (
        <>
          <div className="mb-2 ml-1 flex items-end justify-between">
            <h2 className="text-sm font-bold tracking-widest text-ink uppercase">Izgled kaube</h2>
            <span className="text-[11px] font-semibold text-dim">Boja cijele igre</span>
          </div>
          <p className="mb-3.5 ml-1 text-[11px] text-ink">
            Kupi jednom, pa biraj. Nijansa ide na HUD, vrtnju, kaubu i tržnicu.
          </p>
          <div className="trznica-mreza">
          {ZGRADE_SKINOVI.map((skin) => {
            const aktivan = aktivniSkin === skin.id;
            const ima = skinovi.includes(skin.id) || skin.cijenaDijamanti === 0;
            const mozePlatiti = ima || dijamanti >= skin.cijenaDijamanti;
            const SkinIkona = skin.ikona;
            const t = skin.tema;
            return (
              <article
                key={skin.id}
                className={cn("trznica-kartica", aktivan && "is-aktivna")}
              >
                <div className="relative h-16 overflow-hidden">
                  <img
                    src={ZGRADA_ART.kuca}
                    alt=""
                    draggable={false}
                    className="size-full object-cover"
                    style={{ filter: skin.nijansa }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: skin.boja, mixBlendMode: "color", opacity: skin.koprena }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-panel via-panel/50 to-transparent" />
                  <div className="absolute bottom-2 right-3 flex gap-1">
                    {[t.void, t.gold, t.energy, t.xp].map((c) => (
                      <span
                        key={c}
                        className="size-3.5 rounded-full border border-ink/40"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="trznica-izlog-red">
                <div className="flex items-center gap-3.5">
                  <span
                    className="flex size-11 items-center justify-center rounded-full border"
                    style={{ borderColor: `${skin.boja}66`, backgroundColor: `${skin.boja}22` }}
                  >
                    <SkinIkona className="size-5" style={{ color: skin.boja }} strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{skin.naziv}</p>
                    <p className="mt-0.5 text-[11px] font-bold tracking-wider uppercase" style={{ color: skin.boja }}>
                      {skin.opis}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-gem">
                      {skin.cijenaDijamanti === 0 ? (
                        "Besplatno"
                      ) : ima ? (
                        "Tvoje"
                      ) : (
                        <>
                          {skin.cijenaDijamanti}
                          <IconBadge src={SYMBOL_ART.gem} size="xs" />
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {aktivan ? (
                  <span
                    className="trznica-izlog-gumb rounded-lg border px-3 py-2.5 text-center text-xs font-bold"
                    style={{ color: skin.boja, borderColor: `${skin.boja}66`, backgroundColor: `${skin.boja}22` }}
                  >
                    AKTIVAN
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => kupiSkin(skin)}
                    className={cn(
                      "trznica-izlog-gumb min-h-11 w-full rounded-lg border px-3 py-2.5 text-xs font-bold",
                      mozePlatiti ? "text-void" : "border-line bg-panel-2 text-ink",
                    )}
                    style={
                      mozePlatiti
                        ? { backgroundColor: skin.boja, borderColor: skin.boja }
                        : undefined
                    }
                  >
                    {ima ? "ODABERI" : "KUPI"}
                  </button>
                )}
                </div>
              </article>
            );
          })}
          </div>
        </>
      )}
      </div>
      <div className="trznica-tabovi trznica-tabovi-dolje shrink-0">
        <ScreenTabs
          tabs={TABS}
          value={sekcija}
          onChange={setSekcija}
          dolje
          locked={otkljucan ? undefined : { karavana: true, uzivo: true }}
          onLocked={() => setPoruka(SIDE_GATE_REC)}
        />
      </div>
    </div>
  );
}

function HoldTradeButton({
  akcija,
  resurs,
  lot,
  cijena,
  klasa,
  naslov,
  naslovBoja,
  onemogucen = false,
  oznaka,
}: {
  akcija: "kupi" | "prodaj";
  resurs: TrznicaId;
  lot: number;
  cijena: number;
  klasa: string;
  naslov: string;
  naslovBoja: string;
  onemogucen?: boolean;
  oznaka?: string;
}) {
  const trgovina = useGameStore((s) => s.trgovina);
  const holdT = useRef(0);
  const repeatT = useRef(0);
  const holdDone = useRef(false);
  const [drzim, setDrzim] = useState(false);
  const [brzo, setBrzo] = useState(false);
  const [broj, setBroj] = useState(0);

  const prestani = () => {
    window.clearTimeout(holdT.current);
    window.clearInterval(repeatT.current);
    setDrzim(false);
  };

  useEffect(() => () => prestani(), []);

  return (
    <button
      type="button"
      data-vodic={oznaka}
      disabled={onemogucen}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (onemogucen) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        holdDone.current = false;
        setDrzim(true);
        setBroj(0);
        holdT.current = window.setTimeout(() => {
          holdDone.current = true;
          playSfx("button");
          vibrate(14);
          if (!trgovina(akcija, resurs, lot)) {
            setDrzim(false);
            return;
          }
          setBrzo(true);
          setBroj(1);
          repeatT.current = window.setInterval(() => {
            if (!trgovina(akcija, resurs, lot)) {
              window.clearInterval(repeatT.current);
              setBrzo(false);
              setDrzim(false);
              return;
            }
            setBroj((n) => n + 1);
          }, REPEAT_MS);
        }, HOLD_MS);
      }}
      onPointerUp={() => {
        if (onemogucen) return;
        const gotovo = holdDone.current;
        prestani();
        setBrzo(false);
        if (!gotovo) trgovina(akcija, resurs, lot);
      }}
      onPointerCancel={() => {
        prestani();
        setBrzo(false);
      }}
      className={cn(
        "relative min-h-11 overflow-hidden rounded-lg border py-2 select-none touch-manipulation transition-transform duration-150 ease-out active:scale-[0.96] disabled:cursor-not-allowed disabled:active:scale-100",
        klasa,
        onemogucen && "trznica-off",
        brzo && "zavrti-auto",
      )}
    >
      <span className={cn("zavrti-hold-fill", drzim && !brzo && "ide")} />
      <span className={cn("relative z-10 block text-sm font-bold tracking-wide", naslovBoja)}>
        {brzo ? "BRZO" : naslov}
      </span>
      <span
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-1 text-xs font-semibold",
          naslovBoja === "text-gold" ? "text-gold" : "text-dim",
        )}
      >
        {brzo ? (
          `×${broj}`
        ) : (
          <>
            {akcija === "prodaj" ? "+" : "−"} {cijena}
            <IconBadge src={SYMBOL_ART.gold} size="xs" />
          </>
        )}
      </span>
    </button>
  );
}
