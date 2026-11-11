/**
 * Hod kaube: logika na 10 Hz, crtanje interpolira.
 * Nizovi su fiksni. tick() i ispis() ne alociraju.
 * Izvan kadra se faza i dalje vrti, ali DOM se ne dira.
 */
/** 0.9.175: 8 heroja + 2 kola + pas (+ rezerva); prije 8. */
export const AGENT_CAP = 16;
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
  /** 1: ruta se prijeđe jednom pa agent čeka na kraju (hod do cilja). */
  readonly jednom = new Uint8Array(AGENT_CAP);
  /** simT kad je agent dobio trenutnu rutu. */
  readonly t0 = new Float32Array(AGENT_CAP);
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
      this.jednom[i] = 0;
      this.t0[i] = 0;
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

  /** 0.9.177: preskoči kadar bez nadoknade (hodači stoje dok se karta vuče, pa nastave bez skoka). */
  preskoci(now: number) {
    if (this.primed) this.last = now;
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
      const u = ((t - this.t0[i]!) * this.brzina[i]!) / (r.ukupno || 1) + this.faza0[i]!;
      if (this.jednom[i] && (u >= 1 || r.n <= 1)) {
        const z = Math.max(0, r.n - 1) * 2;
        ox[i] = r.xy[z] ?? 0;
        oy[i] = r.xy[z + 1] ?? 0;
        continue;
      }
      uzorakRute(r, this.jednom[i] && u < 0 ? 0 : u, ox, oy, i);
    }
  }

  /**
   * Agent i dobiva novu rutu od trenutnog trenutka. `slot` je mjesto u nizu ruta
   * (pozivatelj drži jedno po agentu). Pozicija se ne prekida: nova ruta mora
   * počinjati u trenutnoj točki agenta.
   */
  zamijeniRutu(i: number, slot: number, r: RutaFlat, faza: number, jednom: boolean) {
    if (i < 0 || i >= this.count) return;
    this.rute[slot] = r;
    this.ruta[i] = slot;
    this.t0[i] = this.simT;
    this.faza0[i] = faza;
    this.jednom[i] = jednom ? 1 : 0;
    // Nova ruta počinje u trenutnoj točki; poravnaj i prethodni položaj da lerp ne klizi sa stare rute.
    if (jednom && faza >= 1) {
      const z = Math.max(0, r.n - 1) * 2;
      this.x[i] = r.xy[z] ?? 0;
      this.y[i] = r.xy[z + 1] ?? 0;
    } else {
      uzorakRute(r, faza, this.x, this.y, i);
    }
    this.prevX[i] = this.x[i]!;
    this.prevY[i] = this.y[i]!;
    this.ix[i] = this.x[i]!;
    this.iy[i] = this.y[i]!;
  }

  /** Prijeđena udaljenost na trenutnoj ruti (za jednom: stisnuto na [0, duljina]). */
  napredak(i: number): number {
    const r = this.rute[this.ruta[i]!] ?? this.rute[0];
    if (!r) return 0;
    const d = (this.simT - this.t0[i]!) * this.brzina[i]! + this.faza0[i]! * r.ukupno;
    return this.jednom[i] ? Math.max(0, Math.min(r.ukupno, d)) : d;
  }

  /** true kad je jednosmjerni agent stigao na kraj rute. */
  stigao(i: number): boolean {
    if (!this.jednom[i]) return false;
    const r = this.rute[this.ruta[i]!];
    return !r || this.napredak(i) >= r.ukupno - 1e-3;
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
