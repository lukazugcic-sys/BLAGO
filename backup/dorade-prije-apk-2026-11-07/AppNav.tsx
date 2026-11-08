import { BrickWall, Dices, Home, Lock, ScrollText, Store } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TABOVI, type TabId } from "@/lib/game/constants";
import { cn } from "@/lib/utils";
import { playSfx } from "@/lib/game/audio";
import { tabJeNov, tabOtkljucan, useVodic, vodicJosIde, vodicLokot } from "@/lib/game/vodic";
import { jeSideOtkljucan, SIDE_GATE_REC } from "@/lib/game/sideGate";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import {
  TOK_HOLD_PX,
  idi,
  tokMeniZaTab,
  type TokMeniStavka,
} from "@/lib/game/tokMeni";
import { HOLD_UI_MS, holdDosta } from "@/lib/game/feel";
import { cijenaBesplatnih } from "@/lib/game/knjiga";
import { kaubaOd } from "@/lib/game/ljudi";
import { odaberiKorak } from "@/lib/game/korak";
import { odaberiSljedeciCilj, otvoriCiljZgradu } from "@/lib/game/sljedeciCilj";
import { portalKorijen } from "@/lib/game/portal";
import { TokIkonica } from "./TokRadial";

const ICONS = {
  automat: Dices,
  zid: BrickWall,
  selo: Home,
  misije: ScrollText,
  trznica: Store,
} as const;

const COLOR: Record<string, string> = {
  volt: "bg-volt text-void shadow-[0_0_16px_color-mix(in_oklab,var(--color-volt)_45%,transparent)]",
  zid: "bg-[#b8894a] text-void shadow-[0_0_12px_rgb(184_137_74_/_0.32)]",
  wood: "bg-wood text-void",
  quest: "bg-quest text-void",
  gold: "bg-gold text-void",
};

/** Tabs that compete with the early core loop until first house. */
const SIDE_TAB: Partial<Record<TabId, boolean>> = {
  trznica: true,
};

export function AppNav({
  tab,
  onTab,
}: {
  tab: TabId;
  onTab: (id: TabId) => void;
}) {
  const kuca = useGameStore((s) => s.gradevine.kuca || 0);
  const imaKorak = useGameStore((s) => !!odaberiKorak(s));
  const dijamanti = useGameStore((s) => s.dijamanti);
  const razina = useGameStore((s) => s.igracRazina);
  const setPoruka = useGameStore((s) => s.setPoruka);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
  const vodic = useVodic();
  const otkljucan = jeSideOtkljucan({ kuca });
  const navRef = useRef<HTMLElement>(null);
  const hold = useRef<{ id: TabId; x: number; y: number; timer: number; opened: boolean; start: number } | null>(null);
  const [meni, setMeni] = useState<{ tab: TabId; x: number } | null>(null);
  const [drziTab, setDrziTab] = useState<TabId | null>(null);

  const naAkciju = (s: TokMeniStavka) => {
    setMeni(null);
    const a = s.akcija;
    if (a.vrsta === "tab") onTab(a.tab);
    else if (a.vrsta === "pohod") setRaidAktivan(true);
    else if (a.vrsta === "trg") {
      onTab("selo");
      idi({ trg: true });
    } else if (a.vrsta === "almanah") {
      onTab("selo");
      idi({ almanah: true });
    } else if (a.vrsta === "ruke") {
      onTab("selo");
      idi({ ruke: true });
    } else if (a.vrsta === "hub") {
      onTab("selo");
      idi({ hub: a.hub });
    } else if (a.vrsta === "zgrada") {
      onTab("selo");
      otvoriCiljZgradu(a.id);
    } else if (a.vrsta === "slot") {
      onTab("automat");
      idi({ tab: "automat", slot: a.slot });
    } else if (a.vrsta === "zid-skok") {
      if (a.kamo === "cilj") {
        const s = useGameStore.getState();
        const cilj = odaberiSljedeciCilj({
          gradevine: s.gradevine,
          zlato: s.zlato,
          resursi: s.resursi,
          gradnje: s.gradnje,
          usko: kaubaOd({
            gradevine: s.gradevine,
            stanovnici: s.stanovnici,
            zamjenici: s.zamjenici,
            konjiBroj: s.konjiBroj,
            konjiDuznost: s.konjiDuznost,
            sijenoDo: s.sijenoDo,
            kisaDo: s.kisaDo,
            govedaBroj: s.govedaBroj,
            govedaDuznost: s.govedaDuznost,
          }).usko,
          prestigeRazina: s.prestigeRazina,
        });
        if (cilj) otvoriCiljZgradu(cilj.zgrada.id);
        else onTab("zid");
      } else {
        onTab("zid");
        idi({ tab: "zid", zid: a.kamo });
      }
    } else if (a.vrsta === "zadaci") {
      onTab("misije");
      idi({ tab: "misije", zadaci: a.tab });
    } else if (a.vrsta === "trznica") {
      onTab("trznica");
      idi({ tab: "trznica", trznica: a.sekcija });
    }
  };

  const otvoriMeni = (tabId: TabId, x: number) => {
    const cijena = cijenaBesplatnih(razina);
    if (tokMeniZaTab(tabId, { dijamanti, bonusCijena: cijena }).length === 0) {
      setPoruka(`Bonus traži ${cijena} dijamanta.`);
      return;
    }
    setMeni({ tab: tabId, x });
  };

  return (
    <nav
      ref={navRef}
      className="relative z-20 shrink-0 bg-void px-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1"
    >
      <div className="flex items-stretch justify-between gap-1 rounded-2xl border border-line bg-void/95 p-1 shadow-[0_8px_28px_rgb(0_0_0_/_0.55)]">
        {TABOVI.map((t) => {
          const Icon = ICONS[t.id];
          const aktivan = tab === t.id;
          const vodicLok = vodic.prikaz && vodicJosIde() && !tabOtkljucan(t.id);
          const zakljucan = vodicLok || (!otkljucan && !!SIDE_TAB[t.id]);
          const lokot = vodicLok ? vodicLokot(t.id) : SIDE_GATE_REC;
          const novo = tabJeNov(t.id);
          const korakZnacka = t.id === "misije" && imaKorak && !vodicJosIde();
          return (
            <button
              key={t.id}
              type="button"
              onPointerDown={(e) => {
                if (zakljucan) return;
                if (hold.current?.timer) window.clearTimeout(hold.current.timer);
                const tipka = e.currentTarget;
                setDrziTab(t.id);
                hold.current = {
                  id: t.id,
                  x: e.clientX,
                  y: e.clientY,
                  opened: false,
                  start: Date.now(),
                  timer: window.setTimeout(() => {
                    const h = hold.current;
                    if (!h || h.id !== t.id) return;
                    h.opened = true;
                    setDrziTab(null);
                    playSfx("button");
                    const r = tipka.getBoundingClientRect();
                    const x = Math.max(86, Math.min(window.innerWidth - 86, r.left + r.width / 2));
                    otvoriMeni(t.id, x);
                  }, HOLD_UI_MS),
                };
              }}
              onPointerMove={(e) => {
                const h = hold.current;
                if (!h || h.opened) return;
                if (Math.hypot(e.clientX - h.x, e.clientY - h.y) > TOK_HOLD_PX) {
                  window.clearTimeout(h.timer);
                  hold.current = null;
                  setDrziTab(null);
                }
              }}
              onPointerUp={(e) => {
                const h = hold.current;
                if (h?.timer) window.clearTimeout(h.timer);
                const opened = h?.opened || (!!h && h.id === t.id && holdDosta(h.start, HOLD_UI_MS));
                if (opened && h && !h.opened) {
                  h.opened = true;
                  setDrziTab(null);
                  hold.current = null;
                  playSfx("button");
                  const r = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(86, Math.min(window.innerWidth - 86, r.left + r.width / 2));
                  otvoriMeni(t.id, x);
                  return;
                }
                hold.current = null;
                setDrziTab(null);
                if (opened) return;
                playSfx("button");
                if (zakljucan) {
                  setPoruka(lokot);
                  if (vodicLok) return;
                }
                onTab(t.id);
                if (t.id === "selo") idi({ trg: true });
              }}
              onPointerCancel={() => {
                const h = hold.current;
                if (!h || h.opened) return;
                window.clearTimeout(h.timer);
                hold.current = null;
                setDrziTab(null);
              }}
              onContextMenu={(e) => e.preventDefault()}
              className={cn(
                "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 transition-[background,color,opacity] duration-100 ease-out",
                drziTab === t.id && "chip-drzi",
                aktivan
                  ? cn(COLOR[t.boja], "nav-bounce")
                  : zakljucan
                    ? "text-[#d7c4a4]"
                    : "text-[#f3e6c8]",
              )}
              data-vodic-tab={t.id}
              aria-current={aktivan ? "page" : undefined}
              aria-label={zakljucan ? `${t.label} · ${lokot}` : t.label}
            >
              <span
                className={cn(
                  "nav-iko relative",
                  aktivan ? "bg-void/18" : zakljucan ? "bg-ink/5" : "bg-ink/8",
                )}
              >
                <Icon
                  className={cn("size-4 shrink-0", zakljucan && !aktivan && "opacity-80")}
                  strokeWidth={aktivan ? 2.6 : 2}
                />
                {zakljucan && (
                  <span
                    className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border border-gold/70 bg-void text-gold"
                    aria-hidden
                  >
                    <Lock className="size-3" strokeWidth={3} />
                  </span>
                )}
                {novo && !zakljucan && (
                  <span className="nav-novo" aria-label="Novo">
                    NOVO
                  </span>
                )}
                {korakZnacka && !zakljucan && (
                  <span className="nav-korak-znacka" aria-label="Sljedeći zadatak" />
                )}
              </span>
              <span className="whitespace-nowrap text-[11px] font-bold leading-none tracking-normal uppercase">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
      {meni &&
        createPortal(
          <div className="nav-stupac-sloj" role="menu" aria-label="Prečice">
            <button type="button" className="nav-stupac-poz" aria-label="Zatvori prečace" onClick={() => setMeni(null)} />
            <div
              className={cn("nav-stupac", meni.tab === "selo" && "nav-mreza")}
              style={meni.tab === "selo" ? { left: "50%" } : { left: meni.x }}
            >
              {tokMeniZaTab(meni.tab, { dijamanti, bonusCijena: cijenaBesplatnih(razina) }).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  data-testid={`tok-precica-${s.id}`}
                  aria-label={`${s.naziv}. ${s.rec}`}
                  className="nav-stupac-stavka"
                  onClick={() => naAkciju(s)}
                >
                  <TokIkonica id={s.ikona} />
                  <span>{s.naziv}</span>
                </button>
              ))}
            </div>
          </div>,
          portalKorijen(),
        )}
    </nav>
  );
}
