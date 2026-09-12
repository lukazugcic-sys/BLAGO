import { useEffect, useMemo, useRef, useState } from "react";
import { UIProvider } from "@/lib/context/UIContext";
import { useGameStore, startLocalPersist } from "@/lib/stores/gameStore";
import { useVillage } from "@/lib/hooks/useVillage";
import { useMarket } from "@/lib/hooks/useMarket";
import { useCloudSync } from "@/lib/hooks/useCloudSync";
import { useFullscreen, requestNativeFullscreen } from "@/lib/hooks/useFullscreen";
import { useSlotStore } from "@/lib/stores/slotStore";
import { Header } from "./Header";
import { AppNav } from "./AppNav";
import { SlotScreen } from "./SlotScreen";
import { VillageScreen } from "./VillageScreen";
import { MissionsScreen } from "./MissionsScreen";
import { ShopScreen } from "./ShopScreen";
import { DailyRewardModal } from "./DailyRewardModal";
import { RaidModal } from "./RaidModal";
import { ScreenPager } from "./ScreenPager";
import { type TabId, ZGRADE_SKINOVI, primijeniSkinTemu, postaviBojuPrikaza } from "@/lib/game/constants";
import { setMuted, unlockAudio, startBgm } from "@/lib/game/audio";
import { SAVE_KEYS } from "@/lib/game/persist";
import { ART, CREDITS, preloadArt } from "@/lib/game/art";
import { LiveShell } from "@/lib/multiplayer";
import { ObavijestSloj } from "./ObavijestSloj";
import { PosjetTabor } from "./PosjetTabor";
import { TrojacModal } from "./TrojacModal";
import { OnboardModal } from "./OnboardModal";
import { JutroSheet } from "./JutroSheet";
import { APP_VERSION } from "@/lib/game/version";
import { CILJ_EVENT } from "@/lib/game/sljedeciCilj";
import type { Gradevine } from "@/lib/game/types";

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
  const [tab, setTab] = useState<TabId>("automat");
  const shellRef = useRef<HTMLDivElement>(null);
  const { native, canNative, toggle: toggleFs } = useFullscreen(shellRef);
  const knjigaFaza = useSlotStore((s) => s.knjigaFaza);
  const raidAktivan = useSlotStore((s) => s.raidAktivan);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
  const ukupnoVrtnji = useGameStore((s) => s.ukupnoVrtnji);
  const aktivniSkin = useGameStore((s) => s.aktivniSkin);
  const [onboard, setOnboard] = useState(false);
  useVillage();
  useMarket();
  useCloudSync();

  useEffect(() => {
    const skin = ZGRADE_SKINOVI.find((s) => s.id === aktivniSkin) ?? ZGRADE_SKINOVI[0]!;
    primijeniSkinTemu(skin);
    const t = skin.tema;
    const boja =
      tab === "automat" ? t.energy : tab === "misije" ? t.quest : tab === "trznica" ? t.gold : t.void;
    postaviBojuPrikaza(boja);
  }, [aktivniSkin, tab]);

  useEffect(() => {
    if (knjigaFaza === "uvod" || knjigaFaza === "igra" || knjigaFaza === "kraj") {
      startBgm("bonus");
      return;
    }
    startBgm(tab === "selo" ? "selo" : "igra");
  }, [tab, knjigaFaza]);

  useEffect(() => {
    startLocalPersist();
    ucitaj();
  }, [ucitaj]);

  useEffect(() => {
    if (!started || ucitavam) return;
    const seen = window.localStorage.getItem(SAVE_KEYS.onboard);
    if (!seen && ukupnoVrtnji === 0) setOnboard(true);
  }, [started, ucitavam, ukupnoVrtnji]);

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

  const panes = useMemo(
    () => [
      { id: "automat" as const, node: <SlotScreen /> },
      { id: "selo" as const, node: <VillageScreen /> },
      { id: "misije" as const, node: <MissionsScreen /> },
      { id: "trznica" as const, node: <ShopScreen /> },
    ],
    [],
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
    <div className="atmosphere fixed inset-0 flex flex-col overflow-hidden text-ink">
      <div
        ref={shellRef}
        className="game-shell relative z-0 mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col"
      >
        <Header
          muted={muted}
          onToggleMute={onToggleMute}
          nativeFs={native}
          canNativeFs={canNative}
          onToggleFullscreen={() => void toggleFs()}
        />
        <ScreenPager tab={tab} onTab={setTab} panes={panes} />
        <AppNav tab={tab} onTab={setTab} />
        <ObavijestSloj />
      </div>
      {!onboard && <DailyRewardModal />}
      {!onboard && <JutroSheet naTab={setTab} />}
      <OnboardModal open={onboard} onDone={() => setOnboard(false)} />
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

  useEffect(() => {
    document.documentElement.classList.add("is-fs");
    document.body.classList.add("is-fs");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(SAVE_KEYS.mute);
    if (saved === "1") {
      setMutedState(true);
      setMuted(true);
    }
  }, []);

  const start = () => {
    unlockAudio();
    startBgm("igra");
    preloadArt();
    requestNativeFullscreen(document.documentElement);
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

  if (!started) {
    return (
      <button
        type="button"
        className="fixed inset-0 block h-full w-full bg-void"
        onPointerDown={start}
        aria-label="Pokreni igru"
      >
        <Splash loading={false} />
      </button>
    );
  }

  return (
    <UIProvider>
      <GameInner started muted={muted} onToggleMute={toggleMute} />
    </UIProvider>
  );
}
