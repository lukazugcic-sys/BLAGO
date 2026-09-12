import { useState } from "react";
import { ScreenTabs } from "./ScreenTabs";
import { ClanScreen } from "./ClanScreen";
import { LeaderboardScreen } from "./LeaderboardScreen";
import { LivePohod } from "./LivePohod";
import { ArtTraka } from "./ArtTraka";
import { SideGateKartica } from "./SideGateKartica";
import { ART } from "@/lib/game/art";
import { jeSideOtkljucan, SIDE_GATE_REC } from "@/lib/game/sideGate";
import { useGameStore } from "@/lib/stores/gameStore";

const TABS = [
  { id: "pohod", label: "Pohod" },
  { id: "klan", label: "Klan" },
  { id: "ljestvica", label: "Ljestvica" },
] as const;

export function SocialHub() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pohod");
  const otkljucan = useGameStore((s) => jeSideOtkljucan(s.gradevine));
  const setPoruka = useGameStore((s) => s.setPoruka);
  return (
    <div className="mx-auto w-full max-w-lg px-3 pb-8 pt-2">
      <ArtTraka
        src={tab === "pohod" ? ART.pustinjaci : tab === "klan" ? ART.ceh : ART.drustvo}
        label={tab === "pohod" ? "Pohod" : tab === "klan" ? "Klan" : "Ljestvica"}
      />
      <ScreenTabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        locked={otkljucan ? undefined : { pohod: true, klan: true, ljestvica: true }}
        onLocked={() => setPoruka(SIDE_GATE_REC)}
      />
      {!otkljucan ? (
        <SideGateKartica naslov="Društvo" />
      ) : tab === "pohod" ? (
        <LivePohod />
      ) : tab === "klan" ? (
        <ClanScreen embedded />
      ) : (
        <LeaderboardScreen embedded />
      )}
    </div>
  );
}
