/**
 * Hod kaube: logika na 10 Hz, crtanje interpolira.
 * Nizovi su fiksni. tick() i ispis() ne alociraju.
 * Izvan kadra se faza i dalje vrti, ali DOM se ne dira.
 */
export const AGENT_CAP = 8;
export const TICK_MS = 100;
const TICK_S = TICK_MS / 1000;

export type RutaFlat = {
  xy: Float32Array;
  len: Float32Array;
  n: number;
  ukupno: number;
};

export function spljostiRutu(tocke: readonly { x: number; y: number }[]): RutaFlat {
  const n = tocke.length;
  const xy = new Float32Array(Math.max(2, n * 2));
  const len = new Float32Array(Math.max(1, n));
  let ukupno = 0;
  for (let i = 0; i < n; i++) {
    xy[i * 2] = tocke[i]!.x;
    xy[i * 2 + 1] = tocke[i]!.y;
    if (i > 0) {
      const dx = xy[i * 2] - xy[(i - 1) * 2];
      const dy = xy[i * 2 + 1] - xy[(i - 1) * 2 + 1];
      ukupno += Math.hypot(dx, dy);
    }
    len[i] = ukupno;
  }
  return { xy, len, n, ukupno };
}

export function uzorakRute(r: RutaFlat, u: number, ox: Float32Array, oy: Float32Array, i: number) {
  const n = r.n;
  if (n <= 0) {
    ox[i] = 0;
    oy[i] = 0;
    return;
  }
  if (n === 1 || r.ukupno <= 0) {
    ox[i] = r.xy[0]!;
    oy[i] = r.xy[1]!;
    return;
  }
  const w = u - Math.floor(u);
  let d = (w < 0 ? w + 1 : w) * r.ukupno;
  const len = r.len;
  const xy = r.xy;
  for (let k = 1; k < n; k++) {
    if (d <= len[k]!) {
      const span = len[k]! - len[k - 1]! || 1;
      const t = (d - len[k - 1]!) / span;
      const a = (k - 1) * 2;
      const b = k * 2;
      ox[i] = xy[a]! + (xy[b]! - xy[a]!) * t;
      oy[i] = xy[a + 1]! + (xy[b + 1]! - xy[a + 1]!) * t;
      return;
    }
  }
  ox[i] = xy[(n - 1) * 2]!;
  oy[i] = xy[(n - 1) * 2 + 1]!;
}

export type AgentUlaz = { ruta: number; brzina: number; faza: number; tip: number };

export class AgentSim {
  readonly x = new Float32Array(AGENT_CAP);
  readonly y = new Float32Array(AGENT_CAP);
  readonly prevX = new Float32Array(AGENT_CAP);
  readonly prevY = new Float32Array(AGENT_CAP);
  readonly ix = new Float32Array(AGENT_CAP);
  readonly iy = new Float32Array(AGENT_CAP);
  readonly brzina = new Float32Array(AGENT_CAP);
  readonly faza0 = new Float32Array(AGENT_CAP);
  readonly ruta = new Int8Array(AGENT_CAP);
  readonly tip = new Int8Array(AGENT_CAP);
  readonly vidljiv = new Uint8Array(AGENT_CAP);
  readonly zadnjiZ = new Int16Array(AGENT_CAP);
  readonly unutar = new Uint8Array(AGENT_CAP);
  count = 0;
  simT = 0;
  alpha = 0;
  /** 1 kad je kadar predug: preskoči alat i klasu, samo pomak. */
  teret = 0;
  private last = 0;
  private acc = 0;
  private primed = false;
  private rute: RutaFlat[] = [];

  postavi(rute: RutaFlat[], ulaz: readonly AgentUlaz[]) {
    this.rute = rute;
    const n = Math.min(AGENT_CAP, ulaz.length);
    this.count = n;
    this.simT = 0;
    this.last = 0;
    this.acc = 0;
    this.alpha = 0;
    this.teret = 0;
    this.primed = false;
    for (let i = 0; i < AGENT_CAP; i++) {
      this.vidljiv[i] = 1;
      this.zadnjiZ[i] = -9999;
      this.unutar[i] = 0;
    }
    for (let i = 0; i < n; i++) {
      const a = ulaz[i]!;
      this.ruta[i] = a.ruta;
      this.brzina[i] = a.brzina;
      this.faza0[i] = a.faza;
      this.tip[i] = a.tip;
    }
    this.uzmi(0, this.x, this.y);
    this.prevX.set(this.x);
    this.prevY.set(this.y);
  }

  /** Vraća 0–1 za lerp. Najviše 3 tika po kadru. */
  frame(now: number): number {
    if (!this.primed) {
      this.primed = true;
      this.last = now;
      this.alpha = 0;
      this.teret = 0;
      this.ispis();
      return 0;
    }
    let gap = now - this.last;
    this.last = now;
    if (gap < 0) gap = 0;
    this.teret = gap > 40 ? 1 : 0;
    if (gap > 250) gap = 250;
    this.acc += gap;
    let koraka = 0;
    while (this.acc >= TICK_MS && koraka < 3) {
      this.prevX.set(this.x);
      this.prevY.set(this.y);
      this.simT += TICK_S;
      this.uzmi(this.simT, this.x, this.y);
      this.acc -= TICK_MS;
      koraka++;
    }
    this.alpha = this.acc / TICK_MS;
    this.ispis();
    return this.alpha;
  }

  private uzmi(t: number, ox: Float32Array, oy: Float32Array) {
    const n = this.count;
    for (let i = 0; i < n; i++) {
      const r = this.rute[this.ruta[i]!] ?? this.rute[0];
      if (!r) {
        ox[i] = 0;
        oy[i] = 0;
        continue;
      }
      const u = (t * this.brzina[i]!) / (r.ukupno || 1) + this.faza0[i]!;
      uzorakRute(r, u, ox, oy, i);
    }
  }

  private ispis() {
    const a = this.alpha;
    const b = 1 - a;
    const n = this.count;
    for (let i = 0; i < n; i++) {
      this.ix[i] = this.prevX[i]! * b + this.x[i]! * a;
      this.iy[i] = this.prevY[i]! * b + this.y[i]! * a;
    }
  }
}
