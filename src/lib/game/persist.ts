const PREFIX = "blago-v1";

export const SAVE_KEYS = {
  game: `${PREFIX}:game`,
  ach: `${PREFIX}:ach`,
  daily: `${PREFIX}:daily`,
  uid: `${PREFIX}:uid`,
  mute: `${PREFIX}:mute`,
  onboard: `${PREFIX}:onboard`,
  room: `${PREFIX}:room`,
} as const;

export function loadJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / private mode
  }
}

export function getOrCreateUid() {
  if (typeof window === "undefined") return "local";
  const existing = window.localStorage.getItem(SAVE_KEYS.uid);
  if (existing) return existing;
  const uid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `p-${Date.now()}`;
  window.localStorage.setItem(SAVE_KEYS.uid, uid);
  return uid;
}
