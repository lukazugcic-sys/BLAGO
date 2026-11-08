import { useEffect } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { vidljiviInterval } from "@/lib/game/helpers";

export function useMarket() {
  const timerMarket = useGameStore((s) => s.timerMarket);
  useEffect(() => vidljiviInterval(timerMarket, 45000), [timerMarket]);
}
