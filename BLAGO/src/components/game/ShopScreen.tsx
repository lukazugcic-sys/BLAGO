import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Minus } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { IconBadge } from "./IconBadge";
import { ScreenTabs } from "./ScreenTabs";
import { SideGateKartica } from "./SideGateKartica";
import { jeSideOtkljucan } from "@/lib/game/sideGate";
import { UpgradesScreen } from "./UpgradesScreen";
import { ZGRADE_SKINOVI } from "@/lib/game/constants";
import { ART, RESURS_ART, SYMBOL_ART, ZGRADA_ART } from "@/lib/game/art";
import { ArtTraka } from "./ArtTraka";
import type { TrznicaId } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { playSfx, vibrate } from "@/lib/game/audio";
import { sajamCijena, tjedanSad } from "@/lib/game/tjedan";

const MNOZ = [1, 10, 30, 50, 100] as const;
const HOLD_MS = 420;
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
  { id: "izgled", label: "Izgled" },
] as const;

export function ShopScreen() {
  const [sekcija, setSekcija] = useState<(typeof TABS)[number]["id"]>("burza");
  const [mnoz, setMnoz] = useState<(typeof MNOZ)[number]>(10);
  const tecaj = useGameStore((s) => s.tecaj);
  const trend = useGameStore((s) => s.trend);
  const dijamanti = useGameStore((s) => s.dijamanti);
  const zlato = useGameStore((s) => Math.floor(s.zlato));
  const resursi = useGameStore((s) => s.resursi);
  const aktivniSkin = useGameStore((s) => s.aktivniSkin);
  const skinovi = useGameStore((s) => s.skinovi);
  const kupiSkin = useGameStore((s) => s.kupiSkin);
  const otkljucan = useGameStore((s) => jeSideOtkljucan(s.gradevine));

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
    <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col px-3 pt-2">
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
      <ArtTraka src={sekcija === "izgled" ? ART.vinograd : ART.trznica} label="Tržnica" />

      {sekcija === "alati" && <UpgradesScreen embedded />}

      {sekcija === "burza" && (
        <>
          <div className="mb-3 ml-1 flex items-end justify-between gap-2">
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
                    "min-h-9 rounded-full px-2.5 text-[11px] font-bold tracking-wide",
                    mnoz === n ? "bg-gold text-void" : "border border-line bg-panel-2 text-dim",
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
            const tr = trend[r.id];
            const TrendIkona = tr === 1 ? ArrowUpRight : tr === -1 ? ArrowDown : Minus;
            const ima = r.id === "dijamant" ? dijamanti : Math.floor(resursi[r.id]);
            return (
              <article key={r.id} className="mb-3.5 rounded-2xl border border-line bg-panel p-4 shadow-panel">
                <div className="mb-3 flex items-center gap-3">
                  <IconBadge src={r.art} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-ink">
                      {r.n}
                      <span className="ml-1 text-xs font-semibold text-dim">×{lot}</span>
                    </h3>
                    <p className="mt-0.5 text-[11px] font-semibold text-dim">
                      imaš {ima} · 1 = {sajamCijena("kupi", tecaj[r.id].kupi, tjedanSad().vrsta === "sajam")}/{sajamCijena("prodaj", tecaj[r.id].prodaj, tjedanSad().vrsta === "sajam")}
                      {tjedanSad().vrsta === "sajam" ? " · sajam" : ""}
                    </p>
                  </div>
                  <TrendIkona
                    className={cn(
                      "size-4 shrink-0",
                      tr === 1 ? "text-gold" : tr === -1 ? "text-ruby" : "text-dim",
                    )}
                    strokeWidth={2.5}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <HoldTradeButton
                    akcija="prodaj"
                    resurs={r.id}
                    lot={lot}
                    cijena={cijenaProdaj}
                    klasa="border-line bg-panel-2"
                    naslov="PRODAJ"
                    naslovBoja="text-ink"
                  />
                  <HoldTradeButton
                    akcija="kupi"
                    resurs={r.id}
                    lot={lot}
                    cijena={cijenaKupi}
                    klasa="border-gold/40 bg-gold/10"
                    naslov="KUPI"
                    naslovBoja="text-gold"
                  />
                </div>
              </article>
            );
          })}
        </>
      )}

      {sekcija === "izgled" && (
        <>
          <div className="mb-2 ml-1 flex items-end justify-between">
            <h2 className="text-sm font-bold tracking-widest text-ink uppercase">Izgled kaube</h2>
            <span className="text-[11px] font-semibold text-dim">Boja cijele igre</span>
          </div>
          <p className="mb-3.5 ml-1 text-xs text-dim">
            Kupi jednom, pa biraj. Nijansa ide na HUD, vrtnju, kaubu i tržnicu.
          </p>
          {ZGRADE_SKINOVI.map((skin) => {
            const aktivan = aktivniSkin === skin.id;
            const ima = skinovi.includes(skin.id) || skin.cijenaDijamanti === 0;
            const mozePlatiti = ima || dijamanti >= skin.cijenaDijamanti;
            const SkinIkona = skin.ikona;
            const t = skin.tema;
            return (
              <article
                key={skin.id}
                className="mb-3 overflow-hidden rounded-xl border bg-panel"
                style={{
                  borderColor: aktivan ? skin.boja : "var(--color-line)",
                  boxShadow: aktivan ? `0 0 0 1px ${skin.boja}88` : undefined,
                }}
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
                <div className="flex items-center justify-between p-4 pt-3">
                <div className="flex items-center gap-3.5">
                  <span
                    className="flex size-11 items-center justify-center rounded-full border"
                    style={{ borderColor: `${skin.boja}66`, backgroundColor: `${skin.boja}22` }}
                  >
                    <SkinIkona className="size-5" style={{ color: skin.boja }} strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{skin.naziv}</p>
                    <p className="mt-0.5 text-[10px] font-bold tracking-wider uppercase" style={{ color: skin.boja }}>
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
                    className="rounded-lg border px-4 py-2.5 text-xs font-bold"
                    style={{ color: skin.boja, borderColor: `${skin.boja}66`, backgroundColor: `${skin.boja}22` }}
                  >
                    AKTIVAN
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => kupiSkin(skin)}
                    className={cn(
                      "min-h-11 rounded-lg border px-4 py-2.5 text-xs font-bold transition-transform duration-150 ease-out active:scale-[0.96]",
                      mozePlatiti ? "text-void" : "border-line bg-ink/5 text-dim",
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
        </>
      )}
      </div>
      <div className="shrink-0 pb-[0.35rem]">
        <ScreenTabs tabs={TABS} value={sekcija} onChange={setSekcija} dolje />
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
}: {
  akcija: "kupi" | "prodaj";
  resurs: TrznicaId;
  lot: number;
  cijena: number;
  klasa: string;
  naslov: string;
  naslovBoja: string;
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
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
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
        "relative min-h-14 overflow-hidden rounded-lg border py-3 select-none touch-manipulation transition-transform duration-150 ease-out active:scale-[0.96]",
        klasa,
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
