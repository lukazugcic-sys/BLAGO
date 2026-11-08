import { useEffect, useState } from "react";

type Sub = (sad: number) => void;

const pretplate = new Set<Sub>();
let timer = 0;
let vezan = false;

function otkucaj() {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  const sad = Date.now();
  pretplate.forEach((fn) => fn(sad));
}

function osiguraj() {
  if (vezan || typeof window === "undefined") return;
  vezan = true;
  timer = window.setInterval(otkucaj, 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") otkucaj();
  });
}

/** Jedan sekundni sat za cijelu igru. Pauza dok je kartica skrivena. */
export function pretplatiSat(fn: Sub) {
  osiguraj();
  pretplate.add(fn);
  return () => {
    pretplate.delete(fn);
  };
}

export function useSekunda(aktivan = true) {
  const [sad, setSad] = useState(() => Date.now());
  useEffect(() => {
    if (!aktivan) return;
    setSad(Date.now());
    return pretplatiSat(setSad);
  }, [aktivan]);
  return sad;
}
