import { FEEL_EVENT, type FeelCips, type FeelRang } from "./feel";

export const CESTICE_MAX = 360;
export const CESTICE_STRIDE = 16;
export const CESTICE_BYTES = CESTICE_STRIDE * 4;
export const CESTICE_EMIT_MAX = 80;
export const CESTICE_GRAV = 110;
export const CESTICE_WG = 64;

type Cestica = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  r: number;
  g: number;
  b: number;
  a: number;
  tx: number;
  ty: number;
  vuci: number;
};

const pool: Cestica[] = Array.from({ length: CESTICE_MAX }, () => prazna());
const pending: Cestica[] = [];
let zadnji: { x: number; y: number } = { x: 0, y: 0 };
let slusaj = false;
let zadnjiEmitDo = 0;

function prazna(): Cestica {
  return {
    x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 4,
    r: 1, g: 0.8, b: 0.3, a: 1, tx: 0, ty: 0, vuci: 0,
  };
}

function slobodna() {
  for (let i = 0; i < pool.length; i++) if (pool[i]!.life <= 0) return pool[i]!;
  return null;
}

function sad() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function cesticeZadnjiDodir(x: number, y: number) {
  zadnji = { x, y };
}

export function chipTocka(id = "zlato") {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(`[data-chip="${id}"]`) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function izvorTocka(sel: string) {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(sel) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

const BOJA = {
  zlato: [0.91, 0.69, 0.29],
  iskra: [1, 0.86, 0.45],
  prasina: [0.62, 0.48, 0.28],
  zica: [0.9, 0.35, 0.22],
  kost: [0.93, 0.88, 0.78],
  gem: [0.83, 0.55, 1],
  drvo: [0.64, 0.35, 0.13],
  kamen: [0.78, 0.8, 0.82],
  zeljezo: [0.71, 0.42, 0.26],
  stit: [0.24, 0.55, 1],
  energija: [1, 0.48, 0.07],
} as const;

export type EmitSpec = {
  n: number;
  x?: number;
  y?: number;
  boja?: keyof typeof BOJA;
  cilj?: { x: number; y: number } | null;
  vuci?: number;
  life?: number;
  size?: number;
  rasprsi?: number;
  grav?: number;
};

const trepniTimer = new Map<string, number>();

function trepniChip(id: string, ms = 420) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const stari = trepniTimer.get(id);
  if (stari) window.clearTimeout(stari);
  const t = window.setTimeout(() => {
    const el = document.querySelector(`[data-chip="${id}"]`);
    if (!el) return;
    el.classList.remove("chip-pogodak");
    void (el as HTMLElement).offsetWidth;
    el.classList.add("chip-pogodak");
    const t2 = window.setTimeout(() => {
      el.classList.remove("chip-pogodak");
      trepniTimer.delete(id);
    }, 520);
    trepniTimer.set(id, t2);
  }, ms);
  trepniTimer.set(id, t);
}

export function emitCestice(spec: EmitSpec) {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const n = Math.max(0, Math.min(spec.n, CESTICE_EMIT_MAX));
  const ox = spec.x ?? zadnji.x;
  const oy = spec.y ?? zadnji.y;
  const [r, g, b] = BOJA[spec.boja ?? "iskra"];
  const rasprsi = spec.rasprsi ?? 90;
  const life = spec.life ?? 0.7;
  const cilj = spec.cilj;
  const vuci = spec.vuci ?? (cilj ? 3.2 : 0);
  const extra = spec.grav ?? 0;
  for (let i = 0; i < n; i++) {
    if (pending.length >= CESTICE_EMIT_MAX * 2) pending.shift();
    const a = Math.random() * Math.PI * 2;
    const s = (0.35 + Math.random()) * rasprsi;
    const L = life * (0.65 + Math.random() * 0.5);
    pending.push({
      x: ox,
      y: oy,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 40 - extra * 0.2,
      life: L,
      max: L,
      size: (spec.size ?? 5) * (0.7 + Math.random() * 0.8),
      r, g, b, a: 1,
      tx: cilj?.x ?? ox,
      ty: cilj?.y ?? oy,
      vuci,
    });
  }
  zadnjiEmitDo = Math.max(zadnjiEmitDo, sad() + life * 1200 + 400);
}

export function emitPrasina(x: number, y: number) {
  emitCestice({ n: 9, x, y, boja: "prasina", rasprsi: 28, life: 0.4, size: 3.8, grav: -24, vuci: 0 });
}

const CHIP_BOJA: Record<string, keyof typeof BOJA> = {
  zlato: "zlato",
  dijamanti: "gem",
  drvo: "drvo",
  kamen: "kamen",
  zeljezo: "zeljezo",
  željezo: "zeljezo",
  stitovi: "stit",
  energija: "energija",
};

const CHIP_DOM: Record<string, string> = {
  zeljezo: "željezo",
  stitovi: "štitovi",
};

export function emitDobitak(cips: FeelCips | undefined, x?: number, y?: number) {
  const o = { x: x ?? zadnji.x, y: y ?? zadnji.y };
  const unosi = cips
    ? (Object.entries(cips) as [keyof FeelCips, number | undefined][]).filter(([, n]) => (n ?? 0) > 0)
    : [];
  if (unosi.length === 0) {
    emitCestice({ n: 22, x: o.x, y: o.y, boja: "zlato", cilj: chipTocka("zlato"), vuci: 3.6, life: 0.9, size: 6, rasprsi: 80 });
    trepniChip("zlato");
    return;
  }
  for (const [k, n] of unosi) {
    const chip = CHIP_DOM[k] ?? k;
    const boja = CHIP_BOJA[k] ?? "iskra";
    emitCestice({
      n: Math.min(28, 5 + Math.round(Math.min(20, n ?? 1))),
      x: o.x,
      y: o.y,
      boja,
      cilj: chipTocka(chip),
      vuci: 3.8,
      life: 0.85,
      size: 5.2,
      rasprsi: 70,
    });
    trepniChip(chip);
  }
}

const RANG_EMIT: Partial<Record<FeelRang, (cips?: FeelCips) => void>> = {
  hold: () =>
    emitCestice({ n: 8, boja: "iskra", rasprsi: 46, life: 0.38, size: 3.2 }),
  spin: () => {
    const o = izvorTocka('[data-testid="zavrti"]') ?? zadnji;
    emitCestice({ n: 4, x: o.x, y: o.y, boja: "iskra", rasprsi: 48, life: 0.28, size: 2.6 });
  },
  collect: (cips) => {
    const o = izvorTocka('[data-testid="zavrti"]') ?? zadnji;
    emitDobitak(cips, o.x, o.y);
  },
  win: (cips) => {
    const o = izvorTocka('[data-testid="zavrti"]') ?? izvorTocka(".slot-reel-stol") ?? zadnji;
    emitDobitak(cips, o.x, o.y);
  },
  jackpot: (cips) => {
    const o = izvorTocka('[data-testid="zavrti"]') ?? izvorTocka(".slot-reel-stol") ?? zadnji;
    emitDobitak(cips, o.x, o.y);
    emitCestice({ n: 8, x: o.x, y: o.y, boja: "gem", rasprsi: 72, life: 0.55, size: 3.4 });
  },
  skull: () => {
    const o = izvorTocka('[data-testid="zavrti"]') ?? zadnji;
    emitCestice({ n: 18, x: o.x, y: o.y, boja: "zica", rasprsi: 100, life: 0.7, size: 4.2, grav: 90 });
    emitCestice({ n: 8, x: o.x, y: o.y, boja: "kost", rasprsi: 70, life: 0.8, size: 5, grav: 110 });
  },
  raid: () => {
    const o = izvorTocka('[data-testid="mreza-platno"]') ?? zadnji;
    emitCestice({ n: 36, x: o.x, y: o.y + 40, boja: "prasina", rasprsi: 160, life: 1.1, size: 6, grav: -20, vuci: 0 });
  },
  build: () => {
    emitCestice({ n: 16, boja: "zlato", rasprsi: 64, life: 0.55, size: 4, cilj: chipTocka("zlato"), vuci: 2.4 });
    trepniChip("zlato", 360);
  },
};

export function cesticeNaFeel(rang: FeelRang, x?: number, y?: number, cips?: FeelCips) {
  if (x != null && y != null) zadnji = { x, y };
  RANG_EMIT[rang]?.(cips);
}

export function slusajCesticeFeel() {
  if (slusaj || typeof window === "undefined") return () => {};
  slusaj = true;
  const onPtr = (e: PointerEvent) => cesticeZadnjiDodir(e.clientX, e.clientY);
  const onFeel = (e: Event) => {
    const d = (e as CustomEvent<{ rang?: FeelRang; x?: number; y?: number; cips?: FeelCips }>).detail;
    if (!d?.rang) return;
    cesticeNaFeel(d.rang, d.x, d.y, d.cips);
  };
  window.addEventListener("pointerdown", onPtr, { passive: true });
  window.addEventListener(FEEL_EVENT, onFeel);
  return () => {
    slusaj = false;
    window.removeEventListener("pointerdown", onPtr);
    window.removeEventListener(FEEL_EVENT, onFeel);
  };
}

export function tickCestice(dt: number) {
  const t = Math.min(0.05, Math.max(0, dt));
  if (t === 0) return;
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i]!;
    if (p.life <= 0) continue;
    p.life -= t;
    if (p.life <= 0) {
      p.life = 0;
      continue;
    }
    if (p.vuci > 0) {
      p.vx += (p.tx - p.x) * p.vuci * t;
      p.vy += (p.ty - p.y) * p.vuci * t;
    }
    p.vy += CESTICE_GRAV * t;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.x += p.vx * t;
    p.y += p.vy * t;
  }
}

export function nacrtaCestice2d(ctx: CanvasRenderingContext2D) {
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i]!;
    if (p.life <= 0) continue;
    const k = Math.max(0, p.life / p.max);
    const a = k * k;
    const s = p.size * (0.65 + 0.35 * k);
    ctx.beginPath();
    ctx.fillStyle = `rgba(${(p.r * 255) | 0},${(p.g * 255) | 0},${(p.b * 255) | 0},${a})`;
    ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

function packJednu(out: Float32Array, i: number, p: Cestica) {
  const o = i * CESTICE_STRIDE;
  out[o] = p.x;
  out[o + 1] = p.y;
  out[o + 2] = p.vx;
  out[o + 3] = p.vy;
  out[o + 4] = p.life;
  out[o + 5] = p.size;
  out[o + 6] = p.max;
  out[o + 7] = p.vuci;
  out[o + 8] = p.r;
  out[o + 9] = p.g;
  out[o + 10] = p.b;
  out[o + 11] = p.a;
  out[o + 12] = p.tx;
  out[o + 13] = p.ty;
  out[o + 14] = 0;
  out[o + 15] = 0;
}

export function pakirajCestice(out: Float32Array) {
  let n = 0;
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i]!;
    if (p.life <= 0) {
      const o = n * CESTICE_STRIDE;
      out[o + 4] = 0;
      n++;
      continue;
    }
    packJednu(out, n, p);
    n++;
  }
  return n;
}

export function pakirajPending(out: Float32Array) {
  const n = Math.min(pending.length, CESTICE_EMIT_MAX);
  for (let i = 0; i < n; i++) packJednu(out, i, pending[i]!);
  pending.splice(0, n);
  return n;
}

export function primiPendingUBazen() {
  for (let i = 0; i < pending.length; i++) {
    const src = pending[i]!;
    const p = slobodna();
    if (!p) break;
    p.x = src.x; p.y = src.y; p.vx = src.vx; p.vy = src.vy;
    p.life = src.life; p.max = src.max; p.size = src.size;
    p.r = src.r; p.g = src.g; p.b = src.b; p.a = src.a;
    p.tx = src.tx; p.ty = src.ty; p.vuci = src.vuci;
  }
  pending.length = 0;
}

export function cesticeZive() {
  let n = pending.length;
  for (let i = 0; i < pool.length; i++) if (pool[i]!.life > 0) n++;
  return n;
}

export function cesticeTrebaCrtati() {
  if (pending.length > 0) return true;
  for (let i = 0; i < pool.length; i++) if (pool[i]!.life > 0) return true;
  return sad() < zadnjiEmitDo;
}
