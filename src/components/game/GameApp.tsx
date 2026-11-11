import { useEffect, useMemo, useRef, useState } from "react";
import { UIProvider } from "@/lib/context/UIContext";
import { useGameStore, startLocalPersist } from "@/lib/stores/gameStore";
import { useVillage } from "@/lib/hooks/useVillage";
import { useMarket } from "@/lib/hooks/useMarket";
import { useCloudSync } from "@/lib/hooks/useCloudSync";
import { useFullscreen, requestNativeFullscreen } from "@/lib/hooks/useFullscreen";
import { useSlotStore } from "@/lib/stores/slotStore";
import { Header } from "./Header";
import { AiPovratak } from "./AiSloj";
import { AppNav } from "./AppNav";
import { DailyRewardModal } from "./DailyRewardModal";
import { RaidModal } from "./RaidModal";
import { ScreenPager } from "./ScreenPager";
import { LijeniEkran } from "./LijeniEkran";
import { type TabId, TABOVI, ZGRADE_SKINOVI, primijeniSkinTemu, postaviBojuPrikaza, normalizirajTab, jeTabId } from "@/lib/game/constants";
import { setMuted, unlockAudio, startBgm } from "@/lib/game/audio";
import { SAVE_KEYS } from "@/lib/game/persist";
import { ART, CREDITS, preloadArt } from "@/lib/game/art";
import { LiveShell } from "@/lib/multiplayer";
import { ObavijestSloj } from "./ObavijestSloj";
import { PosjetTabor } from "./PosjetTabor";
import { TrojacModal } from "./TrojacModal";
import { APP_VERSION } from "@/lib/game/version";
import { CILJ_EVENT } from "@/lib/game/sljedeciCilj";
import { IDI_EVENT, type IdiDetail } from "@/lib/game/tokMeni";
import { CesticeSloj } from "./CesticeSloj";
import { LetSloj } from "./LetSloj";
import { SljedeciKorak } from "./SljedeciKorak";
import { VodicSloj } from "./VodicSloj";
import { FEEL_EVENT, ucitajVibraciju, type FeelRang } from "@/lib/game/feel";
import { dogadaj, pokreniGreske, posaljiDogadaje, sessionEnd, sessionStart, ucitajStatistiku } from "@/lib/game/analitika";
import { useVodic, VODIC_NAGRADA, vodicDnevnaSmije, vodicPrikazan, vodicJosIde, tabOtkljucan, vodicLokot, vodicTabOtvoren } from "@/lib/game/vodic";
import { jePregledZaNovi, lokalniNoviPocetak, noviUpitTreba, skiniNoviParam } from "@/lib/game/noviPocetak";
import { napraviDogadaj } from "@/lib/game/dogadaji";
import { ponoviDnevniSat } from "@/lib/stores/sliceDan";
import type { Nagrada } from "@/lib/game/types";
import { clearChunkReloadFlag } from "@/lib/chunk-error";
import type { Gradevine } from "@/lib/game/types";

const UCITAJ = {
  SlotScreen: () => import("./SlotScreen"),
  ZidScreen: () => import("./ZidScreen"),
  VillageScreen: () => import("./VillageScreen"),
  ShopScreen: () => import("./ShopScreen"),
} as const;
const DIREKTNO = () => import("./tabDirekt");

const TAB_UCITAJ: Record<TabId, () => Promise<unknown>> = {
  automat: UCITAJ.SlotScreen,
  zid: UCITAJ.ZidScreen,
  selo: UCITAJ.VillageScreen,
  trznica: UCITAJ.ShopScreen,
};

function prefetchSusjede(id: TabId) {
  const i = TABOVI.findIndex((t) => t.id === id);
  const ids = [TABOVI[i - 1]?.id, TABOVI[i + 1]?.id].filter(jeTabId);
  const run = () => {
    for (const k of ids) void TAB_UCITAJ[k]();
  };
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
  if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(run, { timeout: 1500 });
  else window.setTimeout(run, 480);
}

function citajTab(): TabId {
  if (typeof window === "undefined") return "selo";
  const raw = window.localStorage.getItem(SAVE_KEYS.tab);
  const id = normalizirajTab(raw);
  if (raw === "misije") {
    try {
      window.localStorage.setItem(SAVE_KEYS.tab, id);
    } catch {
      /* kvota */
    }
  }
  return id;
}

function GameInner({
  started,
  muted,
  onToggleMute,
}: {
  started: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const ucitavam = useGameStore((s) => s.ucitavam);
  const ucitaj = useGameStore((s) => s.ucitaj);
  const [tab, setTabState] = useState<TabId>(citajTab);
  const setTabRef = useRef(setTabState);
  setTabRef.current = setTabState;
  const setTab = (id: TabId) => {
    window.dispatchEvent(new CustomEvent("blago-tab"));
    if (vodicPrikazan() && vodicJosIde() && !tabOtkljucan(id)) {
      useGameStore.getState().setPoruka(vodicLokot(id));
      return;
    }
    setTabState(id);
    dogadaj("tab_open", { rec: id });
    vodicTabOtvoren(id);
    try {
      window.localStorage.setItem(SAVE_KEYS.tab, id);
    } catch {
      /* kvota */
    }
    const st = window.history.state as { blagoTab?: TabId } | null;
    if (st?.blagoTab === id) return;
    window.history.pushState({ ...(st ?? {}), blagoTab: id }, "");
  };
  const shellRef = useRef<HTMLDivElement>(null);
  const { native, canNative, toggle: toggleFs } = useFullscreen(shellRef);
  const knjigaFaza = useSlotStore((s) => s.knjigaFaza);
  const raidAktivan = useSlotStore((s) => s.raidAktivan);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
  const aktivniSkin = useGameStore((s) => s.aktivniSkin);
  const vodic = useVodic();
  const dnevniDan = useGameStore((s) => s.dnevniDan);
  const poruka = useGameStore((s) => s.poruka);
  useVillage();
  useMarket();
  useCloudSync();

  useEffect(() => {
    if (!poruka) return;
    const t = window.setTimeout(() => {
      if (useGameStore.getState().poruka === poruka) useGameStore.setState({ poruka: "" });
    }, 3000);
    return () => window.clearTimeout(t);
  }, [poruka]);

  useEffect(() => {
    const snap = useGameStore.getState().poruka;
    return () => {
      if (snap && useGameStore.getState().poruka === snap) useGameStore.setState({ poruka: "" });
    };
  }, [tab]);

  useEffect(() => {
    const skin = ZGRADE_SKINOVI.find((s) => s.id === aktivniSkin) ?? ZGRADE_SKINOVI[0]!;
    primijeniSkinTemu(skin);
    const t = skin.tema;
    const boja =
      tab === "automat" ? t.energy : tab === "trznica" ? t.gold : tab === "zid" ? t.quest : t.void;
    postaviBojuPrikaza(boja);
  }, [aktivniSkin, tab]);

  useEffect(() => {
    if (knjigaFaza === "uvod" || knjigaFaza === "igra" || knjigaFaza === "kraj") {
      startBgm("bonus");
      return;
    }
    startBgm(tab === "selo" || tab === "zid" ? "selo" : "igra");
  }, [tab, knjigaFaza]);

  useEffect(() => {
    const st = window.history.state as { blagoTab?: TabId } | null;
    if (!st?.blagoTab) window.history.replaceState({ ...(st ?? {}), blagoTab: citajTab() }, "");
    const onPop = (e: PopStateEvent) => {
      const raw = (e.state as { blagoTab?: string } | null)?.blagoTab;
      const id = raw ? normalizirajTab(raw) : null;
      if (!id || !jeTabId(id)) return;
      setTabRef.current(id);
      try {
        window.localStorage.setItem(SAVE_KEYS.tab, id);
      } catch {
        /* kvota */
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    prefetchSusjede(tab);
  }, [tab]);

  useEffect(() => {
    startLocalPersist();
    ucitaj();
  }, [ucitaj]);

  useEffect(() => {
    if (vodic.korak !== "nalog") return;
    const s = useGameStore.getState();
    if (s.dogadaj?.tip === "stranac") return;
    if (s.dogadaj) return;
    const ime = s.ljudi.find((p) => p.id === "boro")?.ime ?? "Boro";
    useGameStore.setState({ dogadaj: napraviDogadaj("stranac", ime, Date.now()) });
  }, [vodic.korak]);

  useEffect(() => {
    if (!vodic.finaleVidjen || vodic.korak !== "gotovo") return;
    ponoviDnevniSat();
    useGameStore.getState().osvjeziDnevnu();
  }, [vodic.finaleVidjen, vodic.korak]);

  useEffect(() => {
    if (tab === "selo") useGameStore.getState().posjetiKaubu();
  }, [tab]);

  useEffect(() => {
    const onCilj = (e: Event) => {
      const id = (e as CustomEvent<{ id?: keyof Gradevine }>).detail?.id;
      if (!id) return;
      setTab("selo");
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent(CILJ_EVENT + ":scroll", { detail: { id } }));
      }, 80);
    };
    window.addEventListener(CILJ_EVENT, onCilj);
    return () => window.removeEventListener(CILJ_EVENT, onCilj);
  }, []);

  useEffect(() => {
    const onIdi = (e: Event) => {
      const d = (e as CustomEvent<IdiDetail>).detail;
      if (!d) return;
      if (d.pohod) setRaidAktivan(true);
      if (d.tab) setTab(d.tab);
      else if (d.hub || d.trg || d.ruke || d.almanah) setTab("selo");
    };
    window.addEventListener(IDI_EVENT, onIdi);
    return () => window.removeEventListener(IDI_EVENT, onIdi);
  }, [setRaidAktivan]);

  useEffect(() => {
    const onFeel = (e: Event) => {
      const el = shellRef.current;
      if (!el) return;
      const rang = (e as CustomEvent<{ rang?: FeelRang }>).detail?.rang;
      if (!rang) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const jacina =
        rang === "jackpot"
          ? "tezak"
          : rang === "skull" || rang === "raid"
            ? "srednji"
            : rang === "win" || rang === "build"
              ? "laki"
              : "";
      if (!jacina) return;
      el.classList.remove("feel-udarca-laki", "feel-udarca-srednji", "feel-udarca-tezak");
      void el.offsetWidth;
      el.classList.add(`feel-udarca-${jacina}`);
      const stop = rang === "jackpot" ? 80 : rang === "win" || rang === "skull" ? 48 : 0;
      if (!stop) return;
      document.documentElement.classList.add("feel-stop");
      window.setTimeout(() => document.documentElement.classList.remove("feel-stop"), stop);
    };
    window.addEventListener(FEEL_EVENT, onFeel);
    return () => window.removeEventListener(FEEL_EVENT, onFeel);
  }, []);

  const panes = useMemo(
    () => [
      {
        id: "zid" as const,
        node: (
          <LijeniEkran ime="ZidScreen" ucitaj={UCITAJ.ZidScreen} direktno={DIREKTNO} djeca={(C) => <C naTab={setTab} />} />
        ),
      },
      {
        id: "selo" as const,
        node: (
          <LijeniEkran
            ime="VillageScreen"
            ucitaj={UCITAJ.VillageScreen}
            direktno={DIREKTNO}
            djeca={(C) => <C naTab={setTab} aktivan={tab === "selo"} />}
          />
        ),
      },
      {
        id: "automat" as const,
        node: (
          <LijeniEkran ime="SlotScreen" ucitaj={UCITAJ.SlotScreen} direktno={DIREKTNO} djeca={(C) => <C />} />
        ),
      },
      {
        id: "trznica" as const,
        node: (
          <LijeniEkran ime="ShopScreen" ucitaj={UCITAJ.ShopScreen} direktno={DIREKTNO} djeca={(C) => <C />} />
        ),
      },
    ],
    [tab],
  );

  if (!started || ucitavam) {
    return (
      <div className="fixed inset-0 bg-void">
        <Splash loading={started && ucitavam} />
      </div>
    );
  }

  return (
    <LiveShell>
    <div
      className="atmosphere fixed inset-0 flex flex-col overflow-hidden text-ink"
    >
      <div
        ref={shellRef}
        className="game-shell relative z-0 mx-auto flex h-full min-h-0 w-full min-w-0 max-w-lg flex-1 flex-col overflow-x-clip"
        data-tab={tab}
      >
        <Header
          muted={muted}
          onToggleMute={onToggleMute}
          nativeFs={native}
          canNativeFs={canNative}
          onToggleFullscreen={() => void toggleFs()}
        />
        {tab === "selo" ? <AiPovratak /> : null}
        <ScreenPager tab={tab} onTab={setTab} panes={panes} sve={vodic.prikaz && vodic.korak !== "gotovo" && !vodic.staro} />
        <SljedeciKorak />
        <AppNav tab={tab} onTab={setTab} />
        <ObavijestSloj />
      </div>
      <CesticeSloj />
      <LetSloj />
      <VodicSloj />
      {vodicDnevnaSmije(dnevniDan) && <DailyRewardModal />}
      <RaidModal vidljiv={raidAktivan} onZatvori={() => setRaidAktivan(false)} />
      <PosjetTabor />
      <TrojacModal />
    </div>
    </LiveShell>
  );
}

function Splash({ loading }: { loading: boolean }) {
  const slova = ["B", "L", "A", "G", "O"];
  return (
    <div className="splash-scene relative flex h-full w-full flex-col overflow-hidden bg-void">
      <img
        src={ART.splash}
        alt=""
        className="splash-still"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div className="splash-kolo" aria-hidden>
        <span className="slot-zakovica slot-zakovica-tl" />
        <span className="slot-zakovica slot-zakovica-tr" />
        <span className="slot-zakovica slot-zakovica-bl" />
        <span className="slot-zakovica slot-zakovica-br" />
        <span className="slot-lampa slot-lampa-l" />
        <span className="slot-lampa slot-lampa-d" />
        <span className="splash-prasina" />
      </div>
      <div className="splash-veil pointer-events-none absolute inset-0 z-[1]" />
      <div className="relative z-[2] mt-auto flex flex-col items-center px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10 text-center">
        <p className="splash-rec text-[11px] font-bold tracking-[0.46em] text-gold uppercase">
          kaubojski automat · beta
        </p>
        <h1 className="wordmark splash-ime relative mt-2 text-6xl tracking-[0.2em]" aria-label="BLAGO">
          {slova.map((s, i) => (
            <span key={s} className="splash-slovo" style={{ animationDelay: `${120 + i * 90}ms` }}>
              {s}
            </span>
          ))}
        </h1>
        <p className="splash-rec relative mt-2 text-sm font-bold tracking-[0.32em] text-ink/90 uppercase" style={{ animationDelay: "0.7s" }}>
          Vrti · Gradi · Traži blago
        </p>
        {loading ? (
          <p className="relative mt-8 text-xs font-bold tracking-widest text-volt">Učitavanje…</p>
        ) : (
          <span className="cta-bounce relative mt-8 inline-flex min-h-12 items-center rounded-full border border-gold/55 bg-gold/18 px-8 text-sm font-bold tracking-[0.24em] text-gold uppercase">
            Dodirni za ulaz
          </span>
        )}
        <p className="relative mt-5 max-w-[18rem] text-[10px] font-bold leading-relaxed tracking-[0.12em] text-ink/50">
          {APP_VERSION} · {CREDITS}
        </p>
      </div>
    </div>
  );
}

export function GameApp() {
  const [started, setStarted] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [noviUpit, setNoviUpit] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("is-fs");
    // 0.9.179: jedan minimalni GUI (stil donjeg izbornika karte) — vidi styles.css „0.9.179 (t465u)“
    document.documentElement.classList.add("gui-179");
    document.body.classList.add("is-fs");
    clearChunkReloadFlag();
  }, []);

  useEffect(() => {
    if (!jePregledZaNovi()) return;
    if (noviUpitTreba()) setNoviUpit(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    ucitajVibraciju();
    ucitajStatistiku();
    pokreniGreske();
    const saved = window.localStorage.getItem(SAVE_KEYS.mute);
    if (saved === "1") {
      setMutedState(true);
      setMuted(true);
    }
  }, []);

  useEffect(() => {
    if (!started) return;
    sessionStart();
    const onNagrada = (e: Event) => {
      const n = (e as CustomEvent<Nagrada>).detail;
      if (n) useGameStore.getState().primiNagradu(n);
    };
    const kraj = () => sessionEnd();
    const sakrij = () => {
      if (document.visibilityState === "hidden") posaljiDogadaje();
    };
    window.addEventListener(VODIC_NAGRADA, onNagrada);
    window.addEventListener("pagehide", kraj);
    document.addEventListener("visibilitychange", sakrij);
    return () => {
      window.removeEventListener(VODIC_NAGRADA, onNagrada);
      window.removeEventListener("pagehide", kraj);
      document.removeEventListener("visibilitychange", sakrij);
    };
  }, [started]);

  const start = () => {
    requestNativeFullscreen(document.documentElement);
    unlockAudio();
    startBgm("selo");
    preloadArt();
    setStarted(true);
  };

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SAVE_KEYS.mute, next ? "1" : "0");
    }
  };

  const odustaniNovi = () => {
    skiniNoviParam();
    setNoviUpit(false);
  };

  const upit = noviUpit ? (
    <div className="g179-preklop fixed inset-0 z-[120] flex items-end justify-center bg-void/80 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-3xl border border-gold/40 bg-panel p-5">
        <h2 className="font-display text-2xl text-gold">Novi početak?</h2>
        <p className="mt-2 text-sm font-bold leading-snug text-ink/85">
          Briše spremanje na ovom uređaju i serverski zapis ove prijave, pa krene od priče.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={odustaniNovi}
            className="min-h-11 flex-1 rounded-full border border-line text-xs font-bold tracking-widest text-dim uppercase"
          >
            Ne
          </button>
          <button
            type="button"
            onClick={() => lokalniNoviPocetak()}
            className="min-h-11 flex-1 rounded-full bg-gold text-xs font-bold tracking-widest text-void uppercase"
          >
            Da, ispočetka
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (!started) {
    return (
      <>
        <button
          type="button"
          className="fixed inset-0 block h-full w-full bg-void"
          onClick={start}
          aria-label="Pokreni igru"
        >
          <Splash loading={false} />
        </button>
        {upit}
      </>
    );
  }

  return (
    <UIProvider>
      <GameInner started muted={muted} onToggleMute={toggleMute} />
      {upit}
    </UIProvider>
  );
}
