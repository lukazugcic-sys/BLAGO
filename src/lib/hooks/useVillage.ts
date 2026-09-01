import { useEffect } from "react";
import { useGameStore } from "@/lib/stores/gameStore";

export function useVillage() {
  const timerTick = useGameStore((s) => s.timerTick);
  useEffect(() => {
    timerTick();
    const timer = setInterval(timerTick, 1000);
    const onVis = () => {
      if (document.visibilityState === "visible") timerTick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [timerTick]);
}
