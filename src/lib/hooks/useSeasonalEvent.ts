import { useEffect, useState } from "react";
import { dohvatiAktivniDogadaj } from "@/lib/game/sezonalniDogadaji";

export function useSeasonalEvent() {
  const [aktivniDogadaj, setAktivniDogadaj] = useState(dohvatiAktivniDogadaj);

  useEffect(() => {
    setAktivniDogadaj(dohvatiAktivniDogadaj());
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      setAktivniDogadaj(dohvatiAktivniDogadaj());
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return aktivniDogadaj;
}
