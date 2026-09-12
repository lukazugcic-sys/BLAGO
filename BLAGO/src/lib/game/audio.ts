type Tone = { freq: number; dur: number; type?: OscillatorType; gain?: number };
type Sfx =
  | "spin"
  | "win"
  | "jackpot"
  | "attack"
  | "collect"
  | "button"
  | "build"
  | "skull";
export type BgmId = "igra" | "selo" | "bonus";

/** 1925 PD 78s for BGM. Saloon-piano tones for every cue. */
const FILES: Record<Sfx, string[]> = {
  spin: ["/sfx/spin.mp3"],
  win: ["/sfx/win.mp3"],
  jackpot: ["/sfx/jackpot.mp3"],
  attack: ["/sfx/attack.mp3"],
  collect: ["/sfx/collect.mp3"],
  button: ["/sfx/button.mp3"],
  build: ["/sfx/build.mp3"],
  skull: ["/sfx/skull.mp3"],
};

const PLAYLIST: Record<BgmId, string[]> = {
  igra: [
    "/music/pd/georgia.mp3",
    "/music/pd/yessir.mp3",
    "/music/pd/sitting.mp3",
    "/music/pd/ukulele.mp3",
    "/music/pd/milenberg.mp3",
    "/music/pd/alabamy.mp3",
    "/music/pd/dinah.mp3",
    "/music/rags/maple.mp3",
  ],
  selo: [
    "/music/pd/jesse.mp3",
    "/music/pd/mountain.mp3",
    "/music/pd/afterball.mp3",
    "/music/pd/tennessee.mp3",
    "/music/rags/oldetimey.mp3",
    "/music/rags/breaktime.mp3",
  ],
  bonus: [
    "/music/pd/milenberg.mp3",
    "/music/pd/dinah.mp3",
    "/music/rags/maple.mp3",
    "/music/pd/yessir.mp3",
    "/music/pd/ukulele.mp3",
    "/music/pd/alabamy.mp3",
  ],
};

const SFX_GAIN: Record<Sfx, number> = {
  button: 0.04,
  spin: 0.06,
  build: 0.05,
  collect: 0.07,
  win: 0.08,
  jackpot: 0.1,
  attack: 0.06,
  skull: 0.07,
};

const MASTER_GAIN = 0.38;
const MUSIC_GAIN = 0.22;
const MUSIC_DUCK = 0.16;
const FADE_S = 1.35;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let muted = false;
let loadStarted = false;
const buffers: Partial<Record<Sfx, AudioBuffer[]>> = {};
const musicBuffers: Record<string, AudioBuffer> = {};
let musicSrc: AudioBufferSourceNode | null = null;
let musicFade: GainNode | null = null;
let currentTrack: BgmId | null = null;
let queue: string[] = [];
let qIndex = 0;
let duckTimer: number | null = null;
let musicGen = 0;
let starting = false;
const liveSfx: Partial<Record<Sfx, AudioBufferSourceNode>> = {};

function shuffle<T>(items: T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

function ensureCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.gain.value = 1;
    musicBus.gain.value = MUSIC_GAIN;

    const musicLp = ctx.createBiquadFilter();
    musicLp.type = "lowpass";
    musicLp.frequency.value = 12000;
    musicLp.Q.value = 0.5;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 10;
    comp.ratio.value = 2.6;
    comp.attack.value = 0.008;
    comp.release.value = 0.16;

    sfxBus.connect(comp);
    musicBus.connect(musicLp);
    musicLp.connect(comp);
    comp.connect(master);
    master.gain.value = muted ? 0 : MASTER_GAIN;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

async function decodeUrl(c: AudioContext, url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url);
  const raw = await res.arrayBuffer();
  return c.decodeAudioData(raw.slice(0));
}

async function ensureTrack(url: string) {
  if (musicBuffers[url]) return musicBuffers[url];
  const c = ensureCtx();
  if (!c) return null;
  try {
    const buf = await decodeUrl(c, url);
    musicBuffers[url] = buf;
    return buf;
  } catch {
    return null;
  }
}

function keepTracks(urls: Array<string | null>) {
  const keep = new Set(urls.filter((u): u is string => Boolean(u)));
  for (const k of Object.keys(musicBuffers)) {
    if (!keep.has(k)) delete musicBuffers[k];
  }
}

function peekUrl(offset = 0): string | null {
  if (!currentTrack) return null;
  if (!queue.length) queue = shuffle(PLAYLIST[currentTrack] ?? []);
  if (!queue.length) return null;
  return queue[(qIndex + offset + queue.length) % queue.length] ?? null;
}

async function preload() {
  const c = ensureCtx();
  if (!c || loadStarted) return;
  loadStarted = true;
  const entries = Object.entries(FILES) as Array<[Sfx, string[]]>;
  await Promise.all(
    entries.map(async ([tip, urls]) => {
      const loaded: AudioBuffer[] = [];
      for (const url of urls) {
        try {
          loaded.push(await decodeUrl(c, url));
        } catch {
          /* piano beep fallback */
        }
      }
      if (loaded.length) buffers[tip] = loaded;
    }),
  );
  if (currentTrack && !musicSrc && !starting) playNext(true);
}

export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === "suspended") void c.resume();
  void preload();
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const c = ensureCtx();
    if (c && c.state === "suspended") void c.resume();
    if (currentTrack && !musicSrc && !starting) playNext(true);
  });
}

export function setMuted(next: boolean) {
  muted = next;
  if (master && ctx) {
    master.gain.setTargetAtTime(next ? 0 : MASTER_GAIN, ctx.currentTime, 0.04);
  }
}

export function isMuted() {
  return muted;
}

function fadeOutCurrent() {
  const src = musicSrc;
  const g = musicFade;
  musicSrc = null;
  musicFade = null;
  if (!src || !ctx) return;
  const t = ctx.currentTime;
  if (g) {
    g.gain.cancelScheduledValues(t);
    const now = Math.max(0.0001, g.gain.value || 0.0001);
    g.gain.setValueAtTime(now, t);
    g.gain.linearRampToValueAtTime(0.0001, t + FADE_S);
  }
  window.setTimeout(() => {
    try {
      src.stop();
    } catch {
      /* already stopped */
    }
    src.disconnect();
    g?.disconnect();
  }, FADE_S * 1000 + 60);
}

function playNext(cross = false) {
  const c = ensureCtx();
  if (!c || !musicBus || !currentTrack) return;
  const url = peekUrl(0);
  if (!url) return;
  const gen = musicGen;
  starting = true;
  void ensureTrack(url).then((buf) => {
    starting = false;
    if (gen !== musicGen) return;
    if (!buf) {
      qIndex += 1;
      playNext(true);
      return;
    }
    if (!currentTrack || !musicBus || !ctx) return;
    if (musicSrc) fadeOutCurrent();
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buf;
    src.loop = false;
    const rate = currentTrack === "bonus" ? 1.2 : 1;
    src.playbackRate.value = rate;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + (cross ? FADE_S : Math.min(0.7, FADE_S)));
    src.connect(g);
    g.connect(musicBus);
    src.start();
    musicSrc = src;
    musicFade = g;
    let advanced = false;
    const advance = () => {
      if (advanced || gen !== musicGen) return;
      advanced = true;
      qIndex += 1;
      playNext(true);
    };
    const lead = Math.min(FADE_S, Math.max(0.5, buf.duration * 0.08));
    const wait = Math.max(80, (buf.duration / rate - lead) * 1000);
    const timer = window.setTimeout(advance, wait);
    src.onended = () => {
      window.clearTimeout(timer);
      if (musicSrc === src) {
        musicSrc = null;
        musicFade = null;
        if (!advanced) advance();
      }
      src.disconnect();
      g.disconnect();
    };
    const next = peekUrl(1);
    if (next) void ensureTrack(next).then(() => keepTracks([url, next]));
    else keepTracks([url]);
  });
}

export function startBgm(track: BgmId = "igra") {
  ensureCtx();
  void preload();
  if (currentTrack === track) {
    if (!musicSrc && !starting) playNext(true);
    return;
  }
  currentTrack = track;
  musicGen += 1;
  queue = shuffle(PLAYLIST[track] ?? []);
  qIndex = 0;
  playNext(!!musicSrc);
}

export function duckMusic(ms = 720) {
  const c = ensureCtx();
  if (!c || !musicBus || muted) return;
  if (duckTimer != null) window.clearTimeout(duckTimer);
  musicBus.gain.setTargetAtTime(MUSIC_DUCK, c.currentTime, 0.05);
  duckTimer = window.setTimeout(() => {
    if (!musicBus || !ctx) return;
    musicBus.gain.setTargetAtTime(MUSIC_GAIN, ctx.currentTime, 0.18);
    duckTimer = null;
  }, ms);
}

function beep(tones: Tone[]) {
  const c = ensureCtx();
  if (!c || !sfxBus || muted) return;
  const now = c.currentTime;
  let t = now;
  for (const tone of tones) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = tone.type ?? "triangle";
    osc.frequency.setValueAtTime(tone.freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime((tone.gain ?? 0.18) * 0.4, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + tone.dur);
    osc.connect(g);
    g.connect(sfxBus);
    osc.start(t);
    osc.stop(t + tone.dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
    t += tone.dur * 0.72;
  }
}

function playBuffer(tip: Sfx) {
  const c = ensureCtx();
  if (!c || !sfxBus || muted) return false;
  const list = buffers[tip];
  if (!list?.length) return false;
  const prev = liveSfx[tip];
  if (prev && (tip === "spin" || tip === "skull" || tip === "button")) {
    try {
      prev.stop();
    } catch {
      /* ended */
    }
  }
  const buf = list[0]!;
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buf;
  const level = SFX_GAIN[tip];
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(level, c.currentTime + 0.01);
  src.connect(g);
  g.connect(sfxBus);
  src.start();
  src.onended = () => {
    if (liveSfx[tip] === src) delete liveSfx[tip];
    src.disconnect();
    g.disconnect();
  };
  liveSfx[tip] = src;
  return true;
}

export function playSfx(tip: Sfx) {
  if (tip === "win") duckMusic(520);
  if (tip === "jackpot") duckMusic(900);
  if (tip === "skull") duckMusic(640);
  if (playBuffer(tip)) return;
  switch (tip) {
    case "spin":
      beep([
        { freq: 523, dur: 0.09, type: "triangle", gain: 0.12 },
        { freq: 659, dur: 0.08, type: "triangle", gain: 0.1 },
      ]);
      break;
    case "win":
      beep([
        { freq: 262, dur: 0.08, type: "triangle", gain: 0.12 },
        { freq: 330, dur: 0.08, type: "triangle", gain: 0.13 },
        { freq: 392, dur: 0.08, type: "triangle", gain: 0.14 },
        { freq: 523, dur: 0.16, type: "sine", gain: 0.15 },
      ]);
      break;
    case "jackpot":
      beep([
        { freq: 262, dur: 0.07, type: "triangle", gain: 0.12 },
        { freq: 330, dur: 0.07, type: "triangle", gain: 0.13 },
        { freq: 392, dur: 0.07, type: "triangle", gain: 0.14 },
        { freq: 523, dur: 0.08, type: "triangle", gain: 0.15 },
        { freq: 659, dur: 0.1, type: "sine", gain: 0.16 },
        { freq: 784, dur: 0.14, type: "sine", gain: 0.15 },
      ]);
      break;
    case "attack":
      beep([
        { freq: 98, dur: 0.12, type: "triangle", gain: 0.16 },
        { freq: 131, dur: 0.12, type: "triangle", gain: 0.14 },
      ]);
      break;
    case "skull":
      beep([
        { freq: 165, dur: 0.12, type: "triangle", gain: 0.14 },
        { freq: 196, dur: 0.12, type: "triangle", gain: 0.13 },
        { freq: 233, dur: 0.16, type: "triangle", gain: 0.12 },
      ]);
      break;
    case "collect":
      beep([
        { freq: 784, dur: 0.1, type: "sine", gain: 0.12 },
        { freq: 659, dur: 0.12, type: "sine", gain: 0.11 },
      ]);
      break;
    case "button":
      beep([{ freq: 659, dur: 0.06, type: "triangle", gain: 0.08 }]);
      break;
    case "build":
      beep([
        { freq: 262, dur: 0.09, type: "triangle", gain: 0.12 },
        { freq: 392, dur: 0.1, type: "triangle", gain: 0.1 },
      ]);
      break;
  }
}

export function vibrate(ms = 18) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}
