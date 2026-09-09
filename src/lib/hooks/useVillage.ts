import { useEffect } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { RESOURCE_TICK_MS, izracunajEnergijaRegenMs } from "@/lib/game/economy";

export function useVillage() {
  const timerTick = useGameStore((s) => s.timerTick);
  useEffect(() => {
    let t = 0;
    const arm = () => {
      window.clearTimeout(t);
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const s = useGameStore.getState();
      const now = Date.now();
      const regen = izracunajEnergijaRegenMs(s.razine.baterija || 0);
      let wait = Math.min(
        Math.max(250, (s.zadnjiResursTick || now) + RESOURCE_TICK_MS - now),
        Math.max(250, (s.zadnjaEnergijaTick || now) + regen - now),
      );
      if (s.gradnje.length) wait = Math.min(wait, ...s.gradnje.map((g) => Math.max(200, g.kraj - now)));
      if (s.karavana) wait = Math.min(wait, Math.max(200, s.karavana.kraj - now));
      wait = Math.max(400, Math.min(wait, 8000));
      t = window.setTimeout(() => {
        timerTick();
        arm();
      }, wait);
    };
    timerTick();
    arm();
    const onVis = () => {
      if (document.visibilityState === "visible") {
        timerTick();
        arm();
      } else {
        window.clearTimeout(t);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [timerTick]);
}
