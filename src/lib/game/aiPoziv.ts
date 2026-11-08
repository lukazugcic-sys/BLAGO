export const AI_URL = "https://blago-ai.blago-igra.workers.dev/v1/spawn";

const STANKA_MS = 10 * 60 * 1000;
const KLJUC_UREDJAJ = "blago-v1:uredjaj";
const KLJUC_STANKA = "blago-v1:ai-stanka";

export type AiSpremnik = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

export type AiOdgovor = { ok: boolean; status: number; json: () => Promise<unknown> };

export type AiDohvat = (url: string, init: RequestInit) => Promise<AiOdgovor>;

const mem = new Map<string, string>();
let stankaDo = 0;

const memorija: AiSpremnik = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => {
    mem.set(k, v);
  },
};

function podrazumijevani(): AiSpremnik {
  if (typeof localStorage !== "undefined") return localStorage;
  return memorija;
}

export function resetAiPoziv() {
  mem.clear();
  stankaDo = 0;
}

export function installId(s: AiSpremnik = podrazumijevani()): string {
  try {
    const cur = s.getItem(KLJUC_UREDJAJ);
    if (cur && cur.length >= 8 && cur.length <= 80) return cur;
    const id = crypto.randomUUID();
    s.setItem(KLJUC_UREDJAJ, id);
    return id;
  } catch {
    return "lokalno";
  }
}

export function aiUStanci(sad = Date.now(), s?: AiSpremnik) {
  if (stankaDo > sad) return true;
  const sprem = s ?? podrazumijevani();
  try {
    const doT = Number(sprem.getItem(KLJUC_STANKA));
    if (Number.isFinite(doT) && doT > sad) {
      stankaDo = doT;
      return true;
    }
  } catch {
    /* tiho */
  }
  return false;
}

function postaviStanku(sad: number, s: AiSpremnik) {
  stankaDo = sad + STANKA_MS;
  try {
    s.setItem(KLJUC_STANKA, String(stankaDo));
  } catch {
    /* tiho */
  }
}

export async function aiPoziv(
  body: unknown,
  opts?: { fetch?: AiDohvat; sad?: number; rokMs?: number; spremnik?: AiSpremnik },
): Promise<unknown | null> {
  const s = opts?.spremnik ?? podrazumijevani();
  const sad = opts?.sad ?? Date.now();
  if (aiUStanci(sad, s)) return null;
  const f = opts?.fetch ?? ((url: string, init: RequestInit) => fetch(url, init));
  const rok = opts?.rokMs ?? 8000;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), rok);
  try {
    const r = await f(AI_URL, {
      method: "POST",
      signal: ac.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Blago-Install": installId(s),
      },
      body: JSON.stringify(body),
    });
    if (r.status === 403 || r.status === 429) {
      postaviStanku(sad, s);
      return null;
    }
    if (!r.ok) return null;
    try {
      return await r.json();
    } catch {
      return null;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
