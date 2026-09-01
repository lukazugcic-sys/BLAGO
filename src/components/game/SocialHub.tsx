import { useState } from "react";
import { ScreenTabs } from "./ScreenTabs";
import { ClanScreen } from "./ClanScreen";
import { LeaderboardScreen } from "./LeaderboardScreen";
import { LivePohod } from "./LivePohod";
import { ArtTraka } from "./ArtTraka";
import { ART } from "@/lib/game/art";

const TABS = [
  { id: "pohod", label: "Pohod" },
  { id: "klan", label: "Klan" },
  { id: "ljestvica", label: "Ljestvica" },
] as const;

export function SocialHub() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pohod");
  return (
    <div className="mx-auto w-full max-w-lg px-3 pb-8 pt-2">
      <ArtTraka
        src={tab === "pohod" ? ART.pustinjaci : tab === "klan" ? ART.ceh : ART.drustvo}
        label={tab === "pohod" ? "Pohod" : tab === "klan" ? "Klan" : "Ljestvica"}
      />
      <ScreenTabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "pohod" ? (
        <LivePohod />
      ) : tab === "klan" ? (
        <ClanScreen embedded />
      ) : (
        <LeaderboardScreen embedded />
      )}
    </div>
  );
}
