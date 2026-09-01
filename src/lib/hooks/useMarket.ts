import { useEffect } from "react";
import { useGameStore } from "@/lib/stores/gameStore";

export function useMarket() {
  const timerMarket = useGameStore((s) => s.timerMarket);
  useEffect(() => {
    const timer = setInterval(timerMarket, 45000);
    return () => clearInterval(timer);
  }, [timerMarket]);
}
