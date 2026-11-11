import { BrickWall, Dices, Home, Lock, Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { cijenaBonusKupnje } from "@/lib/game/knjiga";
import { kaubaOd } from "@/lib/game/ljudi";
import { odaberiKorak } from "@/lib/game/korak";
import { odaberiSljedeciCilj, otvoriCiljZgradu } from "@/lib/game/sljedeciCilj";
import { portalKorijen } from "@/lib/game/portal";
import {
  navStupacPreferredWidth,
  stezniNavStupacPoziciju,
  type NavStupacPozicija,
} from "@/lib/game/navStupac";
import { TokIkonica } from "./TokRadial";

const ICONS = {
  automat: Dices,
  zid: BrickWall,
  selo: Home,
  trznica: Store,
} as const;

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
  const slotUlog = useSlotStore((s) => s.ulog);
  const vodic = useVodic();
  const otkljucan = jeSideOtkljucan({ kuca });
  const navRef = useRef<HTMLElement>(null);
  const hold = useRef<{ id: TabId; x: number; y: number; timer: number; opened: boolean; start: number } | null>(null);
  const [meni, setMeni] = useState<{ tab: TabId; box: NavStupacPozicija } | null>(null);
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
        const st = useGameStore.getState();
        const cilj = odaberiSljedeciCilj({
          gradevine: st.gradevine,
          zlato: st.zlato,
          resursi: st.resursi,
          gradnje: st.gradnje,
          usko: kaubaOd({
            gradevine: st.gradevine,
            stanovnici: st.stanovnici,
            zamjenici: st.zamjenici,
            konjiBroj: st.konjiBroj,
            konjiDuznost: st.konjiDuznost,
            sijenoDo: st.sijenoDo,
            kisaDo: st.kisaDo,
            govedaBroj: st.govedaBroj,
            govedaDuznost: st.govedaDuznost,
          }).usko,
          prestigeRazina: st.prestigeRazina,
        });
        if (cilj) otvoriCiljZgradu(cilj.zgrada.id);
        else onTab("zid");
      } else {
        onTab("zid");
        idi({ tab: "zid", zid: a.kamo });
      }
    } else if (a.vrsta === "zadaci") {
      // 0.9.168: legacy long-press / deep links
      if (a.tab === "karavana" || a.tab === "uzivo") {
        onTab("trznica");
        idi({ tab: "trznica", trznica: a.tab });
      } else {
        onTab("zid");
        idi({ tab: "zid", zid: a.tab });
      }
    } else if (a.vrsta === "trznica") {
      onTab("trznica");
      idi({ tab: "trznica", trznica: a.sekcija });
    }
  };

  const izracunajStupac = (tabId: TabId, anchorX: number): NavStupacPozicija => {
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const navTop = navRef.current?.getBoundingClientRect().top;
    const navStackHeight =
      typeof navTop === "number" ? Math.max(0, window.innerHeight - navTop) : 72;
    return stezniNavStupacPoziciju({
      anchorX,
      viewport: { width: vw, height: vh, safeTop: 0, safeBottom: 0 },
      preferredWidth: navStupacPreferredWidth(tabId, vw),
      navStackHeight,
      gap: 8,
      margin: 8,
      maxHeightFraction: 0.5,
    });
  };

  // 0.9.177: visina ikona (+ safe-area) kao CSS varijabla — Kauba karta crta se ispod njih,
  // a kontrole karte sjede iznad.
  useEffect(() => {
    const el = navRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const r = document.documentElement;
    const stavi = () => r.style.setProperty("--nav-donji-h", `${Math.round(el.getBoundingClientRect().height)}px`);
    stavi();
    const ro = new ResizeObserver(stavi);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const otvoriMeni = (tabId: TabId, anchorX: number) => {
    const cijena = cijenaBonusKupnje(razina, slotUlog);
    if (tokMeniZaTab(tabId, { dijamanti, bonusCijena: cijena }).length === 0) {
      setPoruka(`Bonus traži ${cijena} dijamanta.`);
      return;
    }
    setMeni({ tab: tabId, box: izracunajStupac(tabId, anchorX) });
  };

  return (
    <nav
      ref={navRef}
      className="nav-donji nav-177 relative z-20 shrink-0 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1"
      aria-label="Glavni izbornik"
      data-tab={tab}
    >
      {/* 0.9.177 (t449u–t452u): bez trake — samo ikone; ispod njih postupni blur + blagi tamni prijelaz */}
      <span className="nav-blur" aria-hidden>
        <i />
        <i />
      </span>
      <div className="nav-donji-traka flex items-stretch justify-between gap-1 rounded-2xl border border-line/70 bg-void/95 p-1">
        {TABOVI.map((t) => {
          const Icon = ICONS[t.id];
          const aktivan = tab === t.id;
          const vodicLok = vodic.prikaz && vodicJosIde() && !tabOtkljucan(t.id);
          const zakljucan = vodicLok || (!otkljucan && !!SIDE_TAB[t.id]);
          const lokot = vodicLok ? vodicLokot(t.id) : SIDE_GATE_REC;
          const novo = tabJeNov(t.id);
          const korakZnacka = t.id === "zid" && imaKorak && !vodicJosIde();
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
                    const x = r.left + r.width / 2;
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
                  const x = r.left + r.width / 2;
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
                "nav-donji-tipka relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 transition-[background,color,opacity] duration-100 ease-out",
                drziTab === t.id && "chip-drzi",
                aktivan
                  ? "nav-aktivan text-gold"
                  : zakljucan
                    ? "text-dim"
                    : "text-ink",
              )}
              data-vodic-tab={t.id}
              aria-current={aktivan ? "page" : undefined}
              aria-label={zakljucan ? `${t.label} · ${lokot}` : t.label}
            >
              <span
                className={cn(
                  "nav-iko relative flex size-9 items-center justify-center",
                )}
              >
                {/* sjena glifa = ista ikona, deblja i tamna, 1px niže (bez CSS filtera: pravilo performansi karte) */}
                <Icon className="nav-glif-sjena shrink-0" strokeWidth={3.6} aria-hidden />
                <Icon className="nav-glif shrink-0" strokeWidth={2} aria-hidden />
                {zakljucan && (
                  <span
                    className="nav-lokot absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center"
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
              {/* Labels hidden (icons-only); name kept for a11y via aria-label */}
              <span className="nav-ime sr-only">{t.label}</span>
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
              data-nav-stupac-box
              style={{
                left: meni.box.left,
                width: meni.box.width,
                bottom: meni.box.bottom,
                maxHeight: meni.box.maxHeight,
              }}
            >
              {tokMeniZaTab(meni.tab, { dijamanti, bonusCijena: cijenaBonusKupnje(razina, slotUlog) }).map((s) => (
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
                  <span className="nav-stupac-tekst">
                    <span className="nav-stupac-naziv">{s.naziv}</span>
                    <span className="nav-stupac-rec">{s.rec}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>,
          portalKorijen(),
        )}
    </nav>
  );
}
