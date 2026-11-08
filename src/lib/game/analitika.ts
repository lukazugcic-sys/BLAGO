import { APP_VERSION } from "./version";
import { getOrCreateUid } from "./persist";

const KLJUC = "blago-v1:stat";
const IMENA = new Set([
  "session_start",
  "session_end",
  "tutorial_step",
  "tutorial_done",
  "tutorial_skip",
  "spin",
  "build",
  "upgrade",
  "quest_claim",
  "daily_claim",
  "tab_open",
  "purchase_burza",
  "raid",
  "error",
]);

type Dogadaj = { ime: string; t: number; broj?: number; ms?: number; rec?: string };

let ukljuceno = true;
let ucitano = false;
let red: Dogadaj[] = [];
let timer = 0;
let sessionT0 = 0;
let greske = false;

function platforma() {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  try {
    if (cap?.isNativePlatform?.()) return "apk";
  } catch {
    /* web */
  }
  return "web";
}

export function statistikaJeUkljucena() {
  return ukljuceno;
}

export function ucitajStatistiku() {
  if (typeof window === "undefined") return;
  ucitano = true;
  try {
    const raw = window.localStorage.getItem(KLJUC);
    ukljuceno = raw === null ? true : raw === "1";
  } catch {
    ukljuceno = true;
  }
}

export function postaviStatistiku(on: boolean) {
  ukljuceno = on;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KLJUC, on ? "1" : "0");
  } catch {
    /* kvota */
  }
  if (!on) red = [];
}

function skrati(s: string) {
  return s.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
}

export function posaljiDogadaje() {
  if (typeof window === "undefined") return;
  if (timer) {
    window.clearTimeout(timer);
    timer = 0;
  }
  if (!ukljuceno || !red.length) return;
  const tijelo = JSON.stringify({
    id: getOrCreateUid(),
    verzija: APP_VERSION,
    platforma: platforma(),
    dogadaji: red.slice(0, 40),
  });
  red = [];
  try {
    const blob = new Blob([tijelo], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/ev", blob)) return;
  } catch {
    /* fetch */
  }
  void fetch("/api/ev", {
    method: "POST",
    body: tijelo,
    headers: { "content-type": "application/json" },
    keepalive: true,
  }).catch(() => undefined);
}

export function dogadaj(ime: string, extra?: { broj?: number; ms?: number; rec?: string }) {
  if (typeof window === "undefined" || !IMENA.has(ime)) return;
  if (!ucitano) ucitajStatistiku();
  if (!ukljuceno) return;
  const rec = extra?.rec ? skrati(extra.rec) : undefined;
  red.push({
    ime,
    t: Date.now(),
    broj: extra?.broj,
    ms: extra?.ms,
    rec: rec || undefined,
  });
  if (red.length > 40) red = red.slice(-40);
  if (!timer) timer = window.setTimeout(posaljiDogadaje, 15_000);
}

export function sessionStart() {
  if (sessionT0) return;
  sessionT0 = Date.now();
  dogadaj("session_start");
}

export function sessionEnd() {
  if (!sessionT0) return;
  dogadaj("session_end", { ms: Math.max(0, Date.now() - sessionT0) });
  sessionT0 = 0;
  posaljiDogadaje();
}

export function pokreniGreske() {
  if (typeof window === "undefined" || greske) return;
  greske = true;
  window.addEventListener("error", (e) => {
    dogadaj("error", { rec: e.message || "greska" });
  });
  window.addEventListener("unhandledrejection", (e) => {
    const razlog = e.reason instanceof Error ? e.reason.message : String(e.reason ?? "odbijeno");
    dogadaj("error", { rec: razlog });
  });
}
