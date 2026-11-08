import { DNEVNE_NAGRADE } from "./constants";
import type { Nagrada } from "./types";

export type DailySave = { streak?: number; zadnjaDnevna?: string };

const DAY_MS = 86_400_000;

export type DailyNagradaKey = keyof Pick<
  Nagrada,
  "zlato" | "dijamanti" | "energija" | "drvo" | "kamen" | "zeljezo" | "stitovi"
>;

export const NAGRADA_IKONE: Array<{
  key: DailyNagradaKey;
  art: "gold" | "gem" | "energy" | "wood" | "stone" | "iron" | "shield";
}> = [
  { key: "zlato", art: "gold" },
  { key: "dijamanti", art: "gem" },
  { key: "energija", art: "energy" },
  { key: "drvo", art: "wood" },
  { key: "kamen", art: "stone" },
  { key: "zeljezo", art: "iron" },
  { key: "stitovi", art: "shield" },
];

export function localDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Kalendarski dan poslužitelja, Europa/Zagreb. Klijent ovo ne računa sam. */
export function serverDanKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Milisekunde do ponoći u Zagrebu za predani trenutak. */
export function msDoZagrebaPonoci(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zagreb",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const num = (t: string) => {
    const n = Number(parts.find((p) => p.type === t)?.value ?? 0);
    return t === "hour" && n === 24 ? 0 : n;
  };
  const proslo = ((num("hour") * 60 + num("minute")) * 60 + num("second")) * 1000;
  return Math.max(0, DAY_MS - proslo);
}

/** Real dawn for Naredbe zore — rolls back before 06:00 so midnight is still last night. */
export const ZORA_SAT = 6;

export function zoraDanKey(d = new Date()): string {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
  if (t.getHours() < ZORA_SAT) t.setDate(t.getDate() - 1);
  return localDayKey(t);
}

export function msUntilNextZora(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ZORA_SAT, 0, 0, 0);
  if (now.getTime() >= next.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function recDodjiZoru(now = new Date()) {
  return `Dođi u zoru · za ${formatCountdown(msUntilNextZora(now))}`;
}

export function parseDayKey(raw: string | undefined): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return localDayKey(d);
}

export function dayDiff(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const a = Date.UTC(fy!, fm! - 1, fd!);
  const b = Date.UTC(ty!, tm! - 1, td!);
  return Math.round((b - a) / DAY_MS);
}

export function cycleDay(streak: number): number {
  const n = DNEVNE_NAGRADE.length;
  return ((Math.max(1, streak) - 1) % n) + 1;
}

export function nagradaZaStreak(streak: number) {
  return DNEVNE_NAGRADE[cycleDay(streak) - 1]!;
}

export function stavkeNagrade(nagrada: Nagrada): Array<{ key: DailyNagradaKey; iznos: number; art: (typeof NAGRADA_IKONE)[number]["art"] }> {
  return NAGRADA_IKONE.flatMap(({ key, art }) => {
    const iznos = nagrada[key] || 0;
    return iznos > 0 ? [{ key, iznos, art }] : [];
  });
}

export function resolveDaily(save: DailySave | null, today = localDayKey()) {
  if (!save) {
    return { streak: 1, claimedToday: false };
  }
  const last = parseDayKey(save.zadnjaDnevna);
  const streak = Math.max(0, Math.floor(save.streak || 0));
  if (!last) {
    return { streak: Math.max(1, streak || 1), claimedToday: false };
  }
  const diff = dayDiff(last, today);
  if (diff <= 0) {
    return { streak: Math.max(1, streak), claimedToday: true };
  }
  if (diff === 1) {
    return { streak: streak + 1, claimedToday: false };
  }
  return { streak: 1, claimedToday: false };
}

export function msUntilMidnight(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** Croatian “come back tomorrow” line with live midnight countdown. */
export function recDodjiSutra(now = new Date()) {
  return `Dođi sutra · za ${formatCountdown(msUntilMidnight(now))}`;
}

